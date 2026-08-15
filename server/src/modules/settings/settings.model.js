/**
 * Settings model — Phase 8 (minimal placeholder).
 *
 * A singleton document that holds application-wide configuration.
 * Only `storewideDiscount` is used in this phase. The rest of the Settings
 * module (Phase 24) will add fields to this same document — no schema migration
 * needed later because Mongoose handles sparse additions gracefully.
 *
 * Singleton pattern: there is always exactly one Settings document.
 * The service layer enforces this via findOneAndUpdate with upsert.
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

    // Phase 24 will add: storeName, logoUrl, contactEmail, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
