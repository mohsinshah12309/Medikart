/**
 * Monthly Refill Model — Customer Saved Recurring Prescription & Medicine List.
 *
 * Implements:
 *   - Customer-scoped monthly medicine refill queue.
 *   - Auto-reminder cycle tracking (lastOrderedAt, nextReminderAt, reminderSentAt).
 *   - Timestamps for automated audit logging.
 */

const mongoose = require("mongoose");

const refillItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const monthlyRefillSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      unique: true,
      index: true,
    },
    items: {
      type: [refillItemSchema],
      default: [],
    },
    lastOrderedAt: {
      type: Date,
      default: null,
    },
    nextReminderAt: {
      type: Date,
      default: null,
      index: true,
    },
    reminderSentAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for cron querying: list items requiring email reminders
monthlyRefillSchema.index({ nextReminderAt: 1, reminderSentAt: 1 });

module.exports = mongoose.model("MonthlyRefill", monthlyRefillSchema);
