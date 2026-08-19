/**
 * Order service — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Delegates order placement to the correct handler by type.
 * Phase 15 (narcotics) will add its own handler branch.
 */

const { placeStandardOrder } = require("./standardOrder.handler");
const { placeInstantOrder } = require("./instantOrder.handler");
const { placeNarcoticsOrder } = require("./narcoticsOrder.handler");
const Order = require("./order.model");
const Product = require("../products/product.model");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getStorewideDiscount } = require("../settings/settings.service");
const { getDeliveryCharge } = require("../cities/city.service");
const { logActivity } = require("../activity-logs/activityLog.service");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../../utils/errors");

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Route order placement to the correct handler by type.
 */
const placeOrder = async (type, payload) => {
  if (type === "standard") return placeStandardOrder(payload);
  if (type === "instant") return placeInstantOrder(payload);
  if (type === "narcotics") return placeNarcoticsOrder(payload);
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
  if (!order) throw new NotFoundError("Order not found");
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
  if (!order) throw new NotFoundError("Order not found");

  if (order.type !== "instant") {
    throw new BadRequestError(
      "Only instant orders can be priced through this endpoint",
    );
  }

  if (order.status !== "awaiting-pharmacist-pricing") {
    throw new ForbiddenError(
      "This order has already been priced or is not in a priceable state",
    );
  }

  // Step 2: Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("At least one item is required");
  }

  // Step 3: Fetch products from DB (never trust client prices)
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    active: true,
  }).populate("categoryIds", "name slug discount");

  // Step 4: Validate existence for every requested item
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product)
      throw new NotFoundError(`Product not found: ${item.productId}`);
  }

  // Step 5: Fetch storewide discount once
  const storewidePercent = await getStorewideDiscount();

  // Step 6: Build order items with server-computed effective prices
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    const category = product.categoryIds?.[0] ?? null;
    const { effectivePrice } = getEffectivePrice(
      product,
      category,
      storewidePercent,
    );
    return {
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: item.quantity,
    };
  });

  // Step 7: Compute totals server-side
  const subtotal = round2(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  const deliveryCharge = await getDeliveryCharge(order.customer.city);
  const total = round2(subtotal + deliveryCharge);

  // Step 8: NEVER recompute requiresVerification from live Product data.
  // The snapshot was taken at order submission time (FR-AD-16) — a product's
  // narcotics flag changing after submission must not retroactively alter
  // this order. We only READ the stored snapshot.
  const { requiresVerification } = order;

  // Step 9: Update order with pricing.
  // If the snapshotted requiresVerification is true, the order must enter the
  // narcotics verification workflow (pending_verification) — NOT proceed
  // straight to pending — so the pharmacist reviews the prescription before
  // fulfillment. Otherwise move to the normal pending status.
  order.items = orderItems;
  order.totals = { subtotal, deliveryCharge, total };
  order.status = requiresVerification ? "pending_verification" : "pending";

  await order.save();

  return order;
};

/**
 * Admin review of a narcotics prescription (Phase 15 / FR-AD-20).
 *
 * Security / compliance guarantees:
 *   1. Object-level authorization: operates ONLY on the specific order ID
 *      provided — never a bulk/indirect target.
 *   2. Confirms the order is actually awaiting verification before acting.
 *      Approving/rejecting an order that isn't in pending_verification is
 *      rejected, not silently allowed.
 *   3. `requiresVerification` is NEVER recomputed here — the snapshot from
 *      submission time is immutable (FR-AD-16).
 *   4. Approve → verification.status = 'approved', records reviewer +
 *      timestamp, order proceeds toward normal fulfillment (status → pending).
 *   5. Reject → verification.status = 'rejected', order status → 'rejected'.
 *      A rejected order can never proceed to delivered from this state.
 *   6. Every decision is written to Activity Logs (reviewer, decision,
 *      timestamp) — NFR-COMP-02.
 *
 * @param {string} orderId
 * @param {'approved'|'rejected'} decision
 * @param {object} reviewer - req.admin { id, role, email }
 */
const reviewNarcoticsOrder = async (orderId, decision, reviewer) => {
  // Step 1: Load the specific order by ID — object-level authorization is
  // implicit: this endpoint only ever touches this one document.
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  // Step 2: The order must actually be awaiting verification.
  if (order.status !== "pending_verification") {
    throw new ForbiddenError(
      "This order is not awaiting verification and cannot be reviewed",
    );
  }

  if (decision === "approved") {
    order.verification = {
      status: "approved",
      reviewedBy: reviewer.email || reviewer.id,
      reviewedAt: new Date(),
    };
    // Order proceeds toward normal fulfillment.
    order.status = "pending";
  } else {
    order.verification = {
      status: "rejected",
      reviewedBy: reviewer.email || reviewer.id,
      reviewedAt: new Date(),
    };
    // Rejected orders can never proceed to delivered from this state.
    order.status = "rejected";
  }

  await order.save();

  // Step 3: Write to Activity Logs — non-blocking (rules.md §6)
  logActivity({
    actor: reviewer,
    action: `narcotics_${decision}`,
    entityType: "order",
    entityId: order._id,
    before: { verification: { status: "pending" } },
    after: { verification: order.verification, status: order.status },
  });

  return order;
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
  priceInstantOrder,
  reviewNarcoticsOrder,
};
