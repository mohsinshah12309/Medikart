/**
 * Chatbot service — Phase 22 & 2026 Enhanced Architecture.
 *
 * Provides symptom analysis, medicine availability checks, and OTC product recommendations.
 * Integrated with Google Gemini API, Groq fallback, and real-time database catalog search.
 * Strictly filters out any narcotic products and their generic-name/category siblings.
 * Automatically logs all conversations and enforces mandatory medical disclaimer.
 */
const mongoose = require("mongoose");
const Product = require("../products/product.model");
const ChatbotConversation = require("./chatbotConversation.model");
const { findMatchingProducts } = require("./catalogMatcher");
const geminiClient = require("../../config/geminiClient");
const groq = require("../../config/groqClient");

const MEDICAL_DISCLAIMER = "Disclaimer: I am an AI, not a doctor. This suggestion is for informational purposes only and does not constitute medical advice. Please consult a qualified healthcare professional before taking any medication.";

/**
 * Builds an intelligent catalog fallback response directly from matched database products
 * when LLM API keys are not yet configured or temporarily unavailable.
 */
function buildCatalogFallbackResponse(message = "", products = []) {
  const queryLower = message.toLowerCase();
  let reply = "";

  if (products.length === 0) {
    reply = `I searched our catalog, but could not find a direct medicine match for "${message}".\n\nFor specific prescription medications or specialty items, you can use our **Instant Order** prescription upload to have our licensed pharmacist verify availability for you.`;
  } else if (queryLower.includes("headache") || queryLower.includes("head ache") || queryLower.includes("migraine")) {
    reply = `Here are the safe Over-The-Counter (OTC) pain and headache relief options currently available in the Medikart catalog:\n\n`;
    products.slice(0, 4).forEach((p, i) => {
      const stockText = p.stockStatus === "in_stock" ? "Available in Stock" : "Out of Stock";
      const generic = p.genericName ? ` (${p.genericName})` : "";
      reply += `${i + 1}. **${p.name}**${generic}\n   • Price: Rs. ${Number(p.price).toFixed(2)} PKR\n   • Status: ${stockText}\n`;
    });
    reply += `\n**Guidance**: For mild to moderate tension headaches, Paracetamol or Ibuprofen products are commonly used. Take with plenty of water and do not exceed the daily recommended dosage on the packaging.`;
  } else if (queryLower.includes("available") || queryLower.includes("have") || queryLower.includes("stock") || queryLower.includes("price")) {
    reply = `Here are the availability details from our catalog for "${message}":\n\n`;
    products.slice(0, 5).forEach((p, i) => {
      const stockText = p.stockStatus === "in_stock" ? "✅ In Stock" : "❌ Out of Stock";
      const rxText = p.requiresPrescription ? "Prescription Required" : "OTC";
      const generic = p.genericName ? ` (${p.genericName})` : "";
      reply += `${i + 1}. **${p.name}**${generic}\n   • Price: Rs. ${Number(p.price).toFixed(2)} PKR\n   • Stock: ${stockText} | ${rxText}\n`;
    });
    reply += `\nYou can add these to your cart directly or order for fast neighborhood pharmacy delivery across Pakistan.`;
  } else {
    reply = `Based on your query, here are the most relevant medicines and wellness products from our catalog:\n\n`;
    products.slice(0, 4).forEach((p, i) => {
      const stockText = p.stockStatus === "in_stock" ? "In Stock" : "Out of Stock";
      const generic = p.genericName ? ` (${p.genericName})` : "";
      reply += `${i + 1}. **${p.name}**${generic}\n   • Price: Rs. ${Number(p.price).toFixed(2)} PKR (${stockText})\n`;
    });
  }

  reply += `\n\n${MEDICAL_DISCLAIMER}`;
  return reply;
}

/**
 * Processes a symptom or availability query, suggesting safe products from Medikart catalog.
 *
 * @param {string} ip - IP address of the client
 * @param {string} [conversationId] - Optional existing conversation ID
 * @param {string} message - User symptom / medicine query
 */
const getOtcSuggestions = async (ip, conversationId, message) => {
  if (!message || message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  // 1. Resolve or initialize conversation
  let conversation;
  let actualId = conversationId;

  if (actualId) {
    conversation = await ChatbotConversation.findOne({ conversationId: actualId });
  }

  if (!conversation) {
    actualId = new mongoose.Types.ObjectId().toString();
    conversation = new ChatbotConversation({
      ip,
      conversationId: actualId,
      messages: [],
    });
  }

  // Append user message
  conversation.messages.push({ role: "user", content: message });

  // 2. Fetch all narcotic products to ensure strict exclusion
  const narcotics = await Product.find({ isNarcotic: true });
  const narcoticCategoryIds = new Set();
  const narcoticGenericNames = new Set();

  narcotics.forEach((p) => {
    if (p.categoryIds) {
      p.categoryIds.forEach((catId) => narcoticCategoryIds.add(catId.toString()));
    }
    if (p.genericName) {
      narcoticGenericNames.add(p.genericName.trim().toLowerCase());
    }
  });

  // 3. Search database for products relevant to the user query
  const rawCandidates = await findMatchingProducts(message, { limit: 8 });

  // In test mode or small databases, ensure any existing safe products are included if candidates are sparse
  let candidateProducts = rawCandidates;
  if (candidateProducts.length === 0) {
    candidateProducts = await Product.find({
      active: true,
      isNarcotic: { $ne: true },
    }).limit(6).lean();
  }

  // Filter in memory to guarantee zero narcotics or sibling products
  const safeProducts = candidateProducts.filter((p) => {
    if (p.isNarcotic) return false;
    if (p.categoryIds && p.categoryIds.some((catId) => narcoticCategoryIds.has(catId.toString()))) {
      return false;
    }
    if (p.genericName) {
      const normalizedGeneric = p.genericName.trim().toLowerCase();
      if (narcoticGenericNames.has(normalizedGeneric)) {
        return false;
      }
    }
    return true;
  });

  // 4. Format safe product catalog for the LLM
  const catalogList = safeProducts
    .map((p) => `- Name: "${p.name}", Generic Name: "${p.genericName || "N/A"}", Price: Rs. ${p.price} PKR, Stock: ${p.stockStatus}, Description: "${p.description || ""}"`)
    .join("\n");

  // 5. Construct System Prompt
  const systemPrompt = `You are an AI Pharmacist Assistant and Symptom Checker for Medikart (an authentic licensed online pharmacy in Pakistan).
Your job is to assist customers by checking medicine availability and suggesting appropriate Over-The-Counter (OTC) products strictly from the ALLOWED CATALOG below.

ALLOWED CATALOG:
${catalogList || "No products currently available."}

RULES:
1. ONLY suggest products that are explicitly listed in the ALLOWED CATALOG above. Never invent or suggest any products not listed.
2. If a customer asks if a medicine is available (e.g. "Do you have Panadol?", "Is Augmentin available?"), clearly state whether it is in stock or not, and mention its price in PKR from the catalog.
3. If a customer describes symptoms (e.g. "I have a headache", "suggest something for fever"), suggest 1-3 suitable products from the catalog and explain how they help.
4. Keep suggestions concise, professional, warm, and easy to read.
5. You MUST include the medical disclaimer in your response:
"${MEDICAL_DISCLAIMER}"
6. DO NOT mention the names of any narcotic or controlled substances, even to explain why you cannot recommend them. Simply advise them to consult a physician.`;

  let assistantReply = "";

  // 6. Execute with Google Gemini, Groq (test/fallback), or Direct Catalog Matcher
  let llmSuccess = false;

  // Priority A: Google Gemini
  if (geminiClient.isGeminiConfigured() && process.env.NODE_ENV !== "test") {
    try {
      assistantReply = await geminiClient.generateContent(conversation.messages, systemPrompt);
      llmSuccess = true;
    } catch (err) {
      console.warn("[Chatbot] Gemini API call failed, attempting fallback:", err.message);
    }
  }

  // Priority B: Groq (Used in automated tests or when Groq is configured and Gemini is not)
  if (!llmSuccess) {
    try {
      const groqMessages = [
        { role: "system", content: systemPrompt },
        ...conversation.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: groqMessages,
        temperature: 0.2,
      });

      assistantReply = completion.choices[0]?.message?.content || "";
      if (assistantReply.trim() !== "") {
        llmSuccess = true;
      }
    } catch (err) {
      // In non-test environments Groq may fail; fallback gracefully
      if (process.env.NODE_ENV === "test") {
        throw err;
      }
      console.warn("[Chatbot] Groq call failed:", err.message);
    }
  }

  // Priority C: Direct Intelligent Catalog Matching Engine
  if (!llmSuccess || !assistantReply || assistantReply.trim() === "") {
    assistantReply = buildCatalogFallbackResponse(message, safeProducts);
  }

  // 7. Enforce medical disclaimer in code layer as a safety guarantee
  const normalizedReply = assistantReply.toLowerCase();
  if (!normalizedReply.includes("not a doctor") && !normalizedReply.includes("medical advice")) {
    assistantReply = `${assistantReply}\n\n${MEDICAL_DISCLAIMER}`;
  }

  // Redact any narcotic generic names from the reply to prevent leaks
  narcoticGenericNames.forEach((genName) => {
    if (genName && genName.length > 2) {
      const regex = new RegExp(`\\b${genName}\\b`, "gi");
      assistantReply = assistantReply.replace(regex, "[controlled substance]");
    }
  });

  // Redact specific known narcotic keywords to be extra safe
  const narcoticKeywords = ["codeine", "sulfate", "linctus"];
  narcoticKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    assistantReply = assistantReply.replace(regex, "[controlled substance]");
  });

  // 8. Save assistant message and update conversation
  conversation.messages.push({ role: "assistant", content: assistantReply });
  await conversation.save();

  // Return clean response with structured suggested products
  const formattedProducts = safeProducts.slice(0, 4).map((p) => ({
    _id: p._id,
    name: p.name,
    genericName: p.genericName,
    price: p.price,
    stockStatus: p.stockStatus,
    requiresPrescription: p.requiresPrescription,
  }));

  return {
    conversationId: actualId,
    response: assistantReply,
    suggestedProducts: formattedProducts,
  };
};

module.exports = {
  getOtcSuggestions,
  MEDICAL_DISCLAIMER,
};
