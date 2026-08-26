/**
 * Chatbot controller — Phase 22.
 */
const chatbotService = require("./chatbot.service");

const handleChatbotMessage = async (req, res, next) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      "127.0.0.1";

    const { conversationId, symptoms } = req.body;

    if (!symptoms || symptoms.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Symptoms text is required",
      });
    }

    const result = await chatbotService.getOtcSuggestions(ip, conversationId, symptoms);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChatbotMessage,
};
