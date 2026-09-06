const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, trim: true, default: "" },
    placement: {
      type: String,
      enum: ["hero", "mid-page"],
      default: "hero",
      index: true,
    },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Banner", bannerSchema);
