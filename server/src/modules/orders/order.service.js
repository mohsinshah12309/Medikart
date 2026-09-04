/**
 * Order service — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Delegates order placement to the correct handler by type.
 * Phase 15 (narcotics) will add its own handler branch.
 */

const mongoose = require("mongoose");
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
 * Get a paginated, optionally filtered and searched list of orders (admin).
 */
const getOrders = async ({ type, status, search, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  if (search && search.trim()) {
    const term = search.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(term) && term.length === 24;
    const searchConditions = [
      { "customer.name": { $regex: term, $options: "i" } },
      { "customer.email": { $regex: term, $options: "i" } },
      { "customer.phone": { $regex: term, $options: "i" } },
      { "customer.city": { $regex: term, $options: "i" } },
    ];
    if (isObjectId) {
      searchConditions.unshift({ _id: new mongoose.Types.ObjectId(term) });
    }
    query.$or = searchConditions;
  }

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
  const allowedStatuses = [
    "pending",
    "packed",
    "pending_verification",
    "awaiting-pharmacist-pricing",
  ];

  if (!allowedStatuses.includes(currentStatus)) {
    throw new BadRequestError(
      `Cannot cancel order in "${order.status}" status. Only orders in Pending or Packed (or awaiting verification/pricing) status can be cancelled.`
    );
  }

  const refundStatus = order.paymentState === "paid" ? "refund_pending" : "not_applicable";
  const cancellationData = {
    reason: reason || "Cancelled by pharmacy administration.",
    cancelledBy: admin.id || admin._id || admin,
    cancelledAt: new Date(),
    refundStatus,
  };

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: { $in: allowedStatuses } },
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

  await logActivity({
    actor: {
      id: admin.id || admin._id || admin,
      email: admin.email,
      role: admin.role,
    },
    action: "order_cancelled",
    entityType: "order",
    entityId: updatedOrder._id,
    before: { status: order.status },
    after: { status: "cancelled", cancellationReason: cancellationData.reason },
  });

  // Send cancellation email with admin reason note to customer
  try {
    await sendOrderCancellationEmail(updatedOrder);
  } catch (err) {
    console.error(
      `[orders] Cancellation email failed for order ${updatedOrder._id}: ${err.message}`
    );
  }

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

  await logActivity({
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
 * Sends a detailed cancellation email with admin reason note to the customer.
 *
 * @param {object} order
 */
const sendOrderCancellationEmail = async (order) => {
  const isRefundPending = order.cancellation?.refundStatus === "refund_pending";
  const reasonNote = order.cancellation?.reason || "Cancelled by store administration.";
  const orderTotal = order.totals?.total !== undefined ? order.totals.total : 0;
  
  let refundNoteHtml = "";
  let refundNoteText = "";

  if (isRefundPending) {
    refundNoteHtml = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <strong style="color:#1e40af;font-size:13px;display:block;margin-bottom:4px;">💳 Refund Notice:</strong>
        <span style="color:#1e3a8a;font-size:13px;line-height:1.5;">Since your order was paid online, your refund of <strong>PKR ${orderTotal.toFixed(2)}</strong> has been initiated and will be processed manually to your account within <strong>3-5 business days</strong>.</span>
      </div>`;
    refundNoteText = ` Since your order was paid online, your refund of PKR ${orderTotal.toFixed(2)} has been initiated and will be processed within 3-5 business days.`;
  } else {
    refundNoteHtml = `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #94a3b8;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <span style="color:#475569;font-size:13px;">Since this was a Cash on Delivery (COD) order, no payment was deducted or charged.</span>
      </div>`;
    refundNoteText = " Since this was a Cash on Delivery order, no payment was deducted.";
  }

  const itemRows = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#475569;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;font-weight:bold;color:#0f172a;">PKR ${i.price ? i.price.toFixed(2) : "0.00"}</td>
      </tr>`
    )
    .join("");

  const itemsTableHtml = order.items && order.items.length > 0 ? `
    <h3 style="margin-top:24px;margin-bottom:8px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Cancelled Items</h3>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px 0;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${order.totals?.total !== undefined ? `
    <table style="width:100%;margin-top:4px;">
      <tr style="font-weight:bold;font-size:14px;color:#0f172a;">
        <td style="padding:4px 0;">Order Total Amount</td>
        <td style="padding:4px 0;text-align:right;font-size:16px;">PKR ${orderTotal.toFixed(2)}</td>
      </tr>
    </table>` : ''}
  ` : '';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
      <!-- Header with branding -->
      <div style="border-bottom:2px solid #fef08a;padding-bottom:16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
        <h1 style="color:#0f172a;font-size:22px;margin:0;font-weight:900;">Medikart</h1>
        <span style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:bold;padding:3px 8px;border-radius:999px;text-transform:uppercase;margin-left:auto;">Order Cancelled</span>
      </div>

      <p style="font-size:15px;color:#1e293b;margin:0 0 12px 0;">Hello <strong>${order.customer.name}</strong>,</p>
      <p style="font-size:14px;color:#475569;margin:0 0 16px 0;line-height:1.6;">
        We regret to inform you that your order <strong>#${order._id}</strong> has been cancelled by our pharmacy team.
      </p>

      <!-- Prominent Reason Note Box -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:10px;padding:14px 18px;margin:18px 0;">
        <strong style="color:#92400e;display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">📝 Reason for Cancellation:</strong>
        <div style="color:#78350f;font-size:14px;line-height:1.5;font-weight:600;">
          ${reasonNote}
        </div>
      </div>

      ${refundNoteHtml}

      ${itemsTableHtml}

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0;">

      <!-- Support Footer -->
      <div style="font-size:12px;color:#64748b;line-height:1.6;">
        <p style="margin:0 0 6px 0;">If you have any questions or require assistance reordering, please reach out to us:</p>
        <p style="margin:0;">
          ✉️ Email: <a href="mailto:medikart.com@gmail.com" style="color:#0284c7;text-decoration:none;">medikart.com@gmail.com</a> | 
          💬 WhatsApp: <a href="https://wa.me/923314170744" style="color:#16a34a;text-decoration:none;">03314170744</a>
        </p>
      </div>
    </div>`;

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Order Cancelled — Medikart (#${order._id})`,
    html,
    text: `Hello ${order.customer.name},\n\nYour order #${order._id} has been cancelled.\nReason: ${reasonNote}\n${refundNoteText}\n\nIf you have any questions, please contact us at medikart.com@gmail.com or WhatsApp: 03314170744.\n\nTeam Medikart`,
  });
};

/**
 * Admin updates order status (pending, packed, shipped, delivered/completed, cancelled).
 *
 * @param {string} orderId
 * @param {object} options
 * @param {string} options.status - target status
 * @param {string} [options.reason] - reason if cancelling
 * @param {object} options.admin - authenticated admin user
 */
const updateOrderStatus = async (orderId, { status, reason, admin }) => {
  let targetStatus = status.toLowerCase();
  if (targetStatus === "completed") {
    targetStatus = "delivered";
  }

  // If cancelling, route through cancellation workflow with email & refund tracking
  if (targetStatus === "cancelled") {
    return cancelOrder(orderId, { reason, admin });
  }

  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.status === "cancelled") {
    throw new BadRequestError("Cannot change status of a cancelled order.");
  }

  if (order.status === "awaiting-pharmacist-pricing" && (targetStatus === "delivered" || targetStatus === "shipped" || targetStatus === "packed")) {
    throw new BadRequestError("Instant order must be priced before updating fulfillment status.");
  }

  const previousStatus = order.status;
  order.status = targetStatus;

  // If delivered and COD, mark paymentState as paid
  if (targetStatus === "delivered" && order.paymentMethod === "cod" && order.paymentState !== "paid") {
    order.paymentState = "paid";
  }

  await order.save();

  await logActivity({
    actor: {
      id: admin?.id || admin?._id || admin,
      email: admin?.email,
      role: admin?.role,
    },
    action: "order_status_updated",
    entityType: "order",
    entityId: order._id,
    before: { status: previousStatus },
    after: { status: order.status, paymentState: order.paymentState },
  });

  return order;
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
  updateOrderStatus,
};
