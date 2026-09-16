/**
 * CommissionPayment Model
 *
 * Records an individual commission payment submission & verification proof for a pharmacy.
 */

const mongoose = require("mongoose");

const commissionPaymentSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    screenshotUrl: {
      type: String,
      required: true,
      trim: true,
    },
    periodFrom: {
      type: Date,
      required: true,
    },
    periodTo: {
      type: Date,
      required: true,
    },
    paidOnDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

commissionPaymentSchema.index({ pharmacyId: 1, createdAt: -1 });
commissionPaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("CommissionPayment", commissionPaymentSchema);
