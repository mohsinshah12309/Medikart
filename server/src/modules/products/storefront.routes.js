const express = require("express");
const router = express.Router();
const Product = require("./product.model");
const Category = require("../categories/category.model");
const Condition = require("../conditions/condition.model");
const { getStorewideDiscount } = require("../settings/settings.service");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getDeliveryCharge } = require("../cities/city.service");
const { formatProductWithImages } = require("./product.service");
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
        .populate("categoryIds", "name slug discount active")
        .sort({ name: 1 })
        .skip(skip)
        .limit(l),
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
        .populate("categoryIds", "name slug discount active"),
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

// GET /api/v1/categories - Public category listing with Redis caching
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

    const categories = await Category.find({ active: true }).sort({ name: 1 });
    const responseBody = {
      status: "success",
      results: categories.length,
      data: { categories },
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
