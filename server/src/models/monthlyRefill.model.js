/**
 * Monthly Refill Model — Medikart Customer Recurring Subscription Engine.
 *
 * Implements enterprise MERN standards, strict Mongoose mode, and zero-trust data constraints.
 *
 * Security & Data Integrity guarantees:
 *   - Customer-scoped association (BOLA / IDOR defense).
 *   - Strict schema enforcement (NoSQL Injection & prototype pollution defense).
 *   - Compound indexing for optimized reminder query execution.
 */

const mongoose = require("mongoose");

const refillItemSubdocumentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    variantId: {
      type: String,
      trim: true,
      maxlength: [100, "Variant ID cannot exceed 100 characters"],
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100 per item"],
      default: 1,
    },
    unitPriceAtAddition: {
      type: Number,
      default: 0,
      min: [0, "Unit price must be non-negative"],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    timestamps: false,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to synchronize product and productId
refillItemSubdocumentSchema.pre("validate", function (next) {
  if (this.product && !this.productId) this.productId = this.product;
  if (this.productId && !this.product) this.product = this.productId;
  next();
});

const monthlyRefillSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      index: true,
    },
    items: {
      type: [refillItemSubdocumentSchema],
      validate: {
        validator: function (val) {
          // Prevent resource exhaustion: cap at 25 items per refill subscription
          return !val || val.length <= 25;
        },
        message: "Monthly refill cannot exceed 25 active items",
      },
      default: [],
    },
    frequencyDays: {
      type: Number,
      enum: {
        values: [15, 30, 45, 60],
        message: "Frequency days must be one of: 15, 30, 45, 60",
      },
      default: 30,
    },
    nextReminderDate: {
      type: Date,
      index: true,
      default: null,
    },
    nextReminderAt: {
      type: Date,
      index: true,
      default: null,
    },
    lastNotifiedAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    lastOrderedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "paused", "cancelled"],
        message: "Status must be active, paused, or cancelled",
      },
      default: "active",
      index: true,
    },
    customNotes: {
      type: String,
      trim: true,
      maxlength: [200, "Custom notes cannot exceed 200 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Strip sensitive/internal fields from egress payloads (OWASP A02)
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to sync customer and customerId, dates, etc.
monthlyRefillSchema.pre("validate", function (next) {
  if (this.customer && !this.customerId) this.customerId = this.customer;
  if (this.customerId && !this.customer) this.customer = this.customerId;

  if (this.nextReminderDate && !this.nextReminderAt) this.nextReminderAt = this.nextReminderDate;
  if (this.nextReminderAt && !this.nextReminderDate) this.nextReminderDate = this.nextReminderAt;

  if (this.lastNotifiedAt && !this.reminderSentAt) this.reminderSentAt = this.lastNotifiedAt;
  if (this.reminderSentAt && !this.lastNotifiedAt) this.lastNotifiedAt = this.reminderSentAt;

  next();
});

// Compound indexes for optimal performance and secure query execution
monthlyRefillSchema.index({ customer: 1, status: 1 });
monthlyRefillSchema.index({ customerId: 1, status: 1 });
monthlyRefillSchema.index({ nextReminderDate: 1, status: 1 });
monthlyRefillSchema.index({ nextReminderAt: 1, reminderSentAt: 1 });

const MonthlyRefill = mongoose.models.MonthlyRefill || mongoose.model("MonthlyRefill", monthlyRefillSchema);

module.exports = MonthlyRefill;
