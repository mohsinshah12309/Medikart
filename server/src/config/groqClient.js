/**
 * Groq Client Config Wrapper — Phase 22 (AI Chatbot).
 * Reads GROQ_API_KEY from environment and fails loudly at startup if missing.
 */
const Groq = require("groq-sdk");

const apiKey = process.env.GROQ_API_KEY || (process.env.NODE_ENV === "test" ? "dummy_key_for_testing" : "");
if (!apiKey || apiKey.trim() === "") {
  throw new Error("GROQ_API_KEY is not set in environment variables");
}

const groq = new Groq({
  apiKey,
});

module.exports = groq;
