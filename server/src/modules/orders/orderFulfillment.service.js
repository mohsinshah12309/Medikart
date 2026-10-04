const mongoose = require("mongoose");
const Order = require("./order.model");
const { logActivity } = require("../activity-logs/activityLog.service");
const {
  sendOrderCancellationEmail,
  sendOrderDeliveredEmail,
} = require("./orderNotification.service");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../../utils/errors");

/**
 * Order Fulfillment & Lifecycle Service (SRP)
 * Encapsulates order status transitions, pharmacy assignment, cancellations, and manual refunds.
 */

/**
 * Admin cancels an order (Phase 17).
 */
const cancelOrder = async (orderId, { reason, admin }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    const assignedId = order.assignedPharmacyId?.toString();
    if (assignedId !== admin.assignedPharmacyId.toString()) {
      throw new ForbiddenError("Access denied: You can only cancel orders assigned to your pharmacy.");
    }
  }

  const currentStatus = order.status ? order.status.toLowerCase() : "";
  const isLocked = currentStatus === "delivered" || currentStatus === "cancelled";

  if (isLocked && admin?.role !== "super_admin") {
    throw new ForbiddenError(
      `Cannot cancel order in "${order.status}" status. Delivered and cancelled orders are locked and can only be modified by Super Admin.`
    );
  }

  const allowedStatuses = [
    "pending",
    "packed",
    "pending_verification",
    "awaiting-pharmacist-pricing",
  ];

  if (admin?.role === "super_admin") {
    allowedStatuses.push("delivered", "shipped");
  }

  if (!allowedStatuses.includes(currentStatus)) {
    throw new BadRequestError(
      `Cannot cancel order in "${order.status}" status. Only Pending or Packed orders can be cancelled (or orders awaiting verification/pricing).`
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
 * Admin updates order status (pending, packed, shipped, delivered/completed, cancelled).
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

  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    const assignedId = order.assignedPharmacyId?.toString();
    if (assignedId !== admin.assignedPharmacyId.toString()) {
      throw new ForbiddenError("Access denied: You can only update orders assigned to your pharmacy.");
    }
  }

  // Terminal Lock Check: If order is delivered or cancelled, only Super Admin can modify it
  const isLocked = order.status === "delivered" || order.status === "cancelled";
  if (isLocked && admin?.role !== "super_admin") {
    throw new ForbiddenError(
      `Order is locked in '${order.status}' status. Only Super Admin has permission to modify delivered or cancelled orders.`
    );
  }

  if (order.status === "cancelled" && admin?.role !== "super_admin") {
    throw new BadRequestError("Cannot change status of a cancelled order.");
  }

  if (order.status === "rejected" && admin?.role !== "super_admin") {
    throw new BadRequestError("Cannot change status of a rejected prescription order.");
  }

  if (order.status === "awaiting-pharmacist-pricing" && targetStatus !== "cancelled") {
    throw new BadRequestError("Instant order must be priced before updating fulfillment status.");
  }

  if (
    order.status === "pending_verification" &&
    (targetStatus === "packed" || targetStatus === "shipped" || targetStatus === "delivered")
  ) {
    throw new BadRequestError(
      "Narcotics order prescription must be reviewed and approved before fulfilling the order."
    );
  }

  const previousStatus = order.status;
  order.status = targetStatus;

  // If delivered and COD, mark paymentState as paid
  if (targetStatus === "delivered" && order.paymentMethod === "cod" && order.paymentState !== "paid") {
    order.paymentState = "paid";
  }

  await order.save();

  // If delivered, send delivery confirmation email to customer (non-blocking)
  if (targetStatus === "delivered" && previousStatus !== "delivered") {
    sendOrderDeliveredEmail(order).catch((err) => {
      console.error(
        `[orders] Delivery notification email failed for order ${order._id}: ${err.message}`
      );
    });
  }

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

/**
 * Assign or reassign an order to a fulfillment pharmacy
 */
const assignPharmacy = async (orderId, pharmacyId, admin) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    throw new ForbiddenError("Access denied: Only Super Admins can assign or reassign pharmacies.");
  }

  if ((order.status === "delivered" || order.status === "cancelled") && admin?.role !== "super_admin") {
    throw new ForbiddenError("Cannot reassign pharmacy branch on a locked (delivered or cancelled) order.");
  }

  const previousPharmacy = order.assignedPharmacyId;
  order.assignedPharmacyId = pharmacyId ? new mongoose.Types.ObjectId(pharmacyId) : null;
  await order.save();

  await logActivity({
    actor: {
      id: admin?.id || admin?._id || admin,
      email: admin?.email,
      role: admin?.role,
    },
    action: "order_pharmacy_assigned",
    entityType: "order",
    entityId: order._id,
    before: { assignedPharmacyId: previousPharmacy },
    after: { assignedPharmacyId: order.assignedPharmacyId },
  });

  return Order.findById(orderId).populate("assignedPharmacyId", "name code phone address");
};

module.exports = {
  cancelOrder,
  refundOrder,
  updateOrderStatus,
  assignPharmacy,
};
