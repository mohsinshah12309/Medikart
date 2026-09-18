const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
      default: 1,
    },
    coverImage: {
      type: String,
      default: "",
    },
    isNarcotic: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    guestId: {
      type: String,
      default: null,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound sparse indexes to ensure fast scoped lookups
cartSchema.index({ customerId: 1 }, { sparse: true });
cartSchema.index({ guestId: 1 }, { sparse: true });

// Auto-cleanup stale guest carts after 30 days of inactivity
cartSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { guestId: { $type: "string" }, customerId: null },
  }
);

module.exports = mongoose.model("Cart", cartSchema);
