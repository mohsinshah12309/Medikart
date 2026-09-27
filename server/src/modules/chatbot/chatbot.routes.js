/**
 * Chatbot routes — Phase 22.
 */
const express = require("express");
const router = express.Router();
const chatbotController = require("./chatbot.controller");
const { createRateLimiter } = require("../../middleware/rateLimiter");

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const aiGenerationLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: isTest ? 5 : (isDev ? 100 : 20),
  message: "AI generation rate limit exceeded. Please wait a few minutes before sending another message.",
});

router.post("/", aiGenerationLimiter, chatbotController.handleChatbotMessage);

module.exports = router;
