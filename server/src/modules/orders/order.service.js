/**
 * Order service — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Core service facade adhering to Single Responsibility Principle (SRP):
 * - Order placement dispatched to type-specific handlers
 * - Order querying & statistics aggregation
 * - Sub-modules handle export, pricing, fulfillment, and notifications
 */

const mongoose = require("mongoose");
const { placeStandardOrder } = require("./standardOrder.handler");
const { placeInstantOrder } = require("./instantOrder.handler");
const { placeNarcoticsOrder } = require("./narcoticsOrder.handler");
const Order = require("./order.model");
const CommissionPayment = require("../commissions/commissionPayment.model");
const CommissionBalance = require("../commissions/commissionBalance.model");
const { exportOrdersToExcel } = require("./orderExport.service");
const { priceInstantOrder, reviewNarcoticsOrder } = require("./orderPricing.service");
const {
  cancelOrder,
  refundOrder,
  updateOrderStatus,
  assignPharmacy,
} = require("./orderFulfillment.service");
const {
  sendOrderCancellationEmail,
  sendInstantOrderPricedEmail,
  sendOrderDeliveredEmail,
} = require("./orderNotification.service");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../../utils/errors");

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
const getOrders = async (
  {
    type,
    status,
    search,
    startDate,
    endDate,
    pharmacyId,
    paymentMethod,
    page = 1,
    limit = 20,
  } = {},
  admin = null
) => {
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  if (paymentMethod) {
    const pm = paymentMethod.toLowerCase().trim();
    if (pm === "cc" || pm === "card" || pm === "credit_card" || pm === "debit_card") {
      query.paymentMethod = "card";
    } else if (pm === "cod" || pm === "cash") {
      query.paymentMethod = "cod";
    } else {
      query.paymentMethod = pm;
    }
  }

  // Enforce role-based pharmacy scoping
  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    query.assignedPharmacyId = new mongoose.Types.ObjectId(admin.assignedPharmacyId);
  } else if (pharmacyId) {
    if (pharmacyId === "assigned") {
      query.assignedPharmacyId = { $exists: true, $ne: null };
    } else if (pharmacyId === "unassigned") {
      query.$or = [
        { assignedPharmacyId: { $exists: false } },
        { assignedPharmacyId: null },
      ];
    } else if (mongoose.Types.ObjectId.isValid(pharmacyId)) {
      query.assignedPharmacyId = new mongoose.Types.ObjectId(pharmacyId);
    }
  }

  const rawTerm = search ? search.trim() : "";
  const cleanTerm = rawTerm.replace(/^#/, "").trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(cleanTerm) && cleanTerm.length === 24;
  const isOrderCode = cleanTerm.toUpperCase().startsWith("MK-") || /^[A-Z0-9]{4,8}$/i.test(cleanTerm);

  if (cleanTerm) {
    const escapedTerm = cleanTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const searchConditions = [
      { orderCode: { $regex: escapedTerm, $options: "i" } },
      { "customer.name": { $regex: escapedTerm, $options: "i" } },
      { "customer.email": { $regex: escapedTerm, $options: "i" } },
      { "customer.phone": { $regex: escapedTerm, $options: "i" } },
      { "customer.city": { $regex: escapedTerm, $options: "i" } },
    ];
    if (isObjectId) {
      searchConditions.unshift({ _id: new mongoose.Types.ObjectId(cleanTerm) });
    }
    query.$or = searchConditions;
  }

  // Date Filtering:
  // If user searched for a specific Order ID or Order Code, bypass date restrictions to find the exact order across all history.
  // Otherwise parse PKT midnight (+05:00) so UTC+5 orders placed today match accurately.
  if ((startDate || endDate) && !isObjectId && !isOrderCode && !cleanTerm) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
        ? new Date(`${startDate}T00:00:00+05:00`)
        : new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
        ? new Date(`${endDate}T23:59:59.999+05:00`)
        : new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("assignedPharmacyId", "name code phone address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
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
const getOrderStats = async (query = {}, admin = null) => {
  // Support both (query, admin) and (admin) invocation signatures
  if (query && (query.role || query._id) && !admin) {
    admin = query;
    query = {};
  }
  const { paymentMethod, pharmacyId } = query || {};

  // PKT is UTC+5. Midnight PKT = yesterday 19:00 UTC (i.e. now − ms_since_midnight_PKT).
  const now = new Date();
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowPKT = new Date(now.getTime() + PKT_OFFSET_MS);
  const midnightPKT = new Date(
    Date.UTC(nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), nowPKT.getUTCDate())
  );
  const todayStartUTC = new Date(midnightPKT.getTime() - PKT_OFFSET_MS);

  // Pharmacy matching (role-scoped subadmin or query-filtered super admin)
  let pharmacyMatch = [];
  let targetPharmacyId = null;

  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    targetPharmacyId = admin.assignedPharmacyId;
    pharmacyMatch = [{ $match: { assignedPharmacyId: new mongoose.Types.ObjectId(admin.assignedPharmacyId) } }];
  } else if (pharmacyId) {
    if (pharmacyId === "assigned") {
      pharmacyMatch = [{ $match: { assignedPharmacyId: { $exists: true, $ne: null } } }];
    } else if (pharmacyId === "unassigned") {
      pharmacyMatch = [{ $match: { $or: [{ assignedPharmacyId: { $exists: false } }, { assignedPharmacyId: null }] } }];
    } else if (mongoose.Types.ObjectId.isValid(pharmacyId)) {
      targetPharmacyId = pharmacyId;
      pharmacyMatch = [{ $match: { assignedPharmacyId: new mongoose.Types.ObjectId(pharmacyId) } }];
    }
  }

  // Optional Payment Method filtering for top-level stats
  let paymentMatch = [];
  if (paymentMethod) {
    const pm = paymentMethod.toLowerCase().trim();
    const normalizedPm = (pm === "cc" || pm === "card" || pm === "credit_card" || pm === "debit_card")
      ? "card"
      : (pm === "cod" || pm === "cash" ? "cod" : pm);
    paymentMatch = [{ $match: { paymentMethod: normalizedPm } }];
  }

  const filteredMatch = [...pharmacyMatch, ...paymentMatch];

  const [result] = await Order.aggregate([
    {
      $facet: {
        // Filtered overall metrics
        todayOrders: [
          ...filteredMatch,
          { $match: { createdAt: { $gte: todayStartUTC } } },
          { $count: "count" },
        ],
        totalOrders: [...filteredMatch, { $count: "count" }],
        narcoticsPending: [
          ...filteredMatch,
          { $match: { status: "pending_verification" } },
          { $count: "count" },
        ],
        pricingPending: [
          ...filteredMatch,
          { $match: { status: "awaiting-pharmacist-pricing" } },
          { $count: "count" },
        ],
        totalSale: [
          ...filteredMatch,
          { $match: { status: { $nin: ["cancelled", "rejected"] } } },
          { $group: { _id: null, total: { $sum: "$totals.total" } } },
        ],
        todaySale: [
          ...filteredMatch,
          { $match: { createdAt: { $gte: todayStartUTC }, status: { $nin: ["cancelled", "rejected"] } } },
          { $group: { _id: null, total: { $sum: "$totals.total" } } },
        ],

        // Dedicated COD (Cash on Delivery) breakdown
        totalCodOrders: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "cod" } },
          { $count: "count" },
        ],
        todayCodOrders: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "cod", createdAt: { $gte: todayStartUTC } } },
          { $count: "count" },
        ],
        totalCodSale: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "cod", status: { $nin: ["cancelled", "rejected"] } } },
          { $group: { _id: null, total: { $sum: "$totals.total" } } },
        ],
        todayCodSale: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "cod", createdAt: { $gte: todayStartUTC }, status: { $nin: ["cancelled", "rejected"] } } },
          { $group: { _id: null, total: { $sum: "$totals.total" } } },
        ],

        // Dedicated CC (Credit/Debit Card) breakdown
        totalCardOrders: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "card" } },
          { $count: "count" },
        ],
        todayCardOrders: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "card", createdAt: { $gte: todayStartUTC } } },
          { $count: "count" },
        ],
        totalCardSale: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "card", status: { $nin: ["cancelled", "rejected"] } } },
          { $group: { _id: null, total: { $sum: "$totals.total" } } },
        ],
        todayCardSale: [
          ...pharmacyMatch,
          { $match: { paymentMethod: "card", createdAt: { $gte: todayStartUTC }, status: { $nin: ["cancelled", "rejected"] } } },
          { $group: { _id: null, total: { $sum: "$totals.total" } } },
        ],

        // Medikart Commission
        medikartCommission: [
          ...filteredMatch,
          { $match: { status: { $nin: ["cancelled", "rejected"] } } },
          {
            $lookup: {
              from: "pharmacies",
              localField: "assignedPharmacyId",
              foreignField: "_id",
              as: "pharmacy",
            },
          },
          { $unwind: { path: "$pharmacy", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              commissionAmount: {
                $multiply: [
                  { $ifNull: ["$totals.total", 0] },
                  { $divide: [{ $ifNull: ["$pharmacy.medikartPercentage", 5] }, 100] },
                ],
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
        ],
      },
    },
  ]);

  const commissionPaidQuery = {
    status: "verified",
    ...(targetPharmacyId ? { pharmacyId: new mongoose.Types.ObjectId(targetPharmacyId) } : {}),
  };

  const balanceMatch = targetPharmacyId ? { pharmacyId: new mongoose.Types.ObjectId(targetPharmacyId) } : {};

  const [balanceAgg, paidAgg] = await Promise.all([
    CommissionBalance.aggregate([
      { $match: balanceMatch },
      {
        $group: {
          _id: null,
          totalAccrued: {
            $sum: { $add: ["$outstandingBalance", "$totalPaidVerified"] },
          },
          totalPaid: {
            $sum: "$totalPaidVerified",
          },
        },
      },
    ]),
    CommissionPayment.aggregate([
      { $match: commissionPaidQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const balanceAccrued = balanceAgg[0]?.totalAccrued;
  const orderAccrued = result.medikartCommission[0]?.total ?? 0;
  const computedCommission =
    balanceAccrued !== undefined && balanceAccrued > 0
      ? Math.max(balanceAccrued, orderAccrued)
      : orderAccrued;

  const balancePaid = balanceAgg[0]?.totalPaid;
  const paymentsPaid = paidAgg[0]?.total ?? 0;
  const computedPaid =
    balancePaid !== undefined && balancePaid > 0
      ? Math.max(balancePaid, paymentsPaid)
      : paymentsPaid;

  const totalCodSale = Math.round((result.totalCodSale[0]?.total ?? 0) * 100) / 100;
  const todayCodSale = Math.round((result.todayCodSale[0]?.total ?? 0) * 100) / 100;
  const totalCodOrders = result.totalCodOrders[0]?.count ?? 0;
  const todayCodOrders = result.todayCodOrders[0]?.count ?? 0;

  const totalCardSale = Math.round((result.totalCardSale[0]?.total ?? 0) * 100) / 100;
  const todayCardSale = Math.round((result.todayCardSale[0]?.total ?? 0) * 100) / 100;
  const totalCardOrders = result.totalCardOrders[0]?.count ?? 0;
  const todayCardOrders = result.todayCardOrders[0]?.count ?? 0;

  return {
    todayOrders: result.todayOrders[0]?.count ?? 0,
    totalOrders: result.totalOrders[0]?.count ?? 0,
    narcoticsPending: result.narcoticsPending[0]?.count ?? 0,
    pricingPending: result.pricingPending[0]?.count ?? 0,
    totalSale: Math.round((result.totalSale[0]?.total ?? 0) * 100) / 100,
    todaySale: Math.round((result.todaySale[0]?.total ?? 0) * 100) / 100,
    medikartCommission: Math.round(computedCommission * 100) / 100,
    totalCommissionPaid: Math.round(computedPaid * 100) / 100,
    cod: {
      totalOrders: totalCodOrders,
      todayOrders: todayCodOrders,
      totalSale: totalCodSale,
      todaySale: todayCodSale,
    },
    card: {
      totalOrders: totalCardOrders,
      todayOrders: todayCardOrders,
      totalSale: totalCardSale,
      todaySale: todayCardSale,
    },
    cc: {
      totalOrders: totalCardOrders,
      todayOrders: todayCardOrders,
      totalSale: totalCardSale,
      todaySale: todayCardSale,
    },
  };
};

/**
 * Get a single order by MongoDB ID or orderCode.
 */
const getOrderById = async (orderIdOrCode, admin = null) => {
  const cleanIdOrCode = String(orderIdOrCode || "").replace(/^#/, "").trim();
  let query = {};
  if (mongoose.Types.ObjectId.isValid(cleanIdOrCode) && cleanIdOrCode.length === 24) {
    query = {
      $or: [
        { _id: new mongoose.Types.ObjectId(cleanIdOrCode) },
        { orderCode: cleanIdOrCode },
        { orderCode: cleanIdOrCode.toUpperCase() },
      ],
    };
  } else {
    query = {
      $or: [
        { orderCode: cleanIdOrCode },
        { orderCode: cleanIdOrCode.toUpperCase() },
        { orderCode: { $regex: new RegExp(`^${cleanIdOrCode}$`, "i") } },
      ],
    };
  }
  const order = await Order.findOne(query).populate("assignedPharmacyId", "name code phone address city");
  if (!order) throw new NotFoundError("Order not found");

  if (admin && admin.role !== "super_admin" && admin.assignedPharmacyId) {
    const assignedId = order.assignedPharmacyId?._id
      ? order.assignedPharmacyId._id.toString()
      : order.assignedPharmacyId?.toString();
    if (assignedId !== admin.assignedPharmacyId.toString()) {
      throw new ForbiddenError("Access denied: You can only view orders assigned to your pharmacy.");
    }
  }

  return order;
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderStats,
  getOrderById,
  exportOrdersToExcel,
  priceInstantOrder,
  reviewNarcoticsOrder,
  cancelOrder,
  refundOrder,
  updateOrderStatus,
  assignPharmacy,
  sendOrderCancellationEmail,
  sendInstantOrderPricedEmail,
  sendOrderDeliveredEmail,
};
