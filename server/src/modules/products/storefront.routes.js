const express = require("express");
const router = express.Router();
const Product = require("./product.model");
const Category = require("../categories/category.model");
const Condition = require("../conditions/condition.model");
const { getStorewideDiscount } = require("../settings/settings.service");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getDeliveryCharge } = require("../cities/city.service");
const { formatProductWithImages } = require("./product.service");
const { recordSearch, getTrendingSearches, getTrendingProducts } = require("../search/search.service");
const redisClient = require("../../config/redisClient");

// Dev-only cache logger to avoid production event-loop and I/O overhead
const logCache = (type, key) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Cache ${type}] key=${key}`);
  }
};

// GET /api/v1/products - Public listing/browsing
router.get("/products", async (req, res, next) => {
  try {
    const { search, categoryId, condition, isNarcotic, page = 1, limit = 20 } = req.query;
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;

    // Track search query popularity asynchronously in background
    if (search && search.trim()) {
      recordSearch(search).catch((err) =>
        console.error("[SearchTracking] Error recording search:", err.message)
      );
    }

    // Cache check (bypassable for load testing)
    const cacheKey = `cache:storefront:products:search:${search || ""}:cat:${categoryId || ""}:cond:${condition || ""}:narcotic:${isNarcotic || ""}:page:${p}:limit:${l}`;
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (err) {
      console.error("[Cache] Read error:", err.message);
    }

    if (cached) {
      logCache("HIT", cacheKey);
      const data = JSON.parse(cached);
      return res.status(200).json(data);
    }
    logCache("MISS", cacheKey);

    // Load active category IDs to filter out products in disabled categories
    const activeCategories = await Category.find({ active: true }, { _id: 1 }).lean();
    const activeCategoryIds = activeCategories.map((c) => c._id);

    const query = {
      active: true,
      categoryIds: { $in: activeCategoryIds },
    };

    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { genericName: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    if (categoryId) {
      if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        query.categoryIds = categoryId;
      } else {
        const catDoc = await Category.findOne({ slug: categoryId, active: true }).lean();
        if (catDoc) {
          query.categoryIds = catDoc._id;
        }
      }
    }

    if (condition) {
      // Look up condition by slug or ID
      const condDoc = await Condition.findOne({
        $or: [
          { slug: condition },
          ...(condition.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: condition }] : []),
        ],
        active: true,
      }).lean();

      if (condDoc) {
        const condOr = [];
        if (condDoc.linkedCategoryIds && condDoc.linkedCategoryIds.length > 0) {
          condOr.push({ categoryIds: { $in: condDoc.linkedCategoryIds } });
        }
        if (condDoc.linkedProductIds && condDoc.linkedProductIds.length > 0) {
          condOr.push({ _id: { $in: condDoc.linkedProductIds } });
        }
        if (condOr.length > 0) {
          query.$or = query.$or ? { $and: [{ $or: query.$or }, { $or: condOr }] } : condOr;
        }
      }
    }

    if (isNarcotic !== undefined) {
      query.isNarcotic = isNarcotic === "true";
    }

    const skip = (p - 1) * l;

    // Parallelize independent DB reads (Product.find, storewide discount, countDocuments)
    const [products, storewidePercent, totalCount] = await Promise.all([
      Product.find(query)
        .select("name genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
        .populate("categoryIds", "name slug discount active")
        .sort({ name: 1 })
        .skip(skip)
        .limit(l)
        .lean(),
      getStorewideDiscount(),
      Product.countDocuments(query),
    ]);

    const formattedProducts = products.map((prod) => {
      const formatted = formatProductWithImages(prod);
      const category = formatted.categoryIds?.[0] ?? null;
      const { effectivePrice, appliedDiscount, discountPercent } = getEffectivePrice(
        formatted,
        category,
        storewidePercent
      );
      
      return {
        ...formatted,
        effectivePrice,
        appliedDiscount,
        discountPercent,
      };
    });

    const responseBody = {
      status: "success",
      results: formattedProducts.length,
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        pages: Math.ceil(totalCount / l),
      },
      data: { products: formattedProducts },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (err) {
      console.error("[Cache] Write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id - Public detail
router.get("/products/:id", async (req, res, next) => {
  try {
    const cacheKey = `cache:storefront:product:${req.params.id}`;
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (err) {
      console.error("[Cache] Read error:", err.message);
    }

    if (cached) {
      logCache("HIT", cacheKey);
      const data = JSON.parse(cached);
      return res.status(200).json(data);
    }
    logCache("MISS", cacheKey);

    const [product, storewidePercent] = await Promise.all([
      Product.findOne({ _id: req.params.id, active: true })
        .populate("categoryIds", "name slug discount active")
        .lean(),
      getStorewideDiscount(),
    ]);

    if (!product) {
      return res.status(404).json({ status: "fail", message: "Product not found" });
    }

    const formatted = formatProductWithImages(product);
    const category = formatted.categoryIds?.[0] ?? null;
    const { effectivePrice, appliedDiscount, discountPercent } = getEffectivePrice(
      formatted,
      category,
      storewidePercent
    );

    const responseBody = {
      status: "success",
      data: {
        product: {
          ...formatted,
          effectivePrice,
          appliedDiscount,
          discountPercent,
        }
      },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (err) {
      console.error("[Cache] Write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/categories - Public category listing with Redis caching (1 hour TTL)
router.get("/categories", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:categories";
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (err) {
      console.error("[Cache] Read error:", err.message);
    }

    if (cached) {
      logCache("HIT", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }
    logCache("MISS", cacheKey);

    const categories = await Category.find({ active: true }).sort({ name: 1 }).lean();
    const responseBody = {
      status: "success",
      results: categories.length,
      data: { categories },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 3600); // 1 hour TTL
    } catch (err) {
      console.error("[Cache] Write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/search/suggestions and /api/v1/products/suggestions (Dvago-style Autocomplete & Trending)
const getSuggestionsHandler = async (req, res, next) => {
  try {
    const q = (req.query.q || req.query.search || "").trim();
    const storewidePercent = await getStorewideDiscount();

    // Cache key for suggestions (short TTL 60s)
    const cacheKey = `cache:storefront:suggestions:${q ? q.toLowerCase() : "__trending__"}`;
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (err) {
      console.error("[Cache] Read error:", err.message);
    }

    if (cached) {
      logCache("HIT", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }
    logCache("MISS", cacheKey);

    if (!q) {
      // Return dynamic Trending Searches and expanded Trending Products
      const [trendingList, trendingProducts] = await Promise.all([
        getTrendingSearches(15),
        getTrendingProducts(12, storewidePercent),
      ]);

      // Array of string terms for compatibility with existing string consumers
      const trendingSearches = trendingList.map((t) => t.name);

      const responseBody = {
        status: "success",
        data: {
          trendingSearches,
          trendingItems: trendingList, // Rich objects with { name, icon, count }
          trendingProducts,
          matchingSearches: [],
          matchingProducts: [],
          matchingCategories: [],
        },
      };

      try {
        await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 60);
      } catch (_) {}

      return res.status(200).json(responseBody);
    }

    const escapedQ = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escapedQ, "i");
    const wordBoundaryRegex = new RegExp(`(^|\\s)${escapedQ}`, "i");
    const cleanQ = q.trim().toLowerCase();

    // Parallel lookup of matching products and matching categories
    const [rawProducts, rawCategories] = await Promise.all([
      Product.find({
        active: true,
        $or: [{ name: regex }, { genericName: regex }, { tags: regex }],
      })
        .populate("categoryIds", "name slug discount active")
        .limit(40),
      Category.find({
        active: true,
        $or: [{ name: regex }, { slug: regex }],
      }).limit(6),
    ]);

    // Relevance scoring function
    const scoreProduct = (prod) => {
      let score = 0;
      const nameLower = (prod.name || "").toLowerCase();
      const genericLower = (prod.genericName || "").toLowerCase();
      const tagsString = Array.isArray(prod.tags) ? prod.tags.join(" ").toLowerCase() : "";

      // 1. Exact match on name
      if (nameLower === cleanQ) score += 1000;
      // 2. Name starts with query
      else if (nameLower.startsWith(cleanQ)) score += 600;
      // 3. Name contains query at word boundary
      else if (wordBoundaryRegex.test(prod.name || "")) score += 400;
      // 4. Name contains query substring
      else if (nameLower.includes(cleanQ)) score += 200;

      // 5. Generic name match
      if (genericLower === cleanQ) score += 150;
      else if (genericLower.startsWith(cleanQ)) score += 100;
      else if (wordBoundaryRegex.test(prod.genericName || "")) score += 80;
      else if (genericLower.includes(cleanQ)) score += 40;

      // 6. Tags match
      if (tagsString.includes(cleanQ)) score += 20;

      // In-stock preference
      if (prod.stockStatus !== "out_of_stock" && (prod.stock ?? 1) > 0) score += 10;

      return score;
    };

    // Sort products by descending relevance score, then alphabetically
    const scoredProducts = rawProducts
      .map((p) => ({ product: p, score: scoreProduct(p) }))
      .sort((a, b) => b.score - a.score || (a.product.name || "").localeCompare(b.product.name || ""));

    const sortedProducts = scoredProducts.map((sp) => sp.product);

    const matchingProducts = sortedProducts.slice(0, 8).map((prod) => {
      const formatted = formatProductWithImages(prod);
      const category = formatted.categoryIds?.[0] ?? null;
      const { effectivePrice, appliedDiscount, discountPercent } = getEffectivePrice(
        formatted,
        category,
        storewidePercent
      );
      return {
        ...formatted,
        effectivePrice,
        appliedDiscount,
        discountPercent,
      };
    });

    // Generate intelligent, relevant search phrases
    // Prioritize product names that directly contain or start with the user's query
    const searchTermsSet = new Set();
    
    // First: Names starting with query
    sortedProducts.forEach((p) => {
      if (p.name && p.name.toLowerCase().startsWith(cleanQ)) {
        searchTermsSet.add(p.name);
      }
    });

    // Second: Names containing query at word boundary or substring
    sortedProducts.forEach((p) => {
      if (p.name && p.name.toLowerCase().includes(cleanQ)) {
        searchTermsSet.add(p.name);
      }
    });

    // Third: Generic names matching query
    sortedProducts.forEach((p) => {
      if (p.genericName && p.genericName.toLowerCase().includes(cleanQ)) {
        searchTermsSet.add(p.genericName);
      }
    });

    const matchingSearches = Array.from(searchTermsSet).slice(0, 6);

    // Sort categories: startsWith first
    const sortedCategories = rawCategories.sort((a, b) => {
      const aStarts = (a.name || "").toLowerCase().startsWith(cleanQ);
      const bStarts = (b.name || "").toLowerCase().startsWith(cleanQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    const matchingCategories = sortedCategories.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      image: c.image || null,
    }));

    const responseBody = {
      status: "success",
      data: {
        query: q,
        matchingSearches,
        matchingProducts,
        matchingCategories,
        trendingSearches: [],
        trendingProducts: [],
      },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 60);
    } catch (_) {}

    return res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

router.get("/search/suggestions", getSuggestionsHandler);
router.get("/products/suggestions", getSuggestionsHandler);

// POST /api/v1/search/record - Record a search query to update dynamic search popularity
router.post("/search/record", async (req, res, next) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ status: "fail", message: "Query string is required" });
    }

    const recorded = await recordSearch(query);

    // Invalidate suggestion/trending caches so next fetch is immediately fresh
    try {
      await Promise.all([
        redisClient.del("cache:storefront:suggestions:__trending__"),
        redisClient.del("cache:storefront:trending-searches"),
      ]);
    } catch (_) {}

    res.status(200).json({
      status: "success",
      message: "Search recorded successfully",
      data: recorded,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/trending-searches - Public dynamic trending searches and products
router.get("/trending-searches", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 12;
    const cacheKey = `cache:storefront:trending-searches:limit:${limit}`;
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (_) {}

    if (cached) {
      logCache("HIT", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }
    logCache("MISS", cacheKey);

    const storewidePercent = await getStorewideDiscount();
    const [trendingSearches, trendingProducts] = await Promise.all([
      getTrendingSearches(limit),
      getTrendingProducts(10, storewidePercent),
    ]);

    const responseBody = {
      status: "success",
      data: {
        trendingSearches,
        trendingProducts,
      },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 60);
    } catch (_) {}

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/delivery-charge - Public delivery charge calculator
router.get("/delivery-charge", async (req, res, next) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ status: "fail", message: "City query parameter is required" });
    }
    const charge = await getDeliveryCharge(city);
    res.status(200).json({
      status: "success",
      data: {
        city,
        deliveryCharge: charge,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cities - Public listing of active cities with Redis caching
router.get("/cities", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:cities";
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (err) {
      console.error("[Cache] Read error:", err.message);
    }

    if (cached) {
      logCache("HIT", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }
    logCache("MISS", cacheKey);

    const { getAllCities } = require("../cities/city.service");
    const cities = await getAllCities({ active: true });
    const responseBody = {
      status: "success",
      results: cities.length,
      data: { cities },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (err) {
      console.error("[Cache] Write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/content - Public read-only page content for About/Contact pages with Redis caching
router.get("/content", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:content";
    let cached = null;
    try {
      if (req.query.bypassCache !== "true") {
        cached = await redisClient.get(cacheKey);
      }
    } catch (err) {
      console.error("[Cache] Read error:", err.message);
    }

    if (cached) {
      logCache("HIT", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }
    logCache("MISS", cacheKey);

    const { getPageContent } = require("../settings/settings.service");
    const content = await getPageContent();
    const responseBody = {
      status: "success",
      data: content,
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (err) {
      console.error("[Cache] Write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
