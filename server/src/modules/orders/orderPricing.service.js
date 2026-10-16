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

  if (order.status !== "awaiting-pharmacist-pricing" && order.status !== "pending_verification") {
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

  // Step 9: Update order with finalized pricing.
  order.items = orderItems;
  order.totals = { subtotal, deliveryCharge, platformFee, total };
  order.status = "pending"; // Pricing finalized and approved by pharmacist
  if (order.verification) {
    order.verification.status = "approved";
    order.verification.reviewedBy = admin?.email || admin?.id || "pharmacist";
    order.verification.reviewedAt = new Date();
  }

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
 * Admin review of a prescription / narcotics order (Phase 15 / FR-AD-20).
 * Supports full approval, full rejection, assignment to sub-admin/pharmacist,
 * and partial rejection (Option 1: keep normal items, cancel rejected prescription lines, recalculate total).
 */
const reviewNarcoticsOrder = async (orderId, reviewPayload, reviewer) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  const decision = typeof reviewPayload === "string" ? reviewPayload : reviewPayload?.decision;
  const reason = typeof reviewPayload === "object" ? reviewPayload?.reason : null;
  const rejectedItemIds = Array.isArray(reviewPayload?.rejectedItemIds) ? reviewPayload.rejectedItemIds.map(String) : [];
  const assignedTo = reviewPayload?.assignedTo || null;

  // Handle assignment to sub-admin / pharmacist
  if (assignedTo) {
    order.verification = order.verification || {};
    order.verification.assignedTo = assignedTo;
    order.verification.assignedAt = new Date();
    order.assignedSubAdminId = assignedTo;
    await order.save();

    logActivity({
      actor: reviewer,
      action: "order_assigned_subadmin",
      entityType: "order",
      entityId: order._id,
      before: { assignedSubAdminId: null },
      after: { assignedSubAdminId: assignedTo },
    });

    if (!decision) {
      return order;
    }
  }

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

  const beforeVerification = order.verification ? { ...order.verification.toObject?.() || order.verification } : null;
  const beforeStatus = order.status;

  if (decision === "approved") {
    // Approve all items
    order.items.forEach((item) => {
      item.reviewStatus = "approved";
      item.rejectionReason = null;
    });
    order.verification = {
      status: "approved",
      reviewedBy: reviewer.email || reviewer.id,
      reviewedAt: new Date(),
      reason: reason || null,
      assignedTo: order.verification?.assignedTo || null,
      assignedAt: order.verification?.assignedAt || null,
    };
    order.status = "pending";
  } else if (decision === "rejected" && rejectedItemIds.length === 0) {
    // Full rejection of entire order
    order.items.forEach((item) => {
      item.reviewStatus = "rejected";
      item.rejectionReason = reason || "Prescription verification rejected.";
    });
    order.verification = {
      status: "rejected",
      reviewedBy: reviewer.email || reviewer.id,
      reviewedAt: new Date(),
      reason: reason || "Prescription verification rejected.",
      assignedTo: order.verification?.assignedTo || null,
      assignedAt: order.verification?.assignedAt || null,
    };
    order.status = "rejected";
  } else {
    // Partial approval / Line-item rejection (Option 1)
    order.items.forEach((item) => {
      const pid = item.productId.toString();
      if (rejectedItemIds.includes(pid)) {
        item.reviewStatus = "rejected";
        item.rejectionReason = reason || "Item prescription rejected by pharmacist.";
      } else {
        item.reviewStatus = "approved";
      }
    });

    const approvedItems = order.items.filter((i) => i.reviewStatus === "approved");

    if (approvedItems.length === 0) {
      // Everything was rejected
      order.verification = {
        status: "rejected",
        reviewedBy: reviewer.email || reviewer.id,
        reviewedAt: new Date(),
        reason: reason || "All items rejected.",
        assignedTo: order.verification?.assignedTo || null,
        assignedAt: order.verification?.assignedAt || null,
      };
      order.status = "rejected";
    } else {
      // Normal items or approved items remain: recalculate invoice total
      const newSubtotal = round2(
        approvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      );
      const deliveryCharge = order.totals?.deliveryCharge || 0;
      const platformFee = order.totals?.platformFee || 10;
      const newTotal = round2(newSubtotal + deliveryCharge + platformFee);

      order.totals.subtotal = newSubtotal;
      order.totals.total = newTotal;

      order.verification = {
        status: "partially_approved",
        reviewedBy: reviewer.email || reviewer.id,
        reviewedAt: new Date(),
        reason: reason || "Rejected prescription items removed. Remaining items approved.",
        assignedTo: order.verification?.assignedTo || null,
        assignedAt: order.verification?.assignedAt || null,
      };
      order.status = "pending"; // Valid items continue to dispatch!
    }
  }

  await order.save();

  // Write to Activity Logs
  logActivity({
    actor: reviewer,
    action: `prescription_review_${decision}`,
    entityType: "order",
    entityId: order._id,
    before: { verification: beforeVerification, status: beforeStatus },
    after: { verification: order.verification, status: order.status, totals: order.totals },
  });

  return order;
};

module.exports = {
  priceInstantOrder,
  reviewNarcoticsOrder,
};
