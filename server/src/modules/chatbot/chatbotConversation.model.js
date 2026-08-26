/**
 * Chatbot Conversation model — Phase 22 (AI Chatbot).
 */
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatbotConversationSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    conversationId: { type: String, required: true, unique: true },
    messages: [messageSchema],
  },
  {
    timestamps: true,
    collection: "chatbotConversations",
  }
);

module.exports = mongoose.model("ChatbotConversation", chatbotConversationSchema);
