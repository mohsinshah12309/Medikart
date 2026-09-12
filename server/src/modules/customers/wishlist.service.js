/**
 * Wishlist Service — Saved Products for Authenticated Customers.
 *
 * Implements:
 *   - Idempotent add / remove operations.
 *   - Object-level authorization (strictly scoped by customerId from JWT).
 *   - Catalog population with real-time price, effective price, and stock status.
 *   - Fast ID list retrieval for instant heart toggles on the storefront.
 */

const Wishlist = require("./wishlist.model");
const Product = require("../products/product.model");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getStorewideDiscount } = require("../settings/settings.service");
const { NotFoundError, BadRequestError } = require("../../utils/errors");

/**
 * Add product to customer's wishlist
 */
const addToWishlist = async (customerId, productId) => {
  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) {
    throw new NotFoundError("Product not found or is currently unavailable");
  }

  // Idempotent upsert
  await Wishlist.findOneAndUpdate(
    { customerId, productId },
    { $setOnInsert: { customerId, productId } },
    { upsert: true, new: true }
  );

  return {
    success: true,
    message: "Product added to wishlist",
    productId,
  };
};

/**
 * Remove product from customer's wishlist
 */
const removeFromWishlist = async (customerId, productId) => {
  await Wishlist.findOneAndDelete({ customerId, productId });

  return {
    success: true,
    message: "Product removed from wishlist",
    productId,
  };
};

/**
 * Get all wishlisted products for customer
 */
const getWishlist = async (customerId) => {
  const items = await Wishlist.find({ customerId })
    .populate({
      path: "productId",
      populate: { path: "categoryIds", select: "name slug discount" },
    })
    .sort({ createdAt: -1 });

  const storewideDiscount = await getStorewideDiscount();

  const formattedProducts = items
    .filter((item) => item.productId && item.productId.active)
    .map((item) => {
      const p = item.productId;
      const category = p.categoryIds?.[0] || null;
      const { effectivePrice, appliedDiscount } = getEffectivePrice(
        p,
        category,
        storewideDiscount
      );

      const coverImage =
        p.images?.find((img) => img.isPrimary)?.path ||
        p.images?.[0]?.path ||
        "/uploads/placeholder.webp";

      return {
        _id: p._id,
        name: p.name,
        genericName: p.genericName || "",
        sku: p.sku,
        price: p.price,
        effectivePrice,
        discountPercent: appliedDiscount ? appliedDiscount.value : 0,
        stockStatus: p.stockStatus || "in_stock",
        isNarcotic: Boolean(p.isNarcotic),
        coverImage,
        addedAt: item.createdAt,
      };
    });

  return {
    items: formattedProducts,
    count: formattedProducts.length,
  };
};

/**
 * Get array of wishlisted product IDs for fast active heart checks
 */
const getWishlistIds = async (customerId) => {
  const items = await Wishlist.find({ customerId }).select("productId").lean();
  const ids = items.map((item) => item.productId.toString());
  return {
    ids,
  };
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getWishlistIds,
};
