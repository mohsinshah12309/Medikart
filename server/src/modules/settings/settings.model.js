/**
 * Settings model — Phase 8 (storewide discount) + Phase 24 (page content).
 *
 * A singleton document that holds application-wide configuration.
 * Singleton pattern: there is always exactly one Settings document.
 * The service layer enforces this via findOneAndUpdate with upsert.
 *
 * No DB migration needed for Phase 24 additions — Mongoose handles sparse
 * additions gracefully on the existing singleton document.
 */

const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Storewide discount (PRD §9.1, Phase 8).
    // Applied as fallback when no product or category discount is active.
    storewideDiscount: {
      value: {
        type: Number,
        min: [0, "Storewide discount must be between 0 and 100"],
        max: [100, "Storewide discount must be between 0 and 100"],
        default: 0,
      },
      active: { type: Boolean, default: false },
    },

    // Phase 24 — About / Contact page content.
    // Stored on the same singleton document (no new collection, no migration).
    aboutText: {
      type: String,
      default: "",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "",
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);

