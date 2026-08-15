/**
 * PasswordReset model — Phase 6.
 *
 * Mirrors the OTP pattern (Phase 12 will use the same approach):
 *   - The raw token is NEVER stored. Only its SHA-256 hash lives in the DB.
 *   - Anyone holding a valid token can take over the account, so it is treated
 *     with the same care as a password — hash before storing, never log it.
 *
 * Fields:
 *   tokenHash    — SHA-256 hex digest of the raw token
 *   adminUserId  — reference to the AdminUser this reset is for
 *   expiresAt    — hard server-side expiry (30 min from creation)
 *   used         — true once the token has been consumed; prevents replay
 */

const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,  // fast lookup by hash on reset
    },

    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — MongoDB auto-deletes documents 1 hour after expiry
// (gives a small window for auditing before cleanup)
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
