const express = require("express");
const mongoose = require("mongoose");
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

        const filter = { active: true };
        if (activeCategoryIds.length > 0) {
          filter.$or = [
            { categoryIds: { $in: activeCategoryIds } },
            { categoryIds: { $exists: false } },
            { categoryIds: { $size: 0 } },
            { categoryId: { $in: activeCategoryIds } }
          ];
        }

        const products = await Product.find(
          filter,
          { _id: 1, slug: 1, name: 1, price: 1, images: 1, stockStatus: 1, requiresPrescription: 1, updatedAt: 1 }
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

// GET /api/v1/feeds/google-merchant.xml - Official Google Merchant Center RSS 2.0 XML Feed
// Policy-compliant: Excludes controlled narcotics & prescription-only drugs.
// Formats price in PKR, includes <g:identifier_exists>no</g:identifier_exists>, and accurate Google categories.
router.get("/feeds/google-merchant.xml", async (req, res, next) => {
  try {
    const siteUrl = process.env.CLIENT_URL || "https://medikart.pk";
    const medicinesCat = await Category.findOne({ slug: "medicines" }).select("_id").lean();
    const medicinesId = medicinesCat ? medicinesCat._id.toString() : null;

    const products = await Product.find({ active: true })
      .populate("categoryIds", "name slug")
      .lean();

    const escapeXml = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const narcoticsRegex = /\b(alprazolam|diazepam|lorazepam|tramadol|clonazepam|morphine|codeine|midazolam|buprenorphine|fentanyl|zolpidem|phenobarbital|ketamine|methadone|pentazocine|bromazepam|clobazam|flurazepam|temazepam|chlordiazepoxide|xanax|valium|tramal)\b/i;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Medikart - Authentic Online Pharmacy &amp; Healthcare Pakistan</title>
    <link>${siteUrl}</link>
    <description>Authentic OTC healthcare essentials, vitamins, supplements, mother &amp; baby care, and personal wellness products delivered across Pakistan with Cash on Delivery.</description>
`;

    for (const prod of products) {
      const name = prod.name || "";
      const generic = prod.genericName || "";
      const desc = prod.description || "";

      // 1. Strict Google Shopping compliance: zero tolerance for narcotics & controlled substances
      if (prod.isNarcotic || narcoticsRegex.test(name) || narcoticsRegex.test(generic) || narcoticsRegex.test(desc)) {
        continue;
      }

      // 2. Exclude prescription-only pharmaceuticals
      if (prod.requiresPrescription) {
        continue;
      }

      // Exclude products that only belong to the prescription "medicines" category
      const catList = Array.isArray(prod.categoryIds) ? prod.categoryIds : [];
      const catIds = catList.map((c) => (c._id ? c._id.toString() : c.toString()));
      if (medicinesId && catIds.length === 1 && catIds[0] === medicinesId) {
        continue;
      }

      // 3. Price validation: must be a positive number
      const priceNum = typeof prod.price === "number" ? prod.price : parseFloat(prod.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        continue;
      }
      const price = priceNum.toFixed(2);

      // 4. Image validation: must have genuine image, avoid generic placeholder
      let imgLink = "";
      if (prod.images && prod.images.length > 0 && prod.images[0].path) {
        const p = prod.images[0].path;
        if (!p.includes("placeholder") && !p.includes("icon-512")) {
          imgLink = p.startsWith("http") ? p : `${siteUrl}${p.startsWith("/") ? "" : "/"}${p}`;
        }
      }
      if (!imgLink) {
        continue;
      }

      const id = prod.sku || prod._id.toString();
      const title = prod.name ? `${prod.name}${generic ? ` (${generic})` : ""}` : "Healthcare Product";
      const productDesc = desc || `Order genuine ${prod.name} online in Pakistan on Medikart. Authentic pharmacy stock with Cash on Delivery.`;
      const link = `${siteUrl}/products/${prod.slug || prod._id.toString()}`;
      const availability = prod.stockStatus === "out_of_stock" || (typeof prod.stock === "number" && prod.stock <= 0) ? "out_of_stock" : "in_stock";

      // 5. Intelligent Google Product Category Taxonomy mapping
      let googleCategory = "Health & Beauty > Health Care";
      let categoryName = "Health Care";
      const primaryCat = catList[0];
      const catSlug = primaryCat?.slug || "";
      if (primaryCat?.name) categoryName = primaryCat.name;

      if (catSlug === "otc") {
        googleCategory = "Health & Beauty > Health Care > Medicine & Drugs > Over-the-Counter Medicine";
      } else if (catSlug === "vitamins" || catSlug === "nutraceutical") {
        googleCategory = "Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements";
      } else if (catSlug === "dermatology" || catSlug === "hair-care") {
        googleCategory = "Health & Beauty > Personal Care > Cosmetics > Skin Care";
      } else if (catSlug === "diapers-napkins" || catSlug === "milk-powder") {
        googleCategory = "Baby & Toddler > Diapering > Diapers";
      } else if (catSlug === "diagnostics" || catSlug === "patient-supports" || catSlug === "surgical-items") {
        googleCategory = "Health & Beauty > Health Care > Medical Tests & Monitors";
      }

      const brandName = prod.manufacturer && prod.manufacturer.trim() ? prod.manufacturer.trim() : "Medikart";

      xml += `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(productDesc)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imgLink)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price} PKR</g:price>
      <g:brand>${escapeXml(brandName)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(categoryName)}</g:product_type>
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard Nationwide Delivery</g:service>
        <g:price>0.00 PKR</g:price>
      </g:shipping>
    </item>
`;
    }

    xml += `  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    return res.status(200).send(xml);
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
    const rawBrand = typeof req.query.brand === "string" ? req.query.brand : "";
    const { isNarcotic, page = 1, limit = 20, cursor = "" } = req.query;

    const parsedPage = parseInt(page, 10);
    const p = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const parsedLimit = parseInt(limit, 10);
    const l = !isNaN(parsedLimit) && parsedLimit >= 1 ? Math.min(parsedLimit, 100) : 20;

    const search = rawSearch.trim();
    const categoryId = rawCategoryId.trim();
    const condition = rawCondition.trim();
    const brand = rawBrand.trim();
    const cursorStr = typeof cursor === "string" ? cursor.trim() : "";

    // Track search query popularity asynchronously in background
    if (search) {
      recordSearch(search).catch((err) =>
        console.error("[SearchTracking] Error recording search:", err.message)
      );
    }

    // Cache check with lease locking and SWR stampede protection
    const cacheKey = `cache:storefront:products:search:${search || ""}:cat:${categoryId || ""}:cond:${condition || ""}:brand:${brand || ""}:narcotic:${isNarcotic || ""}:page:${p}:limit:${l}:cursor:${cursorStr || ""}`;
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

    if (brand) {
      const brandRegex = new RegExp(brand.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      const brandMatch = [
        { name: brandRegex },
        { keywords: brandRegex },
        { tags: brandRegex },
        { description: brandRegex },
      ];
      query.$or = query.$or ? { $and: [{ $or: query.$or }, { $or: brandMatch }] } : brandMatch;
    }

    // Cursor-based seek support (NFR-PERF-02): avoids O(N) skip cost on large catalogs
    let cursorFilter = null;
    if (cursorStr) {
      try {
        const decoded = JSON.parse(Buffer.from(cursorStr, "base64").toString("utf8"));
        if (decoded?.name && decoded?.id) {
          cursorFilter = {
            $or: [
              { name: { $gt: decoded.name } },
              { name: decoded.name, _id: { $gt: new mongoose.Types.ObjectId(decoded.id) } },
            ],
          };
        }
      } catch (_) {
        if (mongoose.Types.ObjectId.isValid(cursorStr)) {
          cursorFilter = { _id: { $gt: new mongoose.Types.ObjectId(cursorStr) } };
        }
      }
    }

    if (cursorFilter) {
      query.$and = query.$and ? [...query.$and, cursorFilter] : [cursorFilter];
    }

    const skip = cursorFilter ? 0 : (p - 1) * l;

    // Parallelize independent DB reads (Product.find, storewide discount, countDocuments)
    let [products, storewidePercent, totalCount] = await Promise.all([
      Product.find(query)
        .select("name slug genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
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
            .select("name slug genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
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

        const lastProd = formattedProducts[formattedProducts.length - 1];
        const nextCursor = lastProd
          ? Buffer.from(JSON.stringify({ name: lastProd.name, id: String(lastProd._id) })).toString("base64")
          : null;

        return {
          status: "success",
          results: formattedProducts.length,
          pagination: {
            page: p,
            limit: l,
            total: totalCount,
            pages: Math.ceil(totalCount / l),
            nextCursor: (cursorStr || formattedProducts.length === l) ? nextCursor : null,
            hasMore: p < Math.ceil(totalCount / l),
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
        const param = req.params.id;
        const isObjectId = mongoose.Types.ObjectId.isValid(param);
        const filter = isObjectId
          ? { $or: [{ _id: param }, { slug: param }], active: true }
          : { slug: param, active: true };

        const [product, storewidePercent] = await Promise.all([
          Product.findOne(filter)
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
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const filter = isObjectId
          ? { $or: [{ _id: id }, { slug: id }], active: true }
          : { slug: id, active: true };
        const currentProduct = await Product.findOne(filter).lean();
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
        if (prod.isNarcotic === true || prod.rxStatus === "narcotic") return;
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
          .select("name slug genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
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
            .select("name slug genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
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
          .select("name slug genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
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
          .select("name slug genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
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

// GET /api/v1/categories/:slug - Public category detail by slug or ID
router.get("/categories/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const filter = isObjectId
      ? { $or: [{ _id: slug }, { slug: slug }], active: true }
      : { slug: slug, active: true };

    const category = await Category.findOne(filter).lean();
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    res.status(200).json({
      status: "success",
      data: { category },
    });
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
    const tokens = cleanQ.split(/\s+/).filter(Boolean);

    let productFilter = {
      active: true,
      $or: [
        { name: regex },
        { genericName: regex },
        { keywords: regex },
        { tags: regex },
      ],
    };

    if (tokens.length > 1) {
      const tokenConditions = tokens.map((t) => {
        const escT = t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const tRegex = new RegExp(escT, "i");
        return {
          $or: [
            { name: tRegex },
            { genericName: tRegex },
            { keywords: tRegex },
            { tags: tRegex },
            { description: tRegex },
          ],
        };
      });

      productFilter = {
        active: true,
        $or: [
          { name: regex },
          { genericName: regex },
          { keywords: regex },
          { tags: regex },
          { $and: tokenConditions },
        ],
      };
    }

    // Parallel lookup of matching products and matching categories
    const [rawProducts, rawCategories] = await Promise.all([
      Product.find(productFilter)
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

    // Fourth: For multi-token queries, add top matching product names
    sortedProducts.forEach((p) => {
      if (p.name) {
        searchTermsSet.add(p.name);
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

// ─── BRAND HUBS & DIRECTORY ENGINE (Phase 2 Link Engine) ──────────────────────

const BRAND_HUBS = [
  {
    slug: "getz-pharma",
    name: "Getz Pharma",
    shortCode: "GETZ",
    query: "Getz",
    logo: "/images/brands/getz-pharma.svg",
    badge: "Top Stocked",
    themeColor: "#008080",
    description: "Getz Pharma is a leading international pharmaceutical manufacturer in Pakistan, producing DRAP-approved cardiovascular, anti-infective, and metabolic medications in state-of-the-art WHO-prequalified facilities.",
  },
  {
    slug: "sami-pharma",
    name: "Sami Pharmaceuticals",
    shortCode: "SAMI",
    query: "Sami",
    logo: "/images/brands/sami-pharma.svg",
    badge: "Popular",
    themeColor: "#4F46E5",
    description: "Sami Pharmaceuticals offers high-quality generic and therapeutic formulations across Pakistan, covering respiratory, gastroenterology, and antibiotic treatments verified for authentic patient care.",
  },
  {
    slug: "hilton-pharma",
    name: "Hilton Pharma",
    shortCode: "HILTON",
    query: "Hilton",
    logo: "/images/brands/hilton-pharma.svg",
    badge: "Essential",
    themeColor: "#059669",
    description: "Hilton Pharma manufactures quality pharmaceuticals under strict cGMP standards in Pakistan, providing trusted clinical solutions in pain relief, cardiovascular health, and general wellness.",
  },
  {
    slug: "barrett-hodgson",
    name: "Barrett Hodgson",
    shortCode: "BH",
    query: "Barrett",
    logo: "/images/brands/barrett-hodgson.svg",
    badge: "Trusted",
    themeColor: "#0369A1",
    description: "Barrett Hodgson Pakistan delivers research-driven pharmaceutical products manufactured under rigorous international specifications, ensuring patient efficacy and quality assurance.",
  },
  {
    slug: "highnoon-labs",
    name: "Highnoon Laboratories",
    shortCode: "HIGHNOON",
    query: "Highnoon",
    logo: "/images/brands/highnoon-labs.svg",
    badge: "Healthcare",
    themeColor: "#D97706",
    description: "Highnoon Laboratories is an established healthcare innovator in Pakistan, providing therapeutic products in cardiology, respiratory medicine, and metabolic disorder management.",
  },
  {
    slug: "martin-dow",
    name: "Martin Dow",
    shortCode: "MARTIN DOW",
    query: "Martin Dow",
    logo: "/images/brands/martin-dow.svg",
    badge: "Quality",
    themeColor: "#0284C7",
    description: "Martin Dow manufactures high-standard therapeutic and consumer healthcare formulations in Pakistan, ensuring rigorous adherence to DRAP regulations and international safety norms.",
  },
  {
    slug: "ccl-pharma",
    name: "CCL Pharmaceuticals",
    shortCode: "CCL",
    query: "CCL",
    logo: "/images/brands/ccl-pharma.svg",
    badge: "Reliable",
    themeColor: "#2563EB",
    description: "CCL Pharmaceuticals supplies essential medicines and healthcare products nationwide, spanning primary care, nutritional supplements, and specialized pharmaceutical treatments.",
  },
  {
    slug: "pharmevo",
    name: "PharmEvo",
    shortCode: "PHARMEVO",
    query: "PharmEvo",
    logo: "/images/brands/pharmevo.svg",
    badge: "Wellness",
    themeColor: "#16A34A",
    description: "PharmEvo emphasizes preventive healthcare and evidence-based pharmaceuticals in Pakistan, delivering safe therapies in bone health, cardiology, and daily wellness.",
  },
  {
    slug: "abbott-labs",
    name: "Abbott Laboratories",
    shortCode: "ABBOTT",
    query: "Abbott",
    logo: "/images/brands/abbott-labs.svg",
    badge: "Global",
    themeColor: "#0096D6",
    description: "Abbott Pakistan offers global-standard nutrition, medical diagnostics, and authentic pharmaceuticals trusted by clinicians and families across Pakistan.",
  },
  {
    slug: "gsk-pakistan",
    name: "GSK Pakistan",
    shortCode: "GSK",
    query: "GSK|Glaxo",
    logo: "/images/brands/gsk-pakistan.svg",
    badge: "Standard",
    themeColor: "#F36F21",
    description: "GlaxoSmithKline (GSK) Pakistan manufactures trusted antibiotics, dermatology solutions, and essential over-the-counter pain and fever remedies across Pakistan.",
  },
  {
    slug: "atco-labs",
    name: "Atco Laboratories",
    shortCode: "ATCO",
    query: "Atco",
    logo: "/images/brands/atco-labs.svg",
    badge: "Certified",
    themeColor: "#7C3AED",
    description: "Atco Laboratories delivers certified pharmaceuticals across Pakistan, specializing in high-grade sterile preparations, oral solid dosages, and therapeutic syrups.",
  },
  {
    slug: "ferozsons",
    name: "Ferozsons Laboratories",
    shortCode: "FEROZSONS",
    query: "Ferozsons",
    logo: "/images/brands/ferozsons.svg",
    badge: "Heritage",
    themeColor: "#0891B2",
    description: "Ferozsons Laboratories is a pioneer pharmaceutical enterprise in Pakistan, providing trusted oncology, cardiology, hepatology, and general health treatments.",
  },
  {
    slug: "searle-pharma",
    name: "Searle Company",
    shortCode: "SEARLE",
    query: "Searl",
    logo: "/images/brands/searle-pharma.svg",
    badge: "Specialist",
    themeColor: "#0D9488",
    description: "The Searle Company is one of Pakistan's largest healthcare enterprises, formulating specialized pharmaceuticals in cardiovascular, gastrointestinal, and pain management.",
  },
  {
    slug: "panadol",
    name: "Panadol",
    shortCode: "PANADOL",
    query: "Panadol",
    logo: "/images/brands/gsk-pakistan.svg",
    badge: "OTC Staple",
    themeColor: "#1E40AF",
    description: "Panadol (by GSK) is Pakistan's most trusted paracetamol pain and fever relief brand. Browse authentic tablets, syrups, drops, and cold & flu formulations with Cash on Delivery.",
  },
  {
    slug: "nutrifactor",
    name: "Nutrifactor",
    shortCode: "NUTRIFACTOR",
    query: "Nutrifactor",
    logo: "/images/brands/nutrifactor.svg",
    badge: "Nutrition",
    themeColor: "#047857",
    description: "Nutrifactor manufactures premium halal dietary supplements, multivitamins, and wellness formulations in Pakistan under strict cGMP standards.",
  },
  {
    slug: "qarshi",
    name: "Qarshi",
    shortCode: "QARSHI",
    query: "Qarshi",
    logo: "/images/brands/qarshi.svg",
    badge: "Herbal/Natural",
    themeColor: "#15803D",
    description: "Qarshi is Pakistan's renowned herbal and natural healthcare brand, offering traditional syrups, herbal tonics, and natural wellness supplements.",
  },
  {
    slug: "marhaba",
    name: "Marhaba",
    shortCode: "MARHABA",
    query: "Marhaba",
    logo: "/images/brands/marhaba.svg",
    badge: "Natural Care",
    themeColor: "#B45309",
    description: "Marhaba Laboratories provides natural herbal extracts, digestive waters, pure oils, and wellness remedies formulated according to traditional standards.",
  },
  {
    slug: "dettol",
    name: "Dettol",
    shortCode: "DETTOL",
    query: "Dettol",
    logo: "/images/brands/dettol.svg",
    badge: "Antiseptic",
    themeColor: "#047857",
    description: "Dettol provides trusted antiseptic liquids, antibacterial soaps, and personal hygiene essentials protecting families across Pakistan.",
  },
  {
    slug: "sensodyne",
    name: "Sensodyne",
    shortCode: "SENSODYNE",
    query: "Sensodyne",
    logo: "/images/brands/sensodyne.svg",
    badge: "Oral Care",
    themeColor: "#1D4ED8",
    description: "Sensodyne is the dentist-recommended oral care brand for sensitive teeth in Pakistan, offering rapid relief, whitening, and daily tooth protection.",
  },
  {
    slug: "calpol",
    name: "Calpol",
    shortCode: "CALPOL",
    query: "Calpol",
    logo: "/images/brands/gsk-pakistan.svg",
    badge: "Pediatric Care",
    themeColor: "#EC4899",
    description: "Calpol (by GSK) is Pakistan's pediatric paracetamol suspension for infant and child fever reduction and mild pain relief.",
  },
  {
    slug: "disprin",
    name: "Disprin",
    shortCode: "DISPRIN",
    query: "Disprin",
    logo: "/images/brands/reckitt.svg",
    badge: "Fast Pain Relief",
    themeColor: "#DC2626",
    description: "Disprin soluble aspirin tablets provide fast-acting relief from headaches, muscular pains, and fever symptoms across Pakistan.",
  },
  {
    slug: "surbex",
    name: "Surbex Z",
    shortCode: "SURBEX",
    query: "Surbex",
    logo: "/images/brands/abbott-labs.svg",
    badge: "Zinc & Energy",
    themeColor: "#F59E0B",
    description: "Surbex and Surbex Z (by Abbott) deliver essential zinc, Vitamin B-Complex, Vitamin C, and vital micronutrients for daily stamina and immunity.",
  },
  {
    slug: "cac-1000",
    name: "CaC-1000 Plus",
    shortCode: "CAC-1000",
    query: "Cac-1000|Cac 1000",
    logo: "/images/brands/gsk-pakistan.svg",
    badge: "Bone & Immunity",
    themeColor: "#EA580C",
    description: "CaC-1000 Plus effervescent tablets combine 1000mg calcium with Vitamin C and D3 for strong bones, teeth, and cellular immune support.",
  },
  {
    slug: "centrum",
    name: "Centrum",
    shortCode: "CENTRUM",
    query: "Centrum",
    logo: "/images/brands/haleon.svg",
    badge: "Complete Multivitamin",
    themeColor: "#2563EB",
    description: "Centrum complete daily multivitamins support overall vitality, heart health, immune function, and physical stamina for adults and seniors in Pakistan.",
  },
  {
    slug: "ors",
    name: "ORS Electrolytes",
    shortCode: "ORS",
    query: "Osmolar|Rehydramin|Hydralyte|Oraes|\\bORS\\b",
    logo: "/images/brands/ors.svg",
    badge: "Hydration Care",
    themeColor: "#0284C7",
    description: "WHO-standard Oral Rehydration Salts (ORS) and clinical electrolytes for rapid rehydration, diarrhea recovery, and seasonal dehydration management.",
  },
  {
    slug: "pyodine",
    name: "Pyodine",
    shortCode: "PYODINE",
    query: "Pyodine",
    logo: "/images/brands/brookes.svg",
    badge: "First Aid Antiseptic",
    themeColor: "#991B1B",
    description: "Pyodine (Povidone-Iodine 10%) solution and antiseptic ointment protect cuts, minor burns, surgical wounds, and abrasions from infection.",
  },
  {
    slug: "polyfax",
    name: "Polyfax",
    shortCode: "POLYFAX",
    query: "Polyfax",
    logo: "/images/brands/gsk-pakistan.svg",
    badge: "Skin & Eye Care",
    themeColor: "#1E3A8A",
    description: "Polyfax skin and eye ointments provide trusted topical dual-action protection against minor superficial skin and ocular bacterial infections.",
  },
  {
    slug: "strepsils",
    name: "Strepsils",
    shortCode: "STREPSILS",
    query: "Strepsils",
    logo: "/images/brands/reckitt.svg",
    badge: "Sore Throat",
    themeColor: "#D97706",
    description: "Strepsils soothing antibacterial lozenges relieve dry, scratchy, and painful sore throat symptoms with active antiseptic ingredients.",
  },
  {
    slug: "vicks",
    name: "Vicks",
    shortCode: "VICKS",
    query: "Vicks",
    logo: "/images/brands/pg.svg",
    badge: "Cold Relief",
    themeColor: "#059669",
    description: "Vicks VapoRub provides soothing menthol and eucalyptus relief from nasal congestion, coughs, and seasonal muscle stiffness in adults and children.",
  },
  {
    slug: "sunny-d",
    name: "Sunny D",
    shortCode: "SUNNY-D",
    query: "Sunny D|Sunny-D",
    logo: "/images/brands/searle-pharma.svg",
    badge: "Vitamin D3",
    themeColor: "#F59E0B",
    description: "Sunny D (by Searle) provides pharmaceutical-grade Vitamin D3 drops, softgels, and ampoules for calcium absorption, bone strength, and immunity.",
  },
  {
    slug: "evion",
    name: "Evion",
    shortCode: "EVION",
    query: "Evion",
    logo: "/images/brands/martin-dow.svg",
    badge: "Antioxidant",
    themeColor: "#10B981",
    description: "Evion Vitamin E (Alpha-Tocopherol) capsules protect cells against oxidative stress, supporting skin health, muscle vitality, and general wellness.",
  },
  {
    slug: "neurobion",
    name: "Neurobion",
    shortCode: "NEUROBION",
    query: "Neurobion",
    logo: "/images/brands/martin-dow.svg",
    badge: "Nerve Health",
    themeColor: "#4F46E5",
    description: "Neurobion neurotropic B-vitamins (B1, B6, B12) nourish and regenerate nerve fibers, relieving numbness, tingling sensations, and fatigue.",
  },
  {
    slug: "gaviscon",
    name: "Gaviscon",
    shortCode: "GAVISCON",
    query: "Gaviscon",
    logo: "/images/brands/reckitt.svg",
    badge: "Antacid Relief",
    themeColor: "#2563EB",
    description: "Gaviscon antacid oral suspensions form a protective raft barrier over stomach contents to rapidly soothe heartburn, acid indigestion, and reflux.",
  },
  {
    slug: "molfix",
    name: "Molfix",
    shortCode: "MOLFIX",
    query: "Molfix",
    logo: "/images/brands/molfix.svg",
    badge: "Baby Care",
    themeColor: "#0284C7",
    description: "Molfix premium baby diaper pants and tapes feature ultra-absorbent technology and 3D anti-leakage barriers for dry, comfortable baby skin.",
  },
  {
    slug: "canbebe",
    name: "Canbebe",
    shortCode: "CANBEBE",
    query: "Canbebe",
    logo: "/images/brands/canbebe.svg",
    badge: "Comfort Diapers",
    themeColor: "#7C3AED",
    description: "Canbebe baby diapers provide dermatologically tested comfort, anatomical fit, and high absorbency for active babies and restful sleep.",
  },
  {
    slug: "pampers",
    name: "Pampers",
    shortCode: "PAMPERS",
    query: "Pampers",
    logo: "/images/brands/pampers.svg",
    badge: "Premium Baby",
    themeColor: "#0D9488",
    description: "Pampers diapers and pants deliver all-night dryness and gentle skin protection with breathable air channels and flexible waistbands.",
  },
  {
    slug: "morinaga",
    name: "Morinaga",
    shortCode: "MORINAGA",
    query: "Morinaga",
    logo: "/images/brands/morinaga.svg",
    badge: "Infant Nutrition",
    themeColor: "#EA580C",
    description: "Morinaga Japanese formula nutrition (BF-1, BF-2, BF-3, BF-P) supports early childhood physical growth, brain development, and gut health.",
  },
  {
    slug: "meiji",
    name: "Meiji",
    shortCode: "MEIJI",
    query: "Meiji",
    logo: "/images/brands/meiji.svg",
    badge: "Child Formula",
    themeColor: "#DC2626",
    description: "Meiji growing-up milk formulas (Big 3, Lactoless) provide balanced pediatric micronutrients, iron, DHA, and essential proteins for growing children.",
  },
  {
    slug: "lactogen",
    name: "Lactogen",
    shortCode: "LACTOGEN",
    query: "Lactogen",
    logo: "/images/brands/nestle.svg",
    badge: "Infant Formula",
    themeColor: "#2563EB",
    description: "Nestle Lactogen infant milk formula with active L. reuteri probiotics supports comfortable infant digestion, immunity, and healthy weight gain.",
  },
  {
    slug: "cerelac",
    name: "Cerelac",
    shortCode: "CERELAC",
    query: "Cerelac",
    logo: "/images/brands/nestle.svg",
    badge: "Baby Cereal",
    themeColor: "#F59E0B",
    description: "Nestle Cerelac infant complementary cereals provide iron, zinc, calcium, and essential vitamins for babies starting solid food stages.",
  },
  {
    slug: "accu-chek",
    name: "Accu-Chek",
    shortCode: "ACCU-CHEK",
    query: "Accu-Chek|Accu Chek|On Call",
    logo: "/images/brands/roche.svg",
    badge: "Diabetes Diagnostics",
    themeColor: "#047857",
    description: "Accu-Chek and On Call clinical blood glucose monitoring systems and test strips deliver accurate, fast home diabetes tracking in Pakistan.",
  },
];

// Helper to extract clean brand family root from a product name
function extractBrandFamily(name) {
  if (!name) return "";
  let clean = name.replace(/[\(\)\[\]]/g, " ").trim();
  clean = clean.replace(/\b(\d+(\.\d+)?\s*(mg|ml|gm|g|kg|mcg|iu|%|\/(\d+(\.\d+)?\s*(mg|ml|gm|g|kg|mcg|iu)?)))\b/gi, " ");
  clean = clean.replace(/\b(\d+\s*('s|s|tablets?|capsules?|caplets?|drops?|sachets?|bottles?|ampoules?|vials?|strips?|packs?))\b/gi, " ");
  clean = clean.replace(/\b(tablet|tablets|tab|capsule|capsules|cap|syrup|suspension|drops|drop|injection|infusion|cream|gel|lotion|ointment|sachet|sachets|powder|spray|solution|shampoo|wash|liquid)\b/gi, " ");
  clean = clean.replace(/\b(plus|extra|forte|ultra|regular|plain|retard|sr|cr|xr|mr|ds|es|infant|pediatric|adult|sugar\s*free|sf)\b/gi, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter((w) => w.length >= 2);
  return words[0] || clean;
}

// GET /api/v1/medicines-a-z/:letter - Deterministic alphabetical medicine index (Phase 2 Link Engine)
router.get("/medicines-a-z/:letter", async (req, res, next) => {
  try {
    const rawLetter = (req.params.letter || "a").toLowerCase().trim();
    const isNumeric = rawLetter === "0-9" || rawLetter === "0" || rawLetter === "numeric" || /^[0-9]$/.test(rawLetter);
    const letter = isNumeric ? "0-9" : (rawLetter.charAt(0) >= "a" && rawLetter.charAt(0) <= "z" ? rawLetter.charAt(0) : "a");

    const parsedPage = parseInt(req.query.page, 10);
    const page = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = !isNaN(parsedLimit) && parsedLimit >= 1 ? Math.min(parsedLimit, 250) : 200;

    const cacheKey = `cache:storefront:medicines-a-z:${letter}:page:${page}:limit:${limit}`;
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCTS_LISTING,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const filter = {
          active: true,
          name: isNumeric ? { $regex: "^[0-9]" } : { $regex: `^${letter}`, $options: "i" },
        };

        const skip = (page - 1) * limit;
        const [rawProducts, total, storewidePercent] = await Promise.all([
          Product.find(filter)
            .select("name slug genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
            .populate("categoryIds", "name slug discount active")
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(filter),
          getStorewideDiscount(),
        ]);

        const products = rawProducts.map((prod) => {
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

        const totalPages = Math.ceil(total / limit) || 1;
        const allLetters = [
          "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
          "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0-9"
        ];

        return {
          status: "success",
          data: {
            letter,
            page,
            totalPages,
            total,
            limit,
            letters: allLetters,
            products,
          },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/brands - Directory of all top pharmaceutical and OTC brands
router.get("/brands", async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:brands:all";
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCTS_LISTING,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        return {
          status: "success",
          results: BRAND_HUBS.length,
          data: {
            brands: BRAND_HUBS,
          },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/brands/:slug - Brand Hub details and paginated product list
router.get("/brands/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const brand = BRAND_HUBS.find((b) => b.slug === slug);
    if (!brand) {
      return res.status(404).json({ status: "error", message: "Brand not found" });
    }

    const parsedPage = parseInt(req.query.page, 10);
    const page = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = !isNaN(parsedLimit) && parsedLimit >= 1 ? Math.min(parsedLimit, 100) : 24;

    const cacheKey = `cache:storefront:brand:${slug}:page:${page}:limit:${limit}`;
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCTS_LISTING,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const brandRegex = new RegExp(brand.query, "i");
        const filter = {
          active: true,
          $or: [
            { name: brandRegex },
            { keywords: brandRegex },
            { tags: brandRegex },
            { description: brandRegex },
          ],
        };

        const skip = (page - 1) * limit;
        const [rawProducts, total, storewidePercent] = await Promise.all([
          Product.find(filter)
            .select("name slug genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
            .populate("categoryIds", "name slug discount active")
            .sort({ stockStatus: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(filter),
          getStorewideDiscount(),
        ]);

        const products = rawProducts.map((prod) => {
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

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          status: "success",
          data: {
            brand,
            page,
            totalPages,
            total,
            limit,
            products,
          },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id/contextual-links - Deterministic SSR Interlinking Engine (Phase 2 Link Engine)
router.get("/products/:id/contextual-links", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `cache:storefront:product:${id}:contextual-links`;
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.PRODUCT_RELATED,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const filter = isObjectId
          ? { $or: [{ _id: id }, { slug: id }], active: true }
          : { slug: id, active: true };

        const currentProduct = await Product.findOne(filter).lean();
        if (!currentProduct) return null;

        const storewidePercent = await getStorewideDiscount();
        const brandRoot = extractBrandFamily(currentProduct.name);
        const brandRegex = brandRoot && brandRoot.length >= 2
          ? new RegExp("^" + brandRoot.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i")
          : null;

        const isOtc = !currentProduct.requiresPrescription && !currentProduct.isNarcotic;

        // 1. Other Pack Sizes & Strengths (Same Brand Family)
        let brandFamilyRaw = [];
        if (brandRegex) {
          brandFamilyRaw = await Product.find({
            _id: { $ne: currentProduct._id },
            active: true,
            name: brandRegex,
          })
            .select("name slug genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
            .populate("categoryIds", "name slug discount active")
            .limit(6)
            .lean();
        }

        // 2. Same Active Ingredient / Generic Equivalent (Different Brand)
        let sameIngredientRaw = [];
        if (currentProduct.genericName && currentProduct.genericName.trim().length >= 3) {
          const mainGeneric = currentProduct.genericName.trim().split(/[,;+\/]/)[0].trim();
          if (mainGeneric.length >= 3) {
            const genRegex = new RegExp(mainGeneric.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
            const sameIngFilter = {
              _id: { $ne: currentProduct._id },
              active: true,
              genericName: genRegex,
            };
            if (brandRegex) {
              sameIngFilter.name = { $not: brandRegex };
            }
            sameIngredientRaw = await Product.find(sameIngFilter)
              .select("name slug genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
              .populate("categoryIds", "name slug discount active")
              .limit(6)
              .lean();
          }
        }

        // 3. Scored Related Products (generic +5, brand +4, category +3, token +2, price band +1)
        const primaryCatId = currentProduct.categoryIds?.[0];
        const currentTokens = (currentProduct.name || "").toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
        const priceMin = (currentProduct.price || 0) * 0.5;
        // 3. Clinical Complementary Mapping & Frequently Bought Together (Feature 4)
        // If customer is viewing fever/pain/analgesic (e.g. Panadol, Brufen, Calpol), cross-sell cough syrup, hydration & vitamins
        const complementaryQueries = [];
        const lowerName = (currentProduct.name || "").toLowerCase();
        const lowerGeneric = (currentProduct.genericName || "").toLowerCase();

        if (lowerName.includes("panadol") || lowerName.includes("paracetamol") || lowerName.includes("calpol") || lowerName.includes("brufen") || lowerGeneric.includes("paracetamol") || lowerGeneric.includes("ibuprofen")) {
          complementaryQueries.push({
            name: /(syrup|cough|saniplast|thermometer|cac\s*1000|surbex|hydr|ors|vitamin)/i,
            _id: { $ne: currentProduct._id },
            active: true,
            isNarcotic: false,
          });
        } else if (lowerName.includes("accu") || lowerName.includes("strip") || lowerName.includes("sugar") || lowerName.includes("glucophage") || lowerGeneric.includes("metformin")) {
          complementaryQueries.push({
            name: /(lancet|strip|alcohol\s*swab|sugar\s*free|canderel|glucometer)/i,
            _id: { $ne: currentProduct._id },
            active: true,
            isNarcotic: false,
          });
        } else if (lowerName.includes("risek") || lowerName.includes("nexum") || lowerName.includes("gaviscon") || lowerGeneric.includes("omeprazole") || lowerGeneric.includes("esomeprazole")) {
          complementaryQueries.push({
            name: /(gaviscon|antacid|ispaghol|mucaine|digestion|probiotic)/i,
            _id: { $ne: currentProduct._id },
            active: true,
            isNarcotic: false,
          });
        }

        let complementaryPool = [];
        if (complementaryQueries.length > 0) {
          complementaryPool = await Product.find({ $or: complementaryQueries })
            .select("name slug genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
            .populate("categoryIds", "name slug discount active")
            .limit(10)
            .lean();
        }

        // Candidates from category or general active pool
        const candidateFilter = {
          _id: { $ne: currentProduct._id },
          active: true,
        };
        if (primaryCatId) {
          candidateFilter.categoryIds = primaryCatId;
        }
        if (isOtc) {
          candidateFilter.requiresPrescription = false;
          candidateFilter.isNarcotic = false;
        }

        const candidatePool = await Product.find(candidateFilter)
          .select("name slug genericName price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
          .populate("categoryIds", "name slug discount active")
          .limit(30)
          .lean();

        // Merge candidate pool with complementary pool (ensuring uniqueness)
        const poolMap = new Map();
        complementaryPool.forEach(p => poolMap.set(String(p._id), { p, isComp: true }));
        candidatePool.forEach(p => {
          if (!poolMap.has(String(p._id))) poolMap.set(String(p._id), { p, isComp: false });
        });

        // Score each candidate
        const scoredCandidates = Array.from(poolMap.values()).map(({ p: cand, isComp }) => {
          let score = 0;
          if (isComp) {
            score += 8; // High priority to clinical complementary cross-sells
          }
          if (currentProduct.genericName && cand.genericName && currentProduct.genericName.toLowerCase() === cand.genericName.toLowerCase()) {
            score += 5;
          }
          if (brandRegex && brandRegex.test(cand.name)) {
            score += 4;
          }
          if (primaryCatId && cand.categoryIds?.some((c) => String(c._id || c) === String(primaryCatId._id || primaryCatId))) {
            score += 3;
          }
          const candTokens = (cand.name || "").toLowerCase().split(/\s+/);
          const overlap = currentTokens.filter((t) => candTokens.includes(t)).length;
          score += overlap * 2;
          if (cand.price >= priceMin && cand.price <= priceMax) {
            score += 1;
          }
          return { cand, score };
        });

        // Exclude products already in brandFamily or sameIngredient
        const seenIds = new Set([
          String(currentProduct._id),
          ...brandFamilyRaw.map((p) => String(p._id)),
          ...sameIngredientRaw.map((p) => String(p._id)),
        ]);

        const filteredScored = scoredCandidates.filter(({ cand }) => !seenIds.has(String(cand._id)));
        filteredScored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const aInStock = a.cand.stockStatus !== "out_of_stock";
          const bInStock = b.cand.stockStatus !== "out_of_stock";
          if (aInStock && !bInStock) return -1;
          if (!aInStock && bInStock) return 1;
          return (a.cand.name || "").localeCompare(b.cand.name || "");
        });

        const relatedRaw = filteredScored.slice(0, 8).map((s) => s.cand);

        // 4. Matched Brand Hub
        let matchedBrandHub = null;
        for (const hub of BRAND_HUBS) {
          const hubRegex = new RegExp(hub.query, "i");
          if (hubRegex.test(currentProduct.name) || hubRegex.test(currentProduct.keywords?.join(" ") || "")) {
            matchedBrandHub = {
              name: hub.name,
              slug: hub.slug,
              logo: hub.logo,
              badge: hub.badge,
            };
            break;
          }
        }

        const formatList = (list) =>
          list.map((prod) => {
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
          data: {
            brandRoot,
            brandHub: matchedBrandHub,
            brandFamily: formatList(brandFamilyRaw),
            sameIngredient: formatList(sameIngredientRaw),
            relatedProducts: formatList(relatedRaw),
          },
        };
      },
    });

    if (!responseBody) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
