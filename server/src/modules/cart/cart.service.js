const Cart = require("./cart.model");
const Product = require("../products/product.model");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getStorewideDiscount } = require("../settings/settings.service");
const { NotFoundError, BadRequestError } = require("../../utils/errors");

/**
 * Builds the query filter based on customerId or guestId.
 * Guarantees strict scoping — NEVER returns or modifies an unscoped cart.
 */
const getScopeFilter = ({ customerId, guestId }) => {
  if (customerId) {
    return { customerId };
  }
  if (guestId) {
    return { guestId, customerId: null };
  }
  throw new BadRequestError("Cart identifier is required (customerId or guestId)");
};

/**
 * Find or initialize a cart for the scoped user/session.
 */
const getOrCreateCart = async (scope) => {
  const filter = getScopeFilter(scope);
  let cart = await Cart.findOne(filter);
  if (!cart) {
    cart = await Cart.create({
      ...filter,
      items: [],
    });
  }
  return cart;
};

/**
 * Format cart with computed totals and verified product state.
 */
const formatCartResponse = (cart) => {
  const items = cart.items || [];
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasNarcotics = items.some((item) => item.isNarcotic);

  return {
    _id: cart._id,
    customerId: cart.customerId || null,
    guestId: cart.guestId || null,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      coverImage: item.coverImage,
      isNarcotic: Boolean(item.isNarcotic),
    })),
    cartTotal: Math.round(cartTotal * 100) / 100,
    cartCount,
    hasNarcotics,
    updatedAt: cart.updatedAt,
  };
};

/**
 * Get the user's cart.
 */
const getCart = async (scope) => {
  const cart = await getOrCreateCart(scope);
  return formatCartResponse(cart);
};

/**
 * Add an item to the cart.
 */
const addItem = async (scope, { productId, quantity = 1 }) => {
  if (!productId) {
    throw new BadRequestError("productId is required");
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) {
    throw new BadRequestError("quantity must be a positive integer");
  }

  // 1. Fetch active product and discount
  const [product, storewidePercent] = await Promise.all([
    Product.findOne({ _id: productId, active: true }).populate(
      "categoryIds",
      "name slug discount"
    ),
    getStorewideDiscount().catch(() => 0),
  ]);

  if (!product) {
    throw new NotFoundError("Product not found or unavailable");
  }

  const category = product.categoryIds?.[0] || null;
  const { effectivePrice } = getEffectivePrice(product, category, storewidePercent);

  const cart = await getOrCreateCart(scope);

  // 2. Check if product already exists in items
  const existingIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  if (existingIndex > -1) {
    const currentQty = cart.items[existingIndex].quantity;
    cart.items[existingIndex].quantity = Math.min(currentQty + qty, 99);
    cart.items[existingIndex].price = effectivePrice; // Refresh to current effective price
  } else {
    cart.items.push({
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: Math.min(qty, 99),
      coverImage: product.images?.[0] || "",
      isNarcotic: Boolean(product.isNarcotic),
    });
  }

  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Update item quantity in cart.
 */
const updateQuantity = async (scope, productId, quantity) => {
  if (!productId) {
    throw new BadRequestError("productId is required");
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty)) {
    throw new BadRequestError("Valid quantity is required");
  }

  const cart = await getOrCreateCart(scope);

  if (qty <= 0) {
    // Remove item if quantity is 0 or negative
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );
  } else {
    const target = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
    );
    if (target) {
      target.quantity = Math.min(qty, 99);
    }
  }

  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Remove an item from cart.
 */
const removeItem = async (scope, productId) => {
  if (!productId) {
    throw new BadRequestError("productId is required");
  }

  const cart = await getOrCreateCart(scope);
  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );

  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Clear all items from the cart.
 */
const clearCart = async (scope) => {
  const cart = await getOrCreateCart(scope);
  cart.items = [];
  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Merge guest cart into customer account cart on login/signup.
 */
const mergeGuestCart = async ({ customerId, guestId }) => {
  if (!customerId) {
    throw new BadRequestError("customerId is required for merge");
  }

  if (!guestId) {
    return getCart({ customerId });
  }

  const guestCart = await Cart.findOne({ guestId, customerId: null });
  const customerCart = await getOrCreateCart({ customerId });

  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    return formatCartResponse(customerCart);
  }

  // Merge items
  for (const guestItem of guestCart.items) {
    const custItemIndex = customerCart.items.findIndex(
      (it) => it.productId.toString() === guestItem.productId.toString()
    );

    if (custItemIndex > -1) {
      // Sum quantities up to max 99
      const combined = customerCart.items[custItemIndex].quantity + guestItem.quantity;
      customerCart.items[custItemIndex].quantity = Math.min(combined, 99);
    } else {
      // Append new distinct item
      customerCart.items.push(guestItem);
    }
  }

  await customerCart.save();

  // Wipe the guest cart document to avoid re-merging
  await Cart.deleteOne({ _id: guestCart._id });

  return formatCartResponse(customerCart);
};

module.exports = {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
};
