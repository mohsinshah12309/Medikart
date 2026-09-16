/**
 * CommissionBalance Model
 *
 * Tracks the cumulative outstanding commission balance a pharmacy owes Medikart.
 */

const mongoose = require("mongoose");

const commissionBalanceSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      unique: true,
      index: true,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaidVerified: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    lastVerifiedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CommissionBalance", commissionBalanceSchema);
