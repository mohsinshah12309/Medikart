/**
 * catalogMatcher.js — Intelligent Database Product Retrieval for Medikart Chatbot.
 *
 * Extracts symptoms, medicine names, and intents from customer messages,
 * searches the real MongoDB catalog, and returns safe, non-narcotic products.
 */
const Product = require("../products/product.model");

// Common symptom-to-active-ingredient/medicine keyword dictionary
const SYMPTOM_KEYWORD_MAP = {
  headache: ["paracetamol", "panadol", "brufen", "ibuprofen", "disprin", "calpol", "headache", "aspirin"],
  "head ache": ["paracetamol", "panadol", "brufen", "ibuprofen", "disprin", "calpol"],
  migraine: ["paracetamol", "panadol", "brufen", "ibuprofen", "migril", "sumatriptan"],
  fever: ["paracetamol", "panadol", "calpol", "febrol", "aracit", "fever"],
  temp: ["paracetamol", "panadol", "calpol", "febrol"],
  temperature: ["paracetamol", "panadol", "calpol", "febrol"],
  cough: ["hydryllin", "acefyl", "sancos", "cough", "syrup", "bronchial", "ivy"],
  cold: ["panadol cf", "arinac", "cough", "cold", "antihistamine", "flu"],
  flu: ["panadol cf", "arinac", "paracetamol", "antihistamine", "flu"],
  "sore throat": ["strepsils", "lozenge", "gargle", "throat", "benzydamine"],
  pain: ["brufen", "ibuprofen", "paracetamol", "panadol", "diclofenac", "pain", "muscoril"],
  "body ache": ["panadol", "brufen", "paracetamol", "ibuprofen", "muscoril"],
  "muscle pain": ["brufen", "muscoril", "paracetamol", "diclofenac", "relaxant"],
  stomach: ["gaviscon", "risek", "omeprazole", "famotidine", "antacid", "digestion"],
  acidity: ["gaviscon", "risek", "omeprazole", "antacid", "eno"],
  heartburn: ["gaviscon", "risek", "omeprazole", "antacid"],
  gas: ["gaviscon", "carminative", "antacid", "digestion"],
  indigestion: ["gaviscon", "eno", "antacid", "digestion"],
  diarrhea: ["ors", "imodium", "loperamide", "hydration", "flagyl"],
  vomiting: ["gravinate", "dimenhydrinate", "motilium", "domperidone", "nausea"],
  nausea: ["gravinate", "motilium", "domperidone", "nausea"],
  allergy: ["cetirizine", "rigix", "loratadine", "fexet", "fexofenadine", "claritin", "allergy"],
  itching: ["cetirizine", "rigix", "loratadine", "calamine", "allergy"],
  sneezing: ["cetirizine", "rigix", "fexet", "arinac", "allergy"],
  acne: ["clindamycin", "benzoyl", "derma", "acne", "adapalene"],
  pimple: ["clindamycin", "benzoyl", "acne"],
  skin: ["derma", "moisturizer", "cream", "lotion", "ointment"],
  sleep: ["melatonin", "sleep", "herbal", "chamomile"],
  insomnia: ["melatonin", "sleep"],
  vitamin: ["surbex", "cac 1000", "vitamin", "multivitamin", "zinc"],
  weakness: ["surbex", "cac 1000", "vitamin", "calcium", "energy"],
  calcium: ["cac 1000", "calcium", "osnate", "caltrate"],
  diabetes: ["accu-chek", "glucometer", "strips", "sugar", "glucose"],
  bp: ["blood pressure", "monitor", "hypertension"],
};

/**
 * Normalizes query string into clean tokens
 */
function extractTokens(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "for", "and", "have", "with", "from", "you", "are", "what", "how", "can", "some", "tell"].includes(w));
}

/**
 * Searches the catalog for relevant non-narcotic products based on customer query
 *
 * @param {string} userMessage
 * @param {object} options
 * @returns {Promise<Array>} Array of matched product documents
 */
async function findMatchingProducts(userMessage = "", options = {}) {
  const query = String(userMessage || "").trim().toLowerCase();
  if (!query) return [];

  const limit = options.limit || 8;
  const searchTerms = new Set();

  // 1. Check for matched symptoms in dictionary
  for (const [symptom, keywords] of Object.entries(SYMPTOM_KEYWORD_MAP)) {
    if (query.includes(symptom)) {
      keywords.forEach((k) => searchTerms.add(k));
    }
  }

  // 2. Add individual tokens from user's message
  const tokens = extractTokens(query);
  tokens.forEach((t) => searchTerms.add(t));

  const termsArray = Array.from(searchTerms);

  // 3. Build MongoDB query conditions
  // Look for exact phrase, individual tokens, or mapped keywords in name, genericName, or description
  const regexConditions = [];

  // Direct phrase match has highest priority
  if (query.length > 2 && query.length < 50) {
    regexConditions.push({ name: { $regex: query, $options: "i" } });
    regexConditions.push({ genericName: { $regex: query, $options: "i" } });
  }

  // Term matches
  termsArray.forEach((term) => {
    if (term.length >= 3) {
      regexConditions.push({ name: { $regex: term, $options: "i" } });
      regexConditions.push({ genericName: { $regex: term, $options: "i" } });
      regexConditions.push({ description: { $regex: term, $options: "i" } });
    }
  });

  const baseFilter = {
    active: true,
    isNarcotic: { $ne: true },
  };

  let matchedProducts = [];

  if (regexConditions.length > 0) {
    matchedProducts = await Product.find({
      ...baseFilter,
      $or: regexConditions,
    })
      .limit(limit * 2)
      .lean();
  }

  // 4. Fallback if no specific regex matched: fetch top popular OTC / general products
  if (matchedProducts.length === 0) {
    matchedProducts = await Product.find({
      ...baseFilter,
      stockStatus: "in_stock",
    })
      .limit(limit)
      .lean();
  }

  // 5. Deduplicate and score products by relevance
  const scored = matchedProducts.map((p) => {
    let score = 0;
    const nameLower = (p.name || "").toLowerCase();
    const genericLower = (p.genericName || "").toLowerCase();

    // Bonus for in-stock
    if (p.stockStatus === "in_stock") score += 5;

    // Exact query match in name
    if (nameLower.includes(query)) score += 20;
    if (genericLower.includes(query)) score += 15;

    // Term matches
    termsArray.forEach((term) => {
      if (nameLower.includes(term)) score += 6;
      if (genericLower.includes(term)) score += 4;
    });

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}

module.exports = {
  findMatchingProducts,
  SYMPTOM_KEYWORD_MAP,
};
