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
const smtp = require("../../integrations/smtp");
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
 * Get dashboard stats for the Overview screen (Phase 23 gap fix).
 *
 * Uses a single $facet aggregation — one DB round-trip, no client-side counting.
 *
 * "Today" is defined as midnight PKT (UTC+5:00) to now, which is equivalent to
 * midnight UTC − 5 hours. This is correct for Medikart's Pakistan operation.
 *
 * @returns {{ todayOrders, totalOrders, narcoticsPending, pricingPending }}
 */
const getOrderStats = async () => {
  // PKT is UTC+5. Midnight PKT = yesterday 19:00 UTC (i.e. now − ms_since_midnight_PKT).
  const now = new Date();
  // Shift now by +5h to get "current PKT time", then floor to midnight, then shift back.
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowPKT = new Date(now.getTime() + PKT_OFFSET_MS);
  const midnightPKT = new Date(
    Date.UTC(nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), nowPKT.getUTCDate())
  );
  const todayStartUTC = new Date(midnightPKT.getTime() - PKT_OFFSET_MS);

  const [result] = await Order.aggregate([
    {
      $facet: {
        todayOrders: [
          { $match: { createdAt: { $gte: todayStartUTC } } },
          { $count: "count" },
        ],
        totalOrders: [{ $count: "count" }],
        narcoticsPending: [
          { $match: { status: "pending_verification" } },
          { $count: "count" },
        ],
        pricingPending: [
          { $match: { status: "awaiting-pharmacist-pricing" } },
          { $count: "count" },
        ],
      },
    },
  ]);

  return {
    todayOrders: result.todayOrders[0]?.count ?? 0,
    totalOrders: result.totalOrders[0]?.count ?? 0,
    narcoticsPending: result.narcoticsPending[0]?.count ?? 0,
    pricingPending: result.pricingPending[0]?.count ?? 0,
  };
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

/**
 * Admin cancels an order (Phase 17).
 *
 * @param {string} orderId
 * @param {object} options
 * @param {string} options.reason - optional reason for cancellation
 * @param {object} options.admin - authenticated admin user
 */
const cancelOrder = async (orderId, { reason, admin }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  const currentStatus = order.status ? order.status.toLowerCase() : "";
  if (currentStatus !== "pending" && currentStatus !== "packed") {
    throw new BadRequestError(
      `Cannot cancel order in "${order.status}" status. Only Pending or Packed orders can be cancelled.`
    );
  }

  const refundStatus = order.paymentState === "paid" ? "refund_pending" : "not_applicable";
  const cancellationData = {
    reason,
    cancelledBy: admin.id || admin._id || admin,
    cancelledAt: new Date(),
    refundStatus,
  };

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: { $in: ["pending", "packed"] } },
    {
      $set: {
        status: "cancelled",
        cancellation: cancellationData,
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    throw new BadRequestError(
      "Cannot cancel order. It may have already been cancelled or processed."
    );
  }

  logActivity({
    actor: {
      id: admin.id || admin._id || admin,
      email: admin.email,
      role: admin.role,
    },
    action: "order_cancelled",
    entityType: "order",
    entityId: updatedOrder._id,
    before: { status: order.status },
    after: { status: "cancelled" },
  });

  sendOrderCancellationEmail(updatedOrder).catch((err) => {
    console.error(
      `[orders] Cancellation email failed for order ${updatedOrder._id}: ${err.message}`
    );
  });

  return updatedOrder;
};

/**
 * Admin marks a pending refund as completed (Phase 17).
 *
 * @param {string} orderId
 * @param {object} admin - authenticated admin user
 */
const refundOrder = async (orderId, admin) => {
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, "cancellation.refundStatus": "refund_pending" },
    {
      $set: {
        "cancellation.refundStatus": "refunded",
        "cancellation.refundedBy": admin.id || admin._id || admin,
        "cancellation.refundedAt": new Date(),
        paymentState: "refunded",
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    const existing = await Order.findById(orderId);
    if (!existing) {
      throw new NotFoundError("Order not found");
    }
    throw new BadRequestError(
      "Only orders with a refundStatus of 'refund_pending' can be marked as refunded."
    );
  }

  logActivity({
    actor: {
      id: admin.id || admin._id || admin,
      email: admin.email,
      role: admin.role,
    },
    action: "refund_marked_complete",
    entityType: "order",
    entityId: updatedOrder._id,
    before: { refundStatus: "refund_pending" },
    after: { refundStatus: "refunded" },
  });

  return updatedOrder;
};

/**
 * Sends a cancellation email to the customer.
 *
 * @param {object} order
 */
const sendOrderCancellationEmail = async (order) => {
  const isRefundPending = order.cancellation?.refundStatus === "refund_pending";
  
  let refundNoteHtml = "";
  let refundNoteText = "";

  if (isRefundPending) {
    refundNoteHtml = `<p><strong>Refund Notice:</strong> Since your order was paid online, your refund of <strong>PKR ${order.totals.total.toFixed(2)}</strong> has been initiated and will be processed manually to your account within <strong>3-5 business days</strong>.</p>`;
    refundNoteText = ` Since your order was paid online, your refund of PKR ${order.totals.total.toFixed(2)} has been initiated and will be processed manually to your account within 3-5 business days.`;
  } else {
    refundNoteHtml = `<p>No payment reversal is required for this order.</p>`;
  }

  const itemRows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${i.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">PKR ${i.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#dc2626;">Order Cancelled — Medikart</h2>
      <p>Hello ${order.customer.name},</p>
      <p>We regret to inform you that your order has been cancelled.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      ${order.cancellation?.reason ? `<p><strong>Reason for cancellation:</strong> ${order.cancellation.reason}</p>` : ""}
      ${refundNoteHtml}
      <h3 style="margin-top:20px;border-bottom:2px solid #e5e7eb;padding-bottom:4px;">Cancelled Items</h3>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;">Product</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="width:100%;margin-top:8px;">
        <tr style="font-weight:bold;font-size:1.05em;">
          <td style="padding:8px 12px;">Total Refundable Amount</td>
          <td style="padding:8px 12px;text-align:right;">PKR ${order.totals.total.toFixed(2)}</td>
        </tr>
      </table>
      <hr style="margin:16px 0;">
      <p style="color:#6b7280;font-size:0.875em;">
        If you have any questions regarding this cancellation or your refund, please reply directly to this email or contact support.
      </p>
    </div>`;

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Order Cancelled — Medikart (#${order._id})`,
    html,
    text: `Your order #${order._id} has been cancelled.${order.cancellation?.reason ? ` Reason: ${order.cancellation.reason}.` : ""}${refundNoteText} Total Amount: PKR ${order.totals.total.toFixed(2)}.`,
  });
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderStats,
  getOrderById,
  priceInstantOrder,
  reviewNarcoticsOrder,
  cancelOrder,
  refundOrder,
};
