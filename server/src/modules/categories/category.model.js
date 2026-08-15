/**
 * Category model — Phase 3 (Core Data Models).
 *
 * Schema only. No business logic here.
 *
 * Per PRD Section 12 & Section 14:
 * - isNarcotic is a DEFAULT flag that new products in this category may
 *   inherit — it is NOT a classification of the category itself as narcotics,
 *   and it is NOT a browsable "Narcotics" category. The narcotics flag lives
 *   on the product (product.model.js).
 * - discount{} is modeled now (PRD Section 9) but has no logic yet —
 *   discount.service.js arrives in Phase 8.
 */
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    isNarcotic: { type: Boolean, default: false },
    discount: {
      value: { type: Number, min: 0, max: 100 },
      active: { type: Boolean, default: false },
    },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// (slug already gets a unique index from the `unique: true` on the slug field
// — no duplicate declaration here. NFR-PERF-04 is satisfied by that index.)

module.exports = mongoose.model("Category", categorySchema);
