/**
 * Product model — Phase 3 (Core Data Models).
 *
 * Schema only. No business logic here (discount calculation, narcotics gating,
 * etc. live in the service layer in later phases).
 *
 * Per PRD Section 14 & Section 12:
 * - isNarcotic is a boolean FLAG on the product, NOT a reference to a
 *   "Narcotics" category document. A flagged product stays in its normal
 *   category and simply carries the badge.
 * - images[] supports multiple images per product (FR-AD-40), one marked
 *   primary/cover.
 * - discount{} is modeled now (PRD Section 9) but has no logic yet —
 *   discount.service.js arrives in Phase 8.
 */
const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, trim: true, unique: true },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    isNarcotic: { type: Boolean, default: false },
    requiresPrescription: { type: Boolean, default: false },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock"],
      default: "in_stock",
    },
    images: [productImageSchema],
    discount: {
      type: {
        type: String,
        enum: ["percentage"],
        default: "percentage",
      },
      value: { type: Number, min: 0, max: 100 },
      active: { type: Boolean, default: false },
    },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// Indexes for fields we already know will be searched/filtered (NFR-PERF-04).
// name: text index for keyword search. (sku already gets a unique index from
// the `unique: true` on the sku field — no duplicate declaration here.)
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);
