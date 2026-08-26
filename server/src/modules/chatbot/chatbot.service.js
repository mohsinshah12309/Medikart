/**
 * Chatbot service — Phase 22.
 *
 * Implements symptom analysis and OTC product recommendations using Groq LLM.
 * Strictly filters out any narcotic products and their generic-name/category siblings.
 * Automatically logs all conversations and enforces medical disclaimer.
 */
const mongoose = require("mongoose");
const groq = require("../../config/groqClient");
const Product = require("../products/product.model");
const ChatbotConversation = require("./chatbotConversation.model");

const MEDICAL_DISCLAIMER = "Disclaimer: I am an AI, not a doctor. This suggestion is for informational purposes only and does not constitute medical advice. Please consult a qualified healthcare professional before taking any medication.";

/**
 * Processes a symptom symptom text input, suggesting safe OTC products.
 *
 * @param {string} ip - IP address of the client
 * @param {string} [conversationId] - Optional existing conversation ID
 * @param {string} message - User symptom text
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
    actualId = new mongoose.Types.ObjectId().toString(); // unique conversation UUID/ObjectId string
    conversation = new ChatbotConversation({
      ip,
      conversationId: actualId,
      messages: [],
    });
  }

  // Append user message
  conversation.messages.push({ role: "user", content: message });

  // 2. Fetch and filter out narcotic products and their sibling products
  // Fetch all narcotic products
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

  // Query all active and in-stock non-narcotic products first
  const candidateProducts = await Product.find({
    active: true,
    stockStatus: "in_stock",
    isNarcotic: { $ne: true },
  });

  // Filter in memory to ensure case-insensitive matching and robust category matching
  const safeProducts = candidateProducts.filter((p) => {
    // Exclude if category matches any narcotic category
    if (p.categoryIds && p.categoryIds.some((catId) => narcoticCategoryIds.has(catId.toString()))) {
      return false;
    }
    // Exclude if genericName matches any narcotic generic name (case-insensitive)
    if (p.genericName) {
      const normalizedGeneric = p.genericName.trim().toLowerCase();
      if (narcoticGenericNames.has(normalizedGeneric)) {
        return false;
      }
    }
    return true;
  });

  // 3. Format safe product catalog for the LLM
  const catalogList = safeProducts
    .map((p) => `- Name: "${p.name}", Generic Name: "${p.genericName || "N/A"}", Price: ${p.price} PKR, Description: "${p.description || ""}"`)
    .join("\n");

  // 4. Construct System Prompt
  const systemPrompt = `You are an AI symptom checker and OTC (Over-The-Counter) product recommendation assistant for Medikart.
Analyze the user's symptoms and suggest appropriate OTC products from the ALLOWED CATALOG below.

ALLOWED CATALOG:
${catalogList || "No products currently available."}

RULES:
1. ONLY suggest products that are explicitly listed in the ALLOWED CATALOG above. Never invent or suggest any other products.
2. If none of the products in the catalog are suitable for the user's symptoms, state that clearly and advise them to seek professional medical help.
3. Keep suggestions concise, professional, and limited to 2-3 products at most.
4. You MUST include the medical disclaimer in your response:
"${MEDICAL_DISCLAIMER}"
5. DO NOT mention the names of any narcotic/disallowed products in your response, even to explain why you cannot recommend them. Simply state that you cannot recommend controlled substances, prescription drugs, or narcotics, and suggest safe alternatives from the allowed catalog instead.`;

  // 5. Build messages array for Groq completions call
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...conversation.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // 6. Call Groq client
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: groqMessages,
    temperature: 0.2,
  });

  let assistantReply = completion.choices[0].message.content || "";

  // 7. Enforce medical disclaimer in the code layer as a safety fallback
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

  // Save assistant message and update conversation
  conversation.messages.push({ role: "assistant", content: assistantReply });
  await conversation.save();

  return {
    conversationId: actualId,
    response: assistantReply,
  };
};

module.exports = {
  getOtcSuggestions,
  MEDICAL_DISCLAIMER,
};
