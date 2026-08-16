/**
 * Order model — Phase 13 (Standard Order Workflow).
 *
 * Per PRD Section 14 database overview.
 *
 * Security / compliance notes:
 *   - `items[].price` is ALWAYS a server-computed snapshot (effective price at
 *     order time). It is written by standardOrder.handler.js — never by the client.
 *   - `requiresVerification` is snapshotted at submission time (PRD §12 / FR-AD-16).
 *     A flag change on a product after an order is placed must never alter this field
 *     on the existing order.
 *   - `gatewayTransactionId` is stored here for Phase 16 void/refund (rules.md §4).
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // server-computed effective price, snapshotted
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const totalsSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Populated on cancellation in Phase 17 (FR-AD-39)
const cancellationSchema = new mongoose.Schema(
  {
    reason: { type: String },
    cancelledBy: { type: String }, // admin ID or 'system'
    cancelledAt: { type: Date },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['standard', 'instant', 'narcotics'],
      required: true,
    },
    customer: { type: customerSchema, required: true },
    items: { type: [orderItemSchema], default: [] },
    totals: { type: totalsSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ['cod', 'card'],
      required: true,
    },
    paymentState: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'voided', 'refunded'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    requiresVerification: { type: Boolean, required: true, default: false },
    branchDescription: { type: String },    // instant orders (Phase 14)
    prescriptionUrl: { type: String },       // narcotics / instant orders (Phase 14/15)
    cancellation: { type: cancellationSchema },
    gatewayTransactionId: { type: String },  // card payments (Phase 16)
  },
  {
    timestamps: true,
  }
);

// Indexes for admin list filtering (NFR-PERF-04)
orderSchema.index({ type: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
