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
const { cacheService, CACHE_POLICIES } = require("../../services/cache/cacheService");
const cacheMetrics = require("../../services/cache/cacheMetrics");

// Dev-only cache logger to avoid production event-loop and I/O overhead
const logCache = (type, key) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Cache ${type}] key=${key}`);
  }
};

// GET /api/v1/sitemap/products - Ultra-fast endpoint for complete SEO sitemap generation
router.get("/sitemap/products", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:sitemap:products";
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.SITEMAP,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const activeCategories = await Category.find({ active: true }, { _id: 1 }).lean();
        const activeCategoryIds = activeCategories.map((c) => c._id);

        const products = await Product.find(
          { active: true, categoryIds: { $in: activeCategoryIds } },
          { _id: 1, updatedAt: 1 }
        ).lean();

        return {
          status: "success",
          total: products.length,
          data: { products },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products - Public listing/browsing
router.get("/products", async (req, res, next) => {
  try {
    const rawSearch = typeof req.query.search === "string" ? req.query.search : "";
    const rawCategoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : "";
    const rawCondition = typeof req.query.condition === "string" ? req.query.condition : "";
    const { isNarcotic, page = 1, limit = 20 } = req.query;

    const parsedPage = parseInt(page, 10);
    const p = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const parsedLimit = parseInt(limit, 10);
    const l = !isNaN(parsedLimit) && parsedLimit >= 1 ? Math.min(parsedLimit, 100) : 20;

    const search = rawSearch.trim();
    const categoryId = rawCategoryId.trim();
    const condition = rawCondition.trim();

    // Track search query popularity asynchronously in background
    if (search) {
      recordSearch(search).catch((err) =>
        console.error("[SearchTracking] Error recording search:", err.message)
      );
    }

    // Cache check with lease locking and SWR stampede protection
    const cacheKey = `cache:storefront:products:search:${search || ""}:cat:${categoryId || ""}:cond:${condition || ""}:narcotic:${isNarcotic || ""}:page:${p}:limit:${l}`;
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCTS_LISTING,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {

    // Load active category IDs to filter out products in disabled categories
    const activeCategories = await Category.find({ active: true }, { _id: 1 }).lean();
    const activeCategoryIds = activeCategories.map((c) => c._id);

    const query = {
      active: true,
      categoryIds: { $in: activeCategoryIds },
    };

    if (search) {
      const trimmedSearch = search.trim();
      const escapedSearch = trimmedSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const tokens = trimmedSearch.split(/\s+/).filter((t) => t.length >= 2).map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

      const buildFieldMatches = (term) => [
        { name: { $regex: term, $options: "i" } },
        { genericName: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { keywords: { $regex: term, $options: "i" } },
        { tags: { $regex: term, $options: "i" } },
      ];

      if (tokens.length > 1) {
        const tokenConditions = tokens.map((token) => ({
          $or: buildFieldMatches(token),
        }));

        query.$or = [
          ...buildFieldMatches(escapedSearch),
          { $and: tokenConditions },
        ];
      } else {
        query.$or = buildFieldMatches(escapedSearch);
      }
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
    let [products, storewidePercent, totalCount] = await Promise.all([
      Product.find(query)
        .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
        .populate("categoryIds", "name slug discount active")
        .sort({ name: 1 })
        .skip(skip)
        .limit(l)
        .lean(),
      getStorewideDiscount(),
      Product.countDocuments(query),
    ]);

    // Relaxed search fallback: If a multi-word search produced 0 results, match any word so users always get relevant results
    if (totalCount === 0 && search) {
      const tokens = search.trim().split(/\s+/).filter((t) => t.length >= 2).map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
      if (tokens.length > 1) {
        const relaxedOr = tokens.flatMap((token) => [
          { name: { $regex: token, $options: "i" } },
          { genericName: { $regex: token, $options: "i" } },
          { description: { $regex: token, $options: "i" } },
          { keywords: { $regex: token, $options: "i" } },
          { tags: { $regex: token, $options: "i" } },
        ]);
        const relaxedQuery = {
          ...query,
          $or: relaxedOr,
        };

        const [fallbackProducts, fallbackCount] = await Promise.all([
          Product.find(relaxedQuery)
            .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
            .populate("categoryIds", "name slug discount active")
            .sort({ name: 1 })
            .skip(skip)
            .limit(l)
            .lean(),
          Product.countDocuments(relaxedQuery),
        ]);

        if (fallbackCount > 0) {
          products = fallbackProducts;
          totalCount = fallbackCount;
        }
      }
    }

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

        return {
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
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id - Public detail
router.get("/products/:id", async (req, res, next) => {
  try {
    const cacheKey = `cache:storefront:product:${req.params.id}`;
    const result = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCT_DETAIL,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const [product, storewidePercent] = await Promise.all([
          Product.findOne({ _id: req.params.id, active: true })
            .populate("categoryIds", "name slug discount active")
            .lean(),
          getStorewideDiscount(),
        ]);

        if (!product) {
          return null;
        }

        const formatted = formatProductWithImages(product);
        const category = formatted.categoryIds?.[0] ?? null;
        const { effectivePrice, appliedDiscount, discountPercent } = getEffectivePrice(
          formatted,
          category,
          storewidePercent
        );

        return {
          status: "success",
          data: {
            product: {
              ...formatted,
              effectivePrice,
              appliedDiscount,
              discountPercent,
            },
          },
        };
      },
    });

    if (!result) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id/related - AI / Smart Brand Line & Contextual Related Products
router.get("/products/:id/related", async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = !isNaN(parsedLimit) && parsedLimit >= 1 ? Math.min(parsedLimit, 24) : 12;

    const cacheKey = `cache:storefront:product:${id}:related:limit:${limit}`;
    const result = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCT_RELATED,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const currentProduct = await Product.findOne({ _id: id, active: true }).lean();
        if (!currentProduct) {
          return null;
        }

    const storewidePercent = await getStorewideDiscount();

    // 1. Extract clean brand root name (e.g. "Ensure", "Panadol", "Aptamil", "Augmentin")
    const cleanName = currentProduct.name.replace(/[\(\)\[\]]/g, " ");
    const nameWords = cleanName.split(/\s+/).filter(Boolean);
    const stopWords = new Set([
      "the", "and", "for", "with", "plus", "extra", "forte", "tablet", "tablets", "capsule", "capsules",
      "syrup", "suspension", "drops", "drop", "injection", "infusion", "cream", "gel", "lotion", "ointment",
      "powder", "powdered", "milk", "sachet", "sachets", "solution", "spray", "oil", "shampoo", "wash",
      "pack", "box", "bottle", "strip", "tube", "jar", "tin", "mg", "ml", "gm", "g", "kg", "mcg", "iu"
    ]);

    const brandCandidates = nameWords.filter(
      (w) => !stopWords.has(w.toLowerCase()) && !/^\d+/.test(w) && w.length >= 3
    );
    const brandRoot = brandCandidates[0] || nameWords[0] || "";

    const relatedMap = new Map();

    const addProductsWithScore = (productsList, scoreBoost) => {
      productsList.forEach((prod) => {
        if (String(prod._id) === String(id)) return;
        const key = String(prod._id);
        const existing = relatedMap.get(key);
        if (existing) {
          existing.score += scoreBoost;
        } else {
          relatedMap.set(key, { product: prod, score: scoreBoost });
        }
      });
    };

    const queries = [];

    // Tier 1: Brand Line / Same product family / Flavor & size variants (Highest priority)
    if (brandRoot && brandRoot.length >= 3) {
      const brandRegex = new RegExp(`(^|\\s|\\()${brandRoot.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, "i");
      queries.push(
        Product.find({
          _id: { $ne: id },
          active: true,
          name: brandRegex,
        })
          .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
          .populate("categoryIds", "name slug discount active")
          .limit(20)
          .lean()
          .then((res) => addProductsWithScore(res, 1000))
      );
    }

    // Tier 2: Same Active Ingredient / Generic Equivalent (Second priority)
    if (currentProduct.genericName && currentProduct.genericName.trim().length > 3) {
      const genericWord = currentProduct.genericName.trim().split(/[,;+\/]/)[0].trim();
      if (genericWord.length >= 3) {
        const genRegex = new RegExp(genericWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "i");
        queries.push(
          Product.find({
            _id: { $ne: id },
            active: true,
            genericName: genRegex,
          })
            .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
            .populate("categoryIds", "name slug discount active")
            .limit(15)
            .lean()
            .then((res) => addProductsWithScore(res, 500))
        );
      }
    }

    // Tier 3: Matching Keywords / Indications (Third priority)
    if (Array.isArray(currentProduct.keywords) && currentProduct.keywords.length > 0) {
      queries.push(
        Product.find({
          _id: { $ne: id },
          active: true,
          keywords: { $in: currentProduct.keywords },
        })
          .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
          .populate("categoryIds", "name slug discount active")
          .limit(15)
          .lean()
          .then((res) => addProductsWithScore(res, 250))
      );
    }

    // Tier 4: Same Specific Primary Category Alternatives & Substitutes (Complementary variety)
    const primaryCatId = currentProduct.categoryIds?.[0];
    if (primaryCatId) {
      queries.push(
        Product.find({
          _id: { $ne: id },
          active: true,
          categoryIds: primaryCatId,
        })
          .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
          .populate("categoryIds", "name slug discount active")
          .sort({ name: 1 })
          .limit(20)
          .lean()
          .then((res) => addProductsWithScore(res, 50))
      );
    }

    await Promise.all(queries);

    // Fallback if empty
    if (relatedMap.size === 0) {
      const fallbackList = await Product.find({ _id: { $ne: id }, active: true })
        .populate("categoryIds", "name slug discount active")
        .limit(limit)
        .lean();
      addProductsWithScore(fallbackList, 10);
    }

    // Sort by score descending, then by stockStatus (in-stock first), then alphabetically
    const scoredList = Array.from(relatedMap.values());
    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aInStock = a.product.stockStatus !== "out_of_stock";
      const bInStock = b.product.stockStatus !== "out_of_stock";
      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      return (a.product.name || "").localeCompare(b.product.name || "");
    });

    const finalProducts = scoredList.slice(0, limit).map(({ product: prod }) => {
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

        return {
          status: "success",
          results: finalProducts.length,
          data: {
            brandRoot,
            products: finalProducts,
          },
        };
      },
    });

    if (!result) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/categories - Public category listing with Redis caching (1 hour TTL, SWR & lease protection)
router.get("/categories", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:categories";
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.CATEGORIES,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const categories = await Category.find({ active: true }).sort({ name: 1 }).lean();
        return {
          status: "success",
          results: categories.length,
          data: { categories },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/search/suggestions and /api/v1/products/suggestions (Dvago-style Autocomplete & Trending)
const getSuggestionsHandler = async (req, res, next) => {
  try {
    const rawQ = typeof req.query.q === "string" ? req.query.q : (typeof req.query.search === "string" ? req.query.search : "");
    const q = rawQ.trim();
    const cacheKey = `cache:storefront:suggestions:${q ? q.toLowerCase() : "__trending__"}`;

    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.SEARCH_SUGGESTIONS,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const storewidePercent = await getStorewideDiscount();
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

        return responseBody;
      }

    const escapedQ = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escapedQ, "i");
    const wordBoundaryRegex = new RegExp(`(^|\\s)${escapedQ}`, "i");
    const cleanQ = q.trim().toLowerCase();

    // Parallel lookup of matching products and matching categories
    const [rawProducts, rawCategories] = await Promise.all([
      Product.find({
        active: true,
        $or: [
          { name: regex },
          { genericName: regex },
          { keywords: regex },
          { tags: regex },
        ],
      })
        .select("name genericName price sku isNarcotic requiresPrescription stockStatus images discount active categoryIds")
        .populate("categoryIds", "name slug discount active")
        .limit(30)
        .lean(),
      Category.find({
        active: true,
        $or: [{ name: regex }, { slug: regex }],
      })
        .select("name slug image icon active")
        .limit(6)
        .lean(),
    ]);

    // Relevance scoring function
    const scoreProduct = (prod) => {
      let score = 0;
      const nameLower = (prod.name || "").toLowerCase();
      const genericLower = (prod.genericName || "").toLowerCase();
      const descLower = (prod.description || "").toLowerCase();
      const keywordsString = Array.isArray(prod.keywords) ? prod.keywords.join(" ").toLowerCase() : (typeof prod.keywords === "string" ? prod.keywords.toLowerCase() : "");
      const tagsString = Array.isArray(prod.tags) ? prod.tags.join(" ").toLowerCase() : (typeof prod.tags === "string" ? prod.tags.toLowerCase() : "");

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

      // 6. Keywords & Tags match
      if (keywordsString.includes(cleanQ)) score += 100;
      if (tagsString.includes(cleanQ)) score += 50;

      // 7. Description match
      if (descLower.includes(cleanQ)) score += 30;

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

        return {
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
      },
    });

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
      return res.status(400).json({ status: "error", message: "Query string is required" });
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
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.TRENDING_SEARCHES,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const storewidePercent = await getStorewideDiscount();
        const [trendingSearches, trendingProducts] = await Promise.all([
          getTrendingSearches(limit),
          getTrendingProducts(10, storewidePercent),
        ]);

        return {
          status: "success",
          data: {
            trendingSearches,
            trendingProducts,
          },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/delivery-charge - Public delivery charge calculator
router.get("/delivery-charge", async (req, res, next) => {
  try {
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    if (!city) {
      return res.status(400).json({ status: "error", message: "City query parameter is required" });
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
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.CITIES,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const { getAllCities } = require("../cities/city.service");
        const cities = await getAllCities({ active: true });
        return {
          status: "success",
          results: cities.length,
          data: { cities },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/content - Public read-only page content for About/Contact pages with Redis caching
router.get("/content", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:content";
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.CONTENT,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const { getPageContent } = require("../settings/settings.service");
        const content = await getPageContent();
        return {
          status: "success",
          data: content,
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cache/metrics - Live observability metrics for cache hits, misses, and lease contention
router.get("/cache/metrics", (req, res) => {
  res.status(200).json({
    status: "success",
    data: cacheMetrics.getMetrics(),
  });
});

module.exports = router;
