/**
 * Cache Warmer — Proactive Pre-warming & Background Refresh.
 *
 * Prevents cold cache stampedes on server startup and proactively refreshes
 * highest-traffic keys before they expire (at ~80% of TTL).
 *
 * PM2 Cluster Safe:
 * Guarded by process.env.NODE_APP_INSTANCE === '0' to ensure warming runs
 * on exactly ONE cluster instance and never duplicates database load.
 */

const Product = require("../../modules/products/product.model");
const Category = require("../../modules/categories/category.model");
const City = require("../../modules/cities/city.model");
const { getStorewideDiscount, getPageContent } = require("../../modules/settings/settings.service");
const { getTrendingSearches, getTrendingProducts } = require("../../modules/search/search.service");
const { formatProductWithImages } = require("../../modules/products/product.service");
const { getEffectivePrice } = require("../../modules/discounts/discount.service");
const { cacheService, CACHE_POLICIES } = require("./cacheService");

let warmingInterval = null;

/**
 * Checks if current worker is the primary instance
 */
function isPrimaryInstance() {
  return (
    process.env.NODE_APP_INSTANCE === "0" ||
    process.env.pm_id === "0" ||
    process.env.NODE_APP_INSTANCE === undefined
  );
}

/**
 * Warm the categories listing
 */
async function warmCategories() {
  try {
    const key = "cache:storefront:categories";
    const categories = await Category.find({ active: true }).sort({ name: 1 }).lean();
    const responseBody = {
      status: "success",
      results: categories.length,
      data: { categories },
    };
    await cacheService.writeCache(key, responseBody, CACHE_POLICIES.CATEGORIES);
    return true;
  } catch (err) {
    console.warn("[CacheWarmer] Categories warming failed:", err.message);
    return false;
  }
}

/**
 * Warm the cities listing
 */
async function warmCities() {
  try {
    const key = "cache:storefront:cities";
    const cities = await City.find({ active: true }).sort({ name: 1 }).lean();
    const responseBody = {
      status: "success",
      results: cities.length,
      data: { cities },
    };
    await cacheService.writeCache(key, responseBody, CACHE_POLICIES.CITIES);
    return true;
  } catch (err) {
    console.warn("[CacheWarmer] Cities warming failed:", err.message);
    return false;
  }
}

/**
 * Warm trending searches and default suggestions
 */
async function warmTrending() {
  try {
    const storewidePercent = await getStorewideDiscount();
    const [trendingSearches, trendingProducts] = await Promise.all([
      getTrendingSearches(15),
      getTrendingProducts(12, storewidePercent),
    ]);

    const searchesKey = "cache:storefront:trending-searches:limit:12";
    const searchesBody = {
      status: "success",
      data: {
        trendingSearches: trendingSearches.map((t) => t.name).slice(0, 12),
        trendingProducts: trendingProducts.slice(0, 10),
      },
    };
    await cacheService.writeCache(searchesKey, searchesBody, CACHE_POLICIES.TRENDING_SEARCHES);

    const suggestionsKey = "cache:storefront:suggestions:__trending__";
    const suggestionsBody = {
      status: "success",
      data: {
        trendingSearches: trendingSearches.map((t) => t.name),
        trendingItems: trendingSearches,
        trendingProducts,
        matchingSearches: [],
        matchingProducts: [],
        matchingCategories: [],
      },
    };
    await cacheService.writeCache(suggestionsKey, suggestionsBody, CACHE_POLICIES.SEARCH_SUGGESTIONS);

    return true;
  } catch (err) {
    console.warn("[CacheWarmer] Trending warming failed:", err.message);
    return false;
  }
}

/**
 * Warm homepage product listings
 */
async function warmProductsListing(limit = 24) {
  try {
    const key = `cache:storefront:products:search::cat::cond::narcotic::page:1:limit:${limit}`;
    const activeCategories = await Category.find({ active: true }, { _id: 1 }).lean();
    const activeCategoryIds = activeCategories.map((c) => c._id);

    const query = {
      active: true,
      categoryIds: { $in: activeCategoryIds },
    };

    const [products, storewidePercent, totalCount] = await Promise.all([
      Product.find(query)
        .select("name genericName description keywords tags price sku categoryIds isNarcotic requiresPrescription stockStatus images discount active")
        .populate("categoryIds", "name slug discount active")
        .sort({ name: 1 })
        .limit(limit)
        .lean(),
      getStorewideDiscount(),
      Product.countDocuments(query),
    ]);

    const formattedProducts = products.map((product) => {
      const formatted = formatProductWithImages(product);
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
        page: 1,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      data: { products: formattedProducts },
    };

    await cacheService.writeCache(key, responseBody, CACHE_POLICIES.PRODUCTS_LISTING);
    return true;
  } catch (err) {
    console.warn(`[CacheWarmer] Products listing (${limit}) warming failed:`, err.message);
    return false;
  }
}

/**
 * Warm page content (About / Contact)
 */
async function warmPageContent() {
  try {
    const key = "cache:storefront:content";
    const content = await getPageContent();
    const responseBody = {
      status: "success",
      data: content,
    };
    await cacheService.writeCache(key, responseBody, CACHE_POLICIES.CONTENT);
    return true;
  } catch (err) {
    console.warn("[CacheWarmer] Page content warming failed:", err.message);
    return false;
  }
}

/**
 * Perform a full proactive warming pass across all popular keys
 */
async function warmAllPopularKeys() {
  if (!isPrimaryInstance()) {
    return;
  }

  const results = await Promise.allSettled([
    warmCategories(),
    warmCities(),
    warmTrending(),
    warmProductsListing(24),
    warmProductsListing(20),
    warmPageContent(),
  ]);

  const succeeded = results.filter((r) => r.status === "fulfilled" && r.value).length;
  if (process.env.NODE_ENV !== "production") {
    console.log(`[CacheWarmer] Proactive cache warming finished (${succeeded}/${results.length} warmed).`);
  }
}

/**
 * Start proactive cache warming on startup and setup scheduled refresh
 */
function initCacheWarmer() {
  if (!isPrimaryInstance()) {
    console.log(`[CacheWarmer] Skipping cache warmer on secondary cluster instance (NODE_APP_INSTANCE=${process.env.NODE_APP_INSTANCE}).`);
    return;
  }

  // Initial startup warming after a brief delay to let MongoDB connect
  setTimeout(() => {
    warmAllPopularKeys().catch((err) =>
      console.warn("[CacheWarmer] Startup warming error:", err.message)
    );
  }, 2000);

  // Proactive scheduled warming at 80% of product fresh TTL (every 95 seconds)
  // Ensures popular storefront keys never go cold during business hours
  if (!warmingInterval) {
    warmingInterval = setInterval(() => {
      warmAllPopularKeys().catch((err) =>
        console.warn("[CacheWarmer] Interval warming error:", err.message)
      );
    }, 95 * 1000);
    // Unref so timer doesn't keep node alive in tests
    if (typeof warmingInterval.unref === "function") {
      warmingInterval.unref();
    }
  }
}

function stopCacheWarmer() {
  if (warmingInterval) {
    clearInterval(warmingInterval);
    warmingInterval = null;
  }
}

module.exports = {
  initCacheWarmer,
  stopCacheWarmer,
  warmAllPopularKeys,
  isPrimaryInstance,
};
