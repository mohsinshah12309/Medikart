/**
 * OTP Model — Phase 12 (Email OTP Verification).
 *
 * Schema for stored OTPs.
 * Per NFR-SEC-03 and PRD specifications:
 * - email: recipient email
 * - codeHash: bcrypt hash of the 6-digit code (NEVER raw code)
 * - expiresAt: 10 minutes from creation
 * - verified: single-use flag
 * - attempts: failed verification attempt count (max 4 allowed)
 * - invalidated: flagged when replaced by new OTP or when attempts >= 4
 */

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    invalidated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup by email and query sorting
otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }); // cleanup after 24 hours

module.exports = mongoose.model("Otp", otpSchema);
