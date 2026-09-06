const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    imageUrl: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "🩺" },
    description: { type: String, trim: true, default: "" },
    linkedCategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    linkedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Condition", conditionSchema);
