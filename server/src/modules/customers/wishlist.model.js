/**
 * Wishlist Model — Customer Saved Products.
 *
 * Fields:
 *   customerId - ObjectId referencing Customer
 *   productId  - ObjectId referencing Product
 *
 * Guarantees:
 *   - Compound unique index on (customerId, productId) prevents duplicate entries.
 *   - Cascading or fast queries by customerId.
 */

const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — a customer can save a product only once
wishlistSchema.index({ customerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
