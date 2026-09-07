/**
 * geminiClient.js — Google Gemini API Client Wrapper for Medikart.
 *
 * Supports Google Gemini 1.5 Flash and 2.0 Flash via Google AI Studio API.
 * Gracefully reports availability so the service can fallback when key is missing or invalid.
 */
const axios = require("axios");

function getApiKey() {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key || key.trim() === "" || key.includes("your_gemini_api_key")) {
    return null;
  }
  return key.trim();
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

function isGeminiConfigured() {
  return Boolean(getApiKey());
}

/**
 * Generates content using Google Gemini Developer API
 *
 * @param {Array<{role: string, content: string}>} conversationMessages
 * @param {string} systemInstruction
 * @returns {Promise<string>}
 */
async function generateContent(conversationMessages = [], systemInstruction = "") {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Map conversation messages to Gemini format: 'user' -> 'user', 'assistant' -> 'model'
  const contents = conversationMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: String(msg.content || "") }],
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 900,
    },
  };

  if (systemInstruction && systemInstruction.trim() !== "") {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction.trim() }],
    };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 18000,
    });

    const candidate = response.data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty text in Gemini response");
    }

    return text;
  } catch (error) {
    const errorDetail = error.response?.data?.error?.message || error.message;
    console.error(`[Gemini API Error] (${model}):`, errorDetail);
    throw new Error(`Gemini API Error: ${errorDetail}`);
  }
}

module.exports = {
  isGeminiConfigured,
  generateContent,
  getApiKey,
  getModel,
};
