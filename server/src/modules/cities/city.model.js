/**
 * City model — Phase 3 (Core Data Models).
 *
 * Schema only. No business logic here.
 *
 * Per PRD Section 14: name, deliveryCharge, active.
 * deliveryCharge is a Number (PKR), never a string that looks numeric.
 * Delivery-charge calculation logic (FR-CW-11) arrives in Phase 7.
 */
const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    deliveryCharge: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// Index for name lookups (NFR-PERF-04) — cities are looked up by name when
// computing delivery charges.
citySchema.index({ name: 1 });

module.exports = mongoose.model("City", citySchema);
