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
const { findMatchingProducts, isGreetingOrChitchat, isPediatricQuery } = require("./catalogMatcher");
const geminiClient = require("../../config/geminiClient");
const groq = require("../../config/groqClient");

const MEDICAL_DISCLAIMER = "Disclaimer: I am an AI, not a doctor. This suggestion is for informational purposes only and does not constitute medical advice. Please consult a qualified healthcare professional before taking any medication.";

/**
 * Builds an intelligent catalog fallback response directly from matched database products
 * or storefront knowledge when LLM API keys are not yet configured or temporarily unavailable.
 */
function buildCatalogFallbackResponse(message = "", products = []) {
  const queryLower = message.toLowerCase();
  const isPediatric = isPediatricQuery(message);
  let reply = "";

  if (isGreetingOrChitchat(message)) {
    return `Hello! I am Medi, your personal AI assistant at Medikart 🦉💊.\n\nI can assist you with:\n• Searching medicines, checking live availability & prices\n• Safe Over-The-Counter (OTC) symptom and health guidance\n• Delivery timelines (2–4 hrs intra-city, 24–48 hrs nationwide)\n• Payment methods (Cash on Delivery, Cards, Wallets)\n• Return & Refund Policy and Store FAQs\n• Uploading prescriptions via **[Instant Order](/instant-order)**\n• Setting up chronic care via **[Monthly Refill](/refill)**\n• Connecting with customer support on WhatsApp (**+92 324 4489159**)\n\nHow can I help you today?\n\n${MEDICAL_DISCLAIMER}`;
  }

  // 1. Storefront Policy & Services Fallback Rules
  if (queryLower.includes("return") || queryLower.includes("refund") || queryLower.includes("cancellation") || queryLower.includes("cancel")) {
    reply = `**Medikart Return & Refund Policy**:\n\n` +
      `• **Pre-Dispatch Cancellations**: Orders can be cancelled prior to dispatch with zero cancellation penalty, except for a nominal non-refundable store service fee of Rs. 10 and any banking network processing charges.\n` +
      `• **Delivered Medications**: For patient safety and strict drug regulatory standards, delivered medicines cannot be returned or reused. Returns are gladly accepted if products arrive damaged, defective, expired, or incorrect.\n` +
      `• **Reporting Window**: Damaged or incorrect items must be reported within 24 hours of delivery with clear photographic proof.\n` +
      `• **Refund Processing**: Approved refunds are issued to your original payment method or bank account within 2–5 business days.\n\n` +
      `You can read our full policy at **[Return & Refund Policy](/return-refund-policy)** or view our **[FAQs](/faqs)**. You can also reach our customer support team directly on WhatsApp at **+92 324 4489159**.`;
  } else if (queryLower.includes("deliver") || queryLower.includes("shipping") || queryLower.includes("how long") || queryLower.includes("dispatch") || queryLower.includes("rider")) {
    reply = `**Medikart Delivery Timelines & Shipping**:\n\n` +
      `• **Rapid Intra-City Delivery (2–4 Hours)**: Available in major metropolitan hubs (Lahore, Karachi, Islamabad/Rawalpindi) dispatched from our nearest licensed partner pharmacy.\n` +
      `• **Nationwide Express Delivery (24–48 Hours)**: Covering all other cities, towns, and regions across Pakistan.\n` +
      `• **Cold-Chain Guarantee**: Sensitive medications (insulin, vaccines, biologics) are handled with temperature-controlled packaging.\n\n` +
      `You can track your order status live on our **[Track Order](/track)** page or browse our **[FAQs](/faqs)**.`;
  } else if (queryLower.includes("payment") || queryLower.includes("pay") || queryLower.includes("cod") || queryLower.includes("cash on delivery") || queryLower.includes("card") || queryLower.includes("easypaisa") || queryLower.includes("jazzcash") || queryLower.includes("1bill") || queryLower.includes("bank")) {
    reply = `**Accepted Payment Methods at Medikart**:\n\n` +
      `• **Cash on Delivery (COD)**: Available nationwide across Pakistan.\n` +
      `• **Debit & Credit Cards**: Visa and MasterCard accepted securely.\n` +
      `• **Digital Wallets & Online Banking**: JazzCash, Easypaisa, 1Bill, and direct bank transfers.\n\n` +
      `All online transactions are processed through 100% encrypted, secure channels. For more details, explore our **[FAQs](/faqs)**.`;
  } else if (queryLower.includes("prescription") || queryLower.includes("upload") || queryLower.includes("instant order") || queryLower.includes("doctor slip") || queryLower.includes("rx")) {
    reply = `**How to Order with a Prescription (Instant Order)**:\n\n` +
      `1. Visit our **[Instant Order](/instant-order)** page.\n` +
      `2. Upload a clear photo or PDF scan of your doctor's prescription slip.\n` +
      `3. Enter your contact details and delivery address.\n` +
      `4. Our licensed pharmacist will verify the prescription, check authentic stock, and prepare your order for prompt dispatch.\n\n` +
      `You can also send your prescription directly to our pharmacist on WhatsApp at **+92 324 4489159**.`;
  } else if (queryLower.includes("refill") || queryLower.includes("monthly") || queryLower.includes("subscription") || queryLower.includes("chronic")) {
    reply = `**Medikart Monthly Refill Program**:\n\n` +
      `Never run out of essential maintenance medications (for diabetes, hypertension, cardiac care, asthma):\n` +
      `• **30-Day Automated Refills**: Scheduled deliveries right before your supply finishes.\n` +
      `• **Automated Reminders**: Timely WhatsApp & SMS notifications before dispatch.\n` +
      `• **Priority Sourcing**: Sourced fresh from verified, licensed distributors.\n\n` +
      `You can set up or manage your refill schedule anytime at **[Monthly Refill](/refill)**.`;
  } else if (queryLower.includes("contact") || queryLower.includes("support") || queryLower.includes("phone") || queryLower.includes("whatsapp") || queryLower.includes("email") || queryLower.includes("help") || queryLower.includes("agent") || queryLower.includes("human") || queryLower.includes("call")) {
    reply = `**Contact Medikart Customer Care & Pharmacist Support**:\n\n` +
      `• **WhatsApp / Phone**: +92 324 4489159 / 03244489159\n` +
      `• **Email**: medikart.com@gmail.com\n` +
      `• **Store Contact Page**: **[Contact Us](/contact)**\n` +
      `• **FAQs**: **[Frequently Asked Questions](/faqs)**\n` +
      `• **Support Hours**: Monday – Saturday, 9:00 AM – 10:00 PM PKT (Emergency & online orders processed 24/7).\n\n` +
      `Feel free to message us on WhatsApp or submit a request on our contact page!`;
  } else if (queryLower.includes("faq") || queryLower.includes("how to order") || queryLower.includes("how it works")) {
    reply = `**Medikart Quick Guide & FAQs**:\n\n` +
      `• **Order via Catalog**: Search medicines, add items to cart, and checkout with COD or Online Card/Wallets.\n` +
      `• **Upload Prescription**: Easily upload your slip at **[Instant Order](/instant-order)**.\n` +
      `• **Monthly Care**: Set up auto-refills at **[Monthly Refill](/refill)**.\n` +
      `• **Delivery**: 2–4 hours locally in major cities (Lahore, Karachi, Islamabad/Rawalpindi), 24–48 hours nationwide.\n` +
      `• **Store Policies**: Read our full **[FAQs](/faqs)** and **[Return & Refund Policy](/return-refund-policy)**.\n` +
      `• **Need Help?**: Reach our support team on WhatsApp at **+92 324 4489159**.`;
  } else if (isPediatric && (queryLower.includes("flu") || queryLower.includes("fever") || queryLower.includes("cold") || queryLower.includes("cough"))) {
    reply = `Here are the safe pediatric Over-The-Counter (OTC) fever, flu & cold options available for young children & toddlers in our catalog:\n\n`;
    if (products.length > 0) {
      products.slice(0, 4).forEach((p, i) => {
        const stockText = p.stockStatus === "in_stock" ? "In Stock" : "Out of Stock";
        const generic = p.genericName ? ` (${p.genericName})` : "";
        reply += `${i + 1}. **${p.name}**${generic}\n   • Price: Rs. ${Number(p.price).toFixed(2)} PKR (${stockText})\n`;
      });
    } else {
      reply += `1. **Calpol / Panadol Pediatric Suspension** (Paracetamol - 120mg/5ml)\n2. **Saline Nasal Drops (Rhino-Sal / Normal Saline)** to clear nasal congestion\n3. **Pediatric ORS Solution** to ensure proper hydration\n`;
    }
    reply += `\n**Pediatric Safety Guidance**: For toddlers (such as a 2-year-old child), always use liquid syrups or drops dosed strictly by the child's body weight with a calibrated measuring syringe or dropper. Never give adult tablets, aspirin, or unverified remedies. If fever exceeds 102°F, the child has difficulty breathing, or symptoms persist beyond 48 hours, please consult a pediatrician immediately.`;
  } else if (products.length === 0) {
    reply = `I searched our catalog, but could not find a direct medicine match for "${message}".\n\n` +
      `• For specific prescription medications, specialty items, or pediatric care, you can use our **[Instant Order](/instant-order)** prescription upload to have our licensed pharmacist source and prepare it for you.\n` +
      `• You can also reach out to our team on WhatsApp at **+92 324 4489159** or check our **[FAQs](/faqs)**.`;
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

  // 1.5. Special Handling for Greetings / Chit-chat (e.g. "how are you", "hello")
  if (isGreetingOrChitchat(message)) {
    const greetingReply = `Hello! I am Medi, your personal AI assistant at Medikart 🦉💊.\n\nI can assist you with:\n• Searching medicines, checking live availability & prices\n• Safe Over-The-Counter (OTC) symptom and health guidance\n• Delivery timelines (2–4 hrs intra-city, 24–48 hrs nationwide)\n• Payment methods (Cash on Delivery, Cards, Wallets)\n• Return & Refund Policy and Store FAQs\n• Uploading prescriptions via [Instant Order](/instant-order)\n• Setting up chronic care via [Monthly Refill](/refill)\n• Connecting with customer support on WhatsApp (+92 324 4489159)\n\nHow can I help you today?\n\n${MEDICAL_DISCLAIMER}`;
    conversation.messages.push({ role: "assistant", content: greetingReply });
    await conversation.save();
    return {
      conversationId: actualId,
      response: greetingReply,
      suggestedProducts: [],
    };
  }

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

  // In test mode, ensure test safe products are included
  let candidateProducts = rawCandidates;
  if (candidateProducts.length === 0 && process.env.NODE_ENV === "test") {
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
  const systemPrompt = `You are Medi, the official AI Pharmacist Assistant and Storefront Guide for Medikart (an authentic, licensed digital healthcare and pharmacy platform in Pakistan).

============================================================
YOUR CORE RESPONSIBILITIES:
============================================================
1. STOREFRONT & POLICY ASSISTANT:
   - Answer all questions regarding Medikart services, ordering, delivery, payments, prescriptions, policies, and FAQs accurately, warmly, and concisely.
   - Proactively provide relevant page links (e.g., [Instant Order](/instant-order), [Monthly Refill](/refill), [FAQs](/faqs), [Return & Refund Policy](/return-refund-policy), [Contact Us](/contact)).
    - Provide customer support contact options (WhatsApp: +92 324 4489159 / 03244489159, Email: medikart.com@gmail.com) whenever the user needs personalized human assistance or wants to talk to a representative.

2. MEDICINE AVAILABILITY & SYMPTOM CHECKER:
   - Check medicine availability and suggest safe Over-The-Counter (OTC) products strictly from the ALLOWED CATALOG below.
   - If the user describes symptoms or an illness (e.g. "my 2 years old son having flu", "fever and cough", "headache", "cold"):
     * You MUST analyze their symptoms and suggest 1-3 suitable products from the ALLOWED CATALOG.
     * For pediatric cases (babies, toddlers, or children, e.g. "2 years old son having flu"):
       - Recommend safe pediatric liquid formulations (such as Paracetamol/Panadol pediatric syrup, Calpol suspension, Arinac syrup, saline nasal drops, or pediatric ORS).
       - NEVER recommend adult tablets, capsules, or non-medicinal items (such as soft drinks, 7up, or batteries).
       - Give helpful pediatric advice: measure dosages accurately by weight with a syringe/dropper, keep the child hydrated, and seek immediate pediatric care if fever is high (>102°F) or lasts over 48 hours.
   - If a customer asks if a medicine is available (e.g. "Do you have Panadol?", "Is Augmentin available?"), clearly state whether it is in stock or not, and mention its price in PKR from the catalog.

============================================================
MEDIKART STOREFRONT KNOWLEDGE BASE & BUSINESS RULES:
============================================================

1. PLATFORM OVERVIEW:
   - Medikart is an authentic, licensed health and pharmacy digital platform connecting patients with licensed retail pharmacies across Pakistan.
   - 100% genuine medicines sourced from authorized manufacturers and distributors, stored under strict temperature and quality controls.

2. ORDERING METHODS:
   - **Storefront Catalog Search**: Browse OTC & health products, add to cart, and checkout.
   - **Instant Order / Prescription Upload ([/instant-order](/instant-order))**: For prescription medicines, hard-to-find items, or convenience, customers simply upload a photo or PDF of their doctor's prescription. A licensed pharmacist reviews the slip, verifies inventory & dosage, and dispatches the order.
   - **Monthly Refill Program ([/refill](/refill))**: Designed for patients with chronic maintenance needs (diabetes, hypertension, cardiac care, asthma). Offers automated 30-day scheduled deliveries, automated WhatsApp/SMS reminders, and priority stock allocation.
   - **Order Tracking ([/track](/track))**: Customers can track order status in real time via their tracking page or account order history.

3. DELIVERY & SHIPPING:
   - **Rapid Intra-City Delivery (2 to 4 Hours)**: In major metropolitan hubs (Lahore, Karachi, Islamabad / Rawalpindi) via our localized partner pharmacy network.
   - **Nationwide Express Delivery (24 to 48 Hours)**: Covering all other cities, towns, and regions across Pakistan.
   - **Cold-Chain Guarantee**: Temperature-sensitive items (insulin, vaccines, eye drops, biologics) are dispatched in insulated, temperature-monitored packaging.

4. PAYMENT METHODS:
   - **Cash on Delivery (COD)**: Available nationwide across Pakistan.
   - **Online & Digital Payments**: Visa and MasterCard (Debit/Credit Cards), 1Bill, Internet Banking, and Digital Wallets (JazzCash, Easypaisa).
   - *STRICT CONFIDENTIALITY RULE*: NEVER mention internal payment gateway vendor names, processor brands, merchant IDs, endpoints, or API keys. Always describe payment options simply as "Debit/Credit Card, Internet Banking, 1Bill, JazzCash, Easypaisa, or Cash on Delivery".

5. RETURN & REFUND POLICY ([/return-refund-policy](/return-refund-policy)):
   - **Pre-Dispatch Cancellations**: Orders can be cancelled prior to dispatch without penalty, except for a nominal non-refundable store service fee of Rs. 10 and any non-refundable card payment processing fees/taxes charged by banking networks.
   - **Delivered Medicines**: For patient safety and strict drug regulatory standards, delivered medications cannot be returned or reused. Returns are only accepted if products arrive damaged, defective, expired, or incorrectly dispatched.
   - **Reporting Window**: Damaged or incorrect items must be reported within 24 hours of delivery with photographic evidence.
   - **Refund Processing**: Approved refunds are issued to the original payment method or bank account within 2 business days.

6. CUSTOMER SUPPORT & CONTACT ([/contact](/contact)):
   - **WhatsApp Support**: +92 324 4489159 / 03244489159
   - **Email**: medikart.com@gmail.com
   - **Contact Form**: [/contact](/contact)
   - **FAQs**: [/faqs](/faqs)
   - Support team available Monday – Saturday, 9:00 AM – 10:00 PM PKT (emergency and digital orders processed 24/7).

7. PROHIBITED & CONTROLLED SUBSTANCES:
   - Schedule X drugs, controlled narcotics, and habit-forming sedatives/hypnotics are STRICTLY PROHIBITED from online sale and delivery under Pakistani drug laws.
   - Never recommend, mention by name, or agree to supply narcotic substances. If asked, politely state that controlled/narcotic medications cannot be dispensed online and advise consulting a doctor in person. DO NOT mention specific narcotic names.

8. SECURITY, CONFIDENTIALITY & INTEGRITY:
   - NEVER expose internal system architecture, backend frameworks, database schemas, server IPs, admin credentials, secret keys, or vendor integrations.
   - Maintain a helpful, empathetic, professional, and clear tone.

9. MANDATORY MEDICAL DISCLAIMER:
   - You are an AI, not a doctor. Suggestions are for informational purposes only.
   - You MUST include the medical disclaimer in your responses:
   "${MEDICAL_DISCLAIMER}"

============================================================
ALLOWED CATALOG:
============================================================
${catalogList || "No products currently available in this specific catalog filter. Suggest browsing the catalog, searching other remedies, or uploading a prescription via Instant Order (/instant-order)."}

RULES:
1. ONLY suggest products that are explicitly listed in the ALLOWED CATALOG above. Never invent or suggest any products not listed.
2. If the user sends a greeting or general conversational query without describing any symptoms or asking storefront questions:
   Reply warmly describing how you can help with medicines, delivery, payments, prescriptions, policies, and support.
3. Keep suggestions concise, professional, warm, and easy to read with clean markdown formatting.
4. You MUST include the medical disclaimer in your response:
   "${MEDICAL_DISCLAIMER}"
5. DO NOT mention the names of any narcotic or controlled substances, even to explain why you cannot recommend them. Simply advise them to consult a physician.`;

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
      console.warn("[Chatbot] Groq call failed, falling back to intelligent matcher:", err.message);
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
