/**
 * Chatbot routes — Phase 22.
 */
const express = require("express");
const router = express.Router();
const chatbotController = require("./chatbot.controller");
const { createRateLimiter } = require("../../middleware/rateLimiter");

const chatbotLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many chatbot requests. Please try again in 15 minutes.",
});

router.post("/", chatbotLimiter, chatbotController.handleChatbotMessage);

module.exports = router;
