const SearchQuery = require("./searchQuery.model");
const Product = require("../products/product.model");
const { formatProductWithImages } = require("../products/product.service");
const { getEffectivePrice } = require("../discounts/discount.service");

// Blocklist / Profanity patterns (English, Roman Urdu, Punjabi, vulgar, spam)
const PROFANITY_PATTERNS = [
  /pen\s*di/i,
  /lul/i,
  /lund/i,
  /chutiya/i,
  /gandu/i,
  /bhosd/i,
  /kameena/i,
  /harami/i,
  /gashti/i,
  /dall[ae]/i,
  /madarchod/i,
  /behenchod/i,
  /\bbc\b/i,
  /\bmc\b/i,
  /\bsex\b/i,
  /\bporn\b/i,
  /\bnude\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bfuck\b/i,
  /\bshit\b/i,
  /\bdick\b/i,
  /\bpussy\b/i,
  /\bcock\b/i,
  /\bhack\b/i,
  /\bscript\b/i,
  /<[^>]*>/,
];

/**
 * Checks if a search term contains abusive, profane, or inappropriate language
 */
const isAbusiveOrInappropriate = (term = "") => {
  if (!term || typeof term !== "string") return true;
  const clean = term.trim().toLowerCase();
  if (clean.length < 2 || clean.length > 60) return true;

  // Check against regex patterns
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(clean)) return true;
  }

  // Reject strings with suspicious special characters or script tags
  if (/[<>{}[\]\\\/^~`$*]/.test(clean)) return true;

  return false;
};

/**
 * Escapes regex special characters
 */
const escapeRegex = (str = "") => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Verifies if the search query matches at least one active product or brand in the DB
 */
const validateProductMatches = async (term = "") => {
  try {
    const escaped = escapeRegex(term.trim());
    const regex = new RegExp(escaped, "i");
    const count = await Product.countDocuments({
      active: true,
      $or: [
        { name: regex },
        { genericName: regex },
        { brand: regex },
        { description: regex },
      ],
    });
    return count > 0;
  } catch (_) {
    return false;
  }
};

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
  if (/(paracetamol|panadol|brufen|disprin|augmentin|arinate|flagyl|ponstan|loprin|tablet|capsule|syrup|medicine|antibiotic|infacol|softin|rigix)/i.test(lower)) {
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

// Seed baseline trending terms for pharmacy storefront (100% verified medicine & healthcare staples)
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
 * ONLY records if:
 * 1. Term is NOT abusive / inappropriate
 * 2. Term matches at least ONE real active product in our database
 */
const recordSearch = async (term) => {
  if (!term || typeof term !== "string") return null;
  const clean = term.trim();
  if (clean.length < 2 || clean.length > 60) return null;

  // 1. Profanity / Abusive filter check
  if (isAbusiveOrInappropriate(clean)) {
    return null;
  }

  // 2. Strict product validation: must match a real active product in the store
  const hasMatchingProduct = await validateProductMatches(clean);
  if (!hasMatchingProduct) {
    return null;
  }

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
 * Fetch top dynamic trending searches (strictly verified products & clean defaults)
 */
const getTrendingSearches = async (limit = 12) => {
  try {
    const dbQueries = await SearchQuery.find()
      .sort({ count: -1, lastSearchedAt: -1 })
      .limit(limit * 2)
      .lean();

    const results = [];
    const seenLower = new Set();
    const toDeleteIds = [];

    // 1. Process tracked queries from database with strict validation
    for (const q of dbQueries) {
      const queryStr = q.query || "";
      const lower = queryStr.toLowerCase().trim();

      // If abusive or invalid, delete from DB immediately
      if (isAbusiveOrInappropriate(lower)) {
        if (q._id) toDeleteIds.push(q._id);
        continue;
      }

      // Check if it matches at least one active product in the catalog
      const matches = await validateProductMatches(lower);
      if (!matches) {
        if (q._id) toDeleteIds.push(q._id);
        continue;
      }

      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        results.push({
          name: q.displayName || formatDisplayName(q.query),
          icon: q.icon || getIconForTerm(q.query),
          count: q.count,
        });
      }

      if (results.length >= limit) break;
    }

    // Purge bad / non-matching items asynchronously
    if (toDeleteIds.length > 0) {
      SearchQuery.deleteMany({ _id: { $in: toDeleteIds } }).catch((e) => {
        console.error("[SearchService] purge error:", e.message);
      });
    }

    // 2. Fill in baseline defaults if needed to guarantee at least `limit` clean items
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
 * Fetch top trending / most-searched products with formatted images & active discounts
 * Dynamically ranks products matching the highest-searched terms and chronic health staples
 */
const getTrendingProducts = async (limit = 10, storewidePercent = 0) => {
  try {
    const productsMap = new Map();

    // 1. Fetch top clean search terms from SearchQuery
    const topSearches = await SearchQuery.find()
      .sort({ count: -1, lastSearchedAt: -1 })
      .limit(15)
      .lean();

    // Find products matching top searched queries
    for (const s of topSearches) {
      if (productsMap.size >= limit) break;
      if (isAbusiveOrInappropriate(s.query)) continue;

      const escaped = escapeRegex(s.query.trim());
      const regex = new RegExp(escaped, "i");

      const matched = await Product.find({
        active: true,
        isNarcotic: false,
        $or: [{ name: regex }, { genericName: regex }, { brand: regex }],
      })
        .populate("categoryIds", "name slug discount active")
        .limit(3);

      for (const p of matched) {
        if (!productsMap.has(p._id.toString()) && productsMap.size < limit) {
          productsMap.set(p._id.toString(), p);
        }
      }
    }

    // 2. Supplement with top verified recurring medicine & health staples
    if (productsMap.size < limit) {
      const stapleKeywords = [
        "Surbex",
        "Panadol",
        "Evion",
        "Redoxon",
        "Neurobion",
        "Augmentin",
        "CAC 1000",
        "Centrum",
        "Nexum",
        "Brufen",
        "Disprin",
        "Omega",
        "Infacol",
      ];

      for (const kw of stapleKeywords) {
        if (productsMap.size >= limit) break;
        const kwRegex = new RegExp(escapeRegex(kw), "i");
        const found = await Product.find({
          active: true,
          isNarcotic: false,
          $or: [{ name: kwRegex }, { genericName: kwRegex }, { brand: kwRegex }],
        })
          .populate("categoryIds", "name slug discount active")
          .limit(2);

        for (const p of found) {
          if (!productsMap.has(p._id.toString()) && productsMap.size < limit) {
            productsMap.set(p._id.toString(), p);
          }
        }
      }
    }

    // 3. If still needed, fill with active products
    if (productsMap.size < limit) {
      const remaining = await Product.find({
        active: true,
        isNarcotic: false,
        _id: { $nin: Array.from(productsMap.keys()) },
      })
        .populate("categoryIds", "name slug discount active")
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit - productsMap.size);

      for (const p of remaining) {
        productsMap.set(p._id.toString(), p);
      }
    }

    // Format all products with images and active discounts
    return Array.from(productsMap.values()).map((prod) => {
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
  isAbusiveOrInappropriate,
  validateProductMatches,
};
