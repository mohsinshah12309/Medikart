/**
 * CustomerPasswordReset Model — Single-use password reset tokens for customers.
 *
 * Fields:
 *   tokenHash   - SHA-256 hash of the 32-byte hex token (never plaintext)
 *   customerId  - ObjectId referencing Customer
 *   expiresAt   - 30-minute expiry
 *   used        - single-use consumption flag
 */

const mongoose = require("mongoose");

const customerPasswordResetSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
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

// TTL index — automatic cleanup 1 hour after expiresAt
customerPasswordResetSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 3600 }
);

module.exports = mongoose.model(
  "CustomerPasswordReset",
  customerPasswordResetSchema
);
