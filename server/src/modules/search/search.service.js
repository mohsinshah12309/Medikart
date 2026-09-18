const SearchQuery = require("./searchQuery.model");
const Product = require("../products/product.model");
const { formatProductWithImages } = require("../products/product.service");
const { getEffectivePrice } = require("../discounts/discount.service");

// Intelligent medical icon mapping based on keywords
const getIconForTerm = (term = "") => {
  const lower = term.toLowerCase();
  if (/(vitamin|multivitamin|surbex|centrum|cac|calcium|zinc|supplement|omega|biotin|iron|folic)/i.test(lower)) {
    return "✨";
  }
  if (/(baby|diaper|pampers|cerelac|feeder|wipes|infant|mother|milk powder|nan optipro)/i.test(lower)) {
    return "🍼";
  }
  if (/(cream|lotion|serum|derma|skin|facewash|sunblock|shampoo|soap|care|moisturizer)/i.test(lower)) {
    return "🧴";
  }
  if (/(nexum|herbal|organic|risek|gaviscon|digestion|tea|mint)/i.test(lower)) {
    return "🌿";
  }
  if (/(first aid|bandage|dettol|sanitizer|cotton|gauge|antiseptic|tape|pyodine)/i.test(lower)) {
    return "🩹";
  }
  if (/(glucometer|strip|bp|monitor|thermometer|nebulizer|oximeter|device|scale)/i.test(lower)) {
    return "🩺";
  }
  if (/(paracetamol|panadol|brufen|disprin|augmentin|arinate|flagyl|ponstan|loprin|tablet|capsule|syrup|medicine|antibiotic)/i.test(lower)) {
    return "💊";
  }
  return "🔍";
};

// Formats user input into clean Title Case
const formatDisplayName = (term = "") => {
  return term
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Seed baseline trending terms for pharmacy storefront
const DEFAULT_TRENDING_TERMS = [
  { name: "Panadol", icon: "💊" },
  { name: "Augmentin", icon: "💊" },
  { name: "Surbex Z", icon: "✨" },
  { name: "Baby Diapers", icon: "🍼" },
  { name: "Centrum Silver", icon: "✨" },
  { name: "Nexum", icon: "🌿" },
  { name: "Brufen", icon: "💊" },
  { name: "CAC 1000 Plus", icon: "✨" },
  { name: "Disprin", icon: "💊" },
  { name: "Multivitamins", icon: "✨" },
  { name: "First Aid", icon: "🩹" },
  { name: "Dettol Antiseptic", icon: "🩹" },
];

/**
 * Record a search term in MongoDB SearchQuery collection
 */
const recordSearch = async (term) => {
  if (!term || typeof term !== "string") return null;
  const clean = term.trim();
  if (clean.length < 2 || clean.length > 80) return null;

  const lower = clean.toLowerCase();
  const displayName = formatDisplayName(clean);
  const icon = getIconForTerm(clean);

  try {
    const updated = await SearchQuery.findOneAndUpdate(
      { query: lower },
      {
        $inc: { count: 1 },
        $set: { lastSearchedAt: new Date() },
        $setOnInsert: { displayName, icon },
      },
      { upsert: true, new: true }
    );
    return updated;
  } catch (err) {
    console.error("[SearchService] recordSearch error:", err.message);
    return null;
  }
};

/**
 * Fetch top dynamic trending searches (merges DB stats with rich defaults)
 */
const getTrendingSearches = async (limit = 12) => {
  try {
    const dbQueries = await SearchQuery.find()
      .sort({ count: -1, lastSearchedAt: -1 })
      .limit(limit)
      .lean();

    const results = [];
    const seenLower = new Set();

    // 1. Add real tracked queries from database first
    for (const q of dbQueries) {
      const lower = q.query.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        results.push({
          name: q.displayName || formatDisplayName(q.query),
          icon: q.icon || getIconForTerm(q.query),
          count: q.count,
        });
      }
    }

    // 2. Fill in baseline defaults if needed to guarantee at least `limit` items
    for (const def of DEFAULT_TRENDING_TERMS) {
      if (results.length >= limit) break;
      const lower = def.name.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        results.push({
          name: def.name,
          icon: def.icon,
          count: 1,
        });
      }
    }

    return results.slice(0, limit);
  } catch (err) {
    console.error("[SearchService] getTrendingSearches error:", err.message);
    return DEFAULT_TRENDING_TERMS.slice(0, limit);
  }
};

/**
 * Fetch top trending products with formatted images & active discounts
 */
const getTrendingProducts = async (limit = 10, storewidePercent = 0) => {
  try {
    const products = await Product.find({ active: true })
      .populate("categoryIds", "name slug discount active")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit);

    return products.map((prod) => {
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
  } catch (err) {
    console.error("[SearchService] getTrendingProducts error:", err.message);
    return [];
  }
};

module.exports = {
  recordSearch,
  getTrendingSearches,
  getTrendingProducts,
  getIconForTerm,
};
