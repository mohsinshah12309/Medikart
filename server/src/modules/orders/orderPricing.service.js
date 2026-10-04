const Order = require("./order.model");
const Product = require("../products/product.model");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getStorewideDiscount } = require("../settings/settings.service");
const { getDeliveryCharge } = require("../cities/city.service");
const { logActivity } = require("../activity-logs/activityLog.service");
const { sendInstantOrderPricedEmail } = require("./orderNotification.service");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../../utils/errors");

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Order Pricing & Prescription Verification Service (SRP)
 * Encapsulates pharmacist pricing for instant orders and narcotics prescription review.
 */

/**
 * Admin pricing for instant orders (Phase 14 / FR-AD-19).
 */
const priceInstantOrder = async (orderId, { items }, admin = null) => {
  // Step 1: Load order and validate it's awaiting pricing
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    const assignedId = order.assignedPharmacyId?.toString();
    if (assignedId !== admin.assignedPharmacyId.toString()) {
      throw new ForbiddenError("Access denied: You can only price orders assigned to your pharmacy.");
    }
  }

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
  const platformFee = 10;
  const subtotal = round2(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  const deliveryCharge = await getDeliveryCharge(order.customer.city);
  const total = round2(subtotal + deliveryCharge + platformFee);

  // Step 8: NEVER recompute requiresVerification from live Product data.
  const { requiresVerification } = order;

  // Step 9: Update order with pricing.
  order.items = orderItems;
  order.totals = { subtotal, deliveryCharge, platformFee, total };
  order.status = requiresVerification ? "pending_verification" : "pending";

  await order.save();

  // Send itemized quotation & pricing email to customer (non-blocking)
  sendInstantOrderPricedEmail(order).catch((err) => {
    console.error(
      `[orders] Pricing quotation email failed for order ${order._id}: ${err.message}`
    );
  });

  return order;
};

/**
 * Admin review of a narcotics prescription (Phase 15 / FR-AD-20).
 */
const reviewNarcoticsOrder = async (orderId, decision, reviewer) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (reviewer && reviewer.role !== "super_admin" && reviewer.assignedPharmacyId) {
    const assignedId = order.assignedPharmacyId?.toString();
    if (assignedId !== reviewer.assignedPharmacyId.toString()) {
      throw new ForbiddenError("Access denied: You can only review orders assigned to your pharmacy.");
    }
  }

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
    order.status = "pending";
  } else {
    order.verification = {
      status: "rejected",
      reviewedBy: reviewer.email || reviewer.id,
      reviewedAt: new Date(),
    };
    order.status = "rejected";
  }

  await order.save();

  // Write to Activity Logs — non-blocking
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
  priceInstantOrder,
  reviewNarcoticsOrder,
};
