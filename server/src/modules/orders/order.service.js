/**
 * Order service — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Delegates order placement to the correct handler by type.
 * Phase 15 (narcotics) will add its own handler branch.
 */

const { placeStandardOrder } = require('./standardOrder.handler');
const { placeInstantOrder } = require('./instantOrder.handler');
const Order = require('./order.model');
const Product = require('../products/product.model');
const { getEffectivePrice } = require('../discounts/discount.service');
const { getStorewideDiscount } = require('../settings/settings.service');
const { getDeliveryCharge } = require('../cities/city.service');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Route order placement to the correct handler by type.
 */
const placeOrder = async (type, payload) => {
  if (type === 'standard') return placeStandardOrder(payload);
  if (type === 'instant') return placeInstantOrder(payload);
  throw new BadRequestError(`Unknown order type: ${type}`);
};

/**
 * Get a paginated, optionally filtered list of orders (admin).
 */
const getOrders = async ({ type, status, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit };
};

/**
 * Get a single order by MongoDB ID (admin).
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  return order;
};

/**
 * Admin pricing for instant orders (Phase 14 / FR-AD-19).
 *
 * Security guarantees:
 *   1. Only allows updating items and totals (write allow-list).
 *   2. Prevents silent overwrite of already-priced orders (status check).
 *   3. Server-side price computation for each item (never trust client).
 *   4. Validates product existence and active status.
 *   5. Moves order from awaiting-pharmacist-pricing → pending on success.
 */
const priceInstantOrder = async (orderId, { items }) => {
  // Step 1: Load order and validate it's awaiting pricing
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  if (order.type !== 'instant') {
    throw new BadRequestError('Only instant orders can be priced through this endpoint');
  }

  if (order.status !== 'awaiting-pharmacist-pricing') {
    throw new ForbiddenError('This order has already been priced or is not in a priceable state');
  }

  // Step 2: Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError('At least one item is required');
  }

  // Step 3: Fetch products from DB (never trust client prices)
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    active: true,
  }).populate('categoryIds', 'name slug discount');

  // Step 4: Validate existence for every requested item
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) throw new NotFoundError(`Product not found: ${item.productId}`);
  }

  // Step 5: Fetch storewide discount once
  const storewidePercent = await getStorewideDiscount();

  // Step 6: Build order items with server-computed effective prices
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    const category = product.categoryIds?.[0] ?? null;
    const { effectivePrice } = getEffectivePrice(product, category, storewidePercent);
    return {
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: item.quantity,
    };
  });

  // Step 7: Compute totals server-side
  const subtotal = round2(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const deliveryCharge = await getDeliveryCharge(order.customer.city);
  const total = round2(subtotal + deliveryCharge);

  // Step 8: Check if any item is a narcotic and update requiresVerification
  const requiresVerification = products.some((product) => product.isNarcotic === true);

  // Step 9: Update order with pricing, move to pending status
  order.items = orderItems;
  order.totals = { subtotal, deliveryCharge, total };
  order.requiresVerification = requiresVerification;
  order.status = 'pending';

  await order.save();

  return order;
};

module.exports = { placeOrder, getOrders, getOrderById, priceInstantOrder };
