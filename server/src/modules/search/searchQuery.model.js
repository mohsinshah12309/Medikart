const mongoose = require("mongoose");

const searchQuerySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "💊",
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

searchQuerySchema.index({ count: -1, lastSearchedAt: -1 });

module.exports = mongoose.model("SearchQuery", searchQuerySchema);
