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
  fever: ["paracetamol", "panadol", "calpol", "febrol", "aracit", "fever", "syrup"],
  temp: ["paracetamol", "panadol", "calpol", "febrol", "syrup"],
  temperature: ["paracetamol", "panadol", "calpol", "febrol", "syrup"],
  cough: ["hydryllin", "acefyl", "sancos", "cough", "syrup", "bronchial", "ivy"],
  cold: ["panadol cf", "arinac", "cough", "cold", "antihistamine", "flu", "syrup", "saline"],
  flu: ["panadol cf", "arinac", "paracetamol", "calpol", "febrol", "flu", "syrup", "saline", "antihistamine"],
  "sore throat": ["strepsils", "lozenge", "gargle", "throat", "benzydamine"],
  pain: ["brufen", "ibuprofen", "paracetamol", "panadol", "diclofenac", "pain", "muscoril"],
  "body ache": ["panadol", "brufen", "paracetamol", "ibuprofen", "muscoril"],
  "muscle pain": ["brufen", "muscoril", "paracetamol", "diclofenac", "relaxant"],
  stomach: ["gaviscon", "risek", "omeprazole", "famotidine", "antacid", "digestion"],
  acidity: ["gaviscon", "risek", "omeprazole", "antacid", "eno"],
  heartburn: ["gaviscon", "risek", "omeprazole", "antacid"],
  gas: ["gaviscon", "carminative", "antacid", "digestion"],
  indigestion: ["gaviscon", "eno", "antacid", "digestion"],
  diarrhea: ["ors", "imodium", "loperamide", "hydration", "flagyl", "entox"],
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

// Pediatric specific mappings for young children / toddlers / infants
const PEDIATRIC_SYMPTOM_MAP = {
  flu: ["calpol", "febrol", "panadol syrup", "arinac syrup", "saline", "rhino-sal", "drops"],
  fever: ["calpol", "febrol", "panadol syrup", "paracetamol syrup", "febrol drops"],
  cold: ["calpol", "arinac syrup", "saline", "rhino-sal", "panadol syrup", "drops"],
  cough: ["hydryllin infant", "acefyl syrup", "sancos syrup", "ivy syrup", "prospan"],
  diarrhea: ["ors", "pediatric electrolyte", "zincat", "probiotic", "enterogermina"],
  vomiting: ["gravinate syrup", "motilium syrup", "domperidone suspension", "ors"],
};

// Words that indicate pediatric / child patient
const PEDIATRIC_KEYWORDS = [
  "son", "daughter", "child", "children", "kid", "kids", "baby", "babies",
  "infant", "infants", "toddler", "toddlers", "boy", "girl",
  "year old", "years old", "months old", "month old", "pediatric", "paediatric",
  "syrup", "drops", "suspension", "drops", "2 year", "2 years", "3 year", "1 year"
];

// Non-medicinal items to strictly exclude from symptom-based health recommendations
const NON_MEDICINE_EXCLUSIONS = [
  "7up", "pepsi", "coke", "coca cola", "sprite", "fanta", "mirinda", "mountain dew",
  "sting", "red bull", "juice", "soda", "beverage", "battery", "batteries", "cell",
  "cells", "duracell", "toshiba cell", "aa battery", "aaa battery", "snack", "chips",
  "wafer", "biscuit", "detergent", "soap bar"
];

/**
 * Checks if a user message is purely a greeting or chit-chat with no illness or medicine intent.
 */
function isGreetingOrChitchat(text = "") {
  const clean = text.trim().toLowerCase();
  if (!clean) return true;

  // Check if any medical symptom or active ingredient is mentioned
  for (const symptom of Object.keys(SYMPTOM_KEYWORD_MAP)) {
    if (clean.includes(symptom)) return false;
  }
  const medicineTerms = ["panadol", "augmentin", "brufen", "disprin", "calpol", "arinac", "paracetamol", "antibiotic", "tablet", "syrup", "capsule", "injection", "medicine", "dawa", "dawai", "prescription", "rx"];
  if (medicineTerms.some((t) => clean.includes(t))) return false;

  const GREETING_PATTERNS = [
    /^how\s+are\s+you/i,
    /^how\s+r\s+u/i,
    /^how\s+do\s+you\s+do/i,
    /^what'?s\s+up/i,
    /^who\s+are\s+you/i,
    /^what\s+are\s+you/i,
    /^hi\b/i,
    /^hello\b/i,
    /^hey\b/i,
    /^good\s+(morning|afternoon|evening|night|day)/i,
    /^salam\b/i,
    /^assalam/i,
    /^aoa\b/i,
    /^thanks?\b/i,
    /^thank\s+you/i,
    /^ok\b/i,
    /^okay\b/i,
    /^bye\b/i,
    /^help\b/i,
    /^what\s+can\s+you\s+do/i,
  ];

  return GREETING_PATTERNS.some((pattern) => pattern.test(clean));
}

/**
 * Checks if query is for pediatric / child patient.
 */
function isPediatricQuery(text = "") {
  const clean = text.toLowerCase();
  return PEDIATRIC_KEYWORDS.some((kw) => clean.includes(kw));
}

/**
 * Normalizes query string into clean tokens
 */
function extractTokens(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "for", "and", "have", "with", "from", "you", "are", "what", "how", "can", "some", "tell", "having", "with"].includes(w));
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

  // If message is pure greeting/chit-chat, do not search or return any medicines
  if (isGreetingOrChitchat(query)) {
    return [];
  }

  const limit = options.limit || 8;
  const isPediatric = isPediatricQuery(query);
  const searchTerms = new Set();

  // 1. Check for matched symptoms in dictionary
  if (isPediatric) {
    for (const [symptom, keywords] of Object.entries(PEDIATRIC_SYMPTOM_MAP)) {
      if (query.includes(symptom)) {
        keywords.forEach((k) => searchTerms.add(k));
      }
    }
  }

  for (const [symptom, keywords] of Object.entries(SYMPTOM_KEYWORD_MAP)) {
    if (query.includes(symptom)) {
      keywords.forEach((k) => searchTerms.add(k));
    }
  }

  // 2. Add individual tokens from user's message (excluding generic child words like "son", "old")
  const tokens = extractTokens(query).filter((t) => !["son", "old", "years", "year", "having", "baby", "kid", "child", "boy", "girl"].includes(t));
  tokens.forEach((t) => searchTerms.add(t));

  const termsArray = Array.from(searchTerms);
  if (termsArray.length === 0) return [];

  // 3. Build MongoDB query conditions
  const regexConditions = [];

  // Direct phrase match
  if (query.length > 2 && query.length < 50 && !isPediatric) {
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
      .limit(limit * 3)
      .lean();
  }

  // Filter out non-medicinal items (drinks like 7up, batteries, snacks)
  matchedProducts = matchedProducts.filter((p) => {
    const nameLower = (p.name || "").toLowerCase();
    const isNonMedicine = NON_MEDICINE_EXCLUSIONS.some((ex) => nameLower.includes(ex));
    if (isNonMedicine) return false;

    // If pediatric, filter out pure adult solid forms (e.g. "500mg tablets", "panadol cf tablet", "extra tablet") unless it's a syrup or suspension
    if (isPediatric) {
      const isAdultTablet = (nameLower.includes("tablet") || nameLower.includes("tab") || nameLower.includes("capsule") || nameLower.includes("cap") || nameLower.includes("500mg") || nameLower.includes("extra")) && !nameLower.includes("syrup") && !nameLower.includes("suspension") && !nameLower.includes("drop");
      if (isAdultTablet) return false;
    }

    return true;
  });

  // 4. Deduplicate and score products by relevance
  const scored = matchedProducts.map((p) => {
    let score = 0;
    const nameLower = (p.name || "").toLowerCase();
    const genericLower = (p.genericName || "").toLowerCase();

    // Bonus for in-stock
    if (p.stockStatus === "in_stock") score += 5;

    // Pediatric preference bonus
    if (isPediatric) {
      if (nameLower.includes("syrup") || nameLower.includes("suspension") || nameLower.includes("drops") || nameLower.includes("pediatric") || nameLower.includes("infant") || nameLower.includes("calpol") || nameLower.includes("febrol")) {
        score += 25;
      }
    }

    // Exact query match in name
    if (nameLower.includes(query)) score += 20;
    if (genericLower.includes(query)) score += 15;

    // Term matches
    termsArray.forEach((term) => {
      if (nameLower.includes(term)) score += 8;
      if (genericLower.includes(term)) score += 6;
    });

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}

module.exports = {
  findMatchingProducts,
  isGreetingOrChitchat,
  isPediatricQuery,
  SYMPTOM_KEYWORD_MAP,
  PEDIATRIC_SYMPTOM_MAP,
};

