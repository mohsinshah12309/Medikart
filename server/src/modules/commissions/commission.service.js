/**
 * Commission Service
 *
 * Handles Medikart commission tracking, payment proof submission,
 * and Super Admin verification workflow with atomic balance reconciliation.
 */

const mongoose = require("mongoose");
const CommissionBalance = require("./commissionBalance.model");
const CommissionPayment = require("./commissionPayment.model");
const Pharmacy = require("../pharmacies/pharmacy.model");
const Order = require("../orders/order.model");
const { logActivity } = require("../activity-logs/activityLog.service");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../../utils/errors");

/**
 * Check if the admin user is allowed to access/mutate records for the specified pharmacy.
 * (Super Admin can access all; scoped Subadmins can only access their assigned pharmacy).
 */
function assertPharmacyAccess(adminUser, pharmacyId) {
  if (!adminUser) {
    throw new ForbiddenError("Authentication required");
  }

  if (adminUser.role === "super_admin") {
    return true;
  }

  // Object-level scoping check
  if (
    adminUser.assignedPharmacyId &&
    adminUser.assignedPharmacyId.toString() !== pharmacyId.toString()
  ) {
    throw new ForbiddenError(
      "Access denied: You are only authorized to manage records for your assigned pharmacy"
    );
  }

  return true;
}

/**
 * Get or initialize current outstanding balance and summary for a pharmacy.
 */
const getPharmacyBalance = async (pharmacyId, adminUser) => {
  assertPharmacyAccess(adminUser, pharmacyId);

  const pharmacy = await Pharmacy.findById(pharmacyId).select(
    "name code medikartPercentage active"
  );
  if (!pharmacy) {
    throw new NotFoundError("Pharmacy not found");
  }

  const pId = new mongoose.Types.ObjectId(pharmacyId);

  // 1. Get or create balance document
  let balanceDoc = await CommissionBalance.findOne({ pharmacyId: pId });
  if (!balanceDoc) {
    balanceDoc = await CommissionBalance.create({
      pharmacyId: pId,
      outstandingBalance: 0,
      totalPaidVerified: 0,
    });
  }

  // 2. Query delivered orders for this pharmacy
  const orderStats = await Order.aggregate([
    {
      $match: {
        assignedPharmacyId: pId,
        status: "delivered",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totals.total" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const deliveredRevenue = orderStats.length > 0 ? (orderStats[0].totalRevenue || 0) : 0;
  const medikartPercentage = Number(pharmacy.medikartPercentage) || 0;
  const accruedFromOrders = Math.round((deliveredRevenue * medikartPercentage) / 100);

  // 3. Query verified payments
  const paymentStats = await CommissionPayment.aggregate([
    {
      $match: {
        pharmacyId: pId,
        status: "verified",
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalPaid = paymentStats.length > 0 ? (paymentStats[0].totalPaid || 0) : (balanceDoc.totalPaidVerified || 0);

  // 4. Calculate total accrued (taking the higher of dynamic order revenue or manually adjusted base)
  const totalAccrued = Math.max(
    accruedFromOrders,
    (balanceDoc.outstandingBalance || 0) + (balanceDoc.totalPaidVerified || 0)
  );

  const outstandingBalance = Math.max(0, totalAccrued - totalPaid);

  // 5. Query last verified payment
  const lastVerifiedPayment = await CommissionPayment.findOne({
    pharmacyId: pId,
    status: "verified",
  }).sort({ verifiedAt: -1, createdAt: -1 });

  const pendingCount = await CommissionPayment.countDocuments({
    pharmacyId: pId,
    status: "pending",
  });

  // Sync back to balanceDoc
  balanceDoc.outstandingBalance = outstandingBalance;
  balanceDoc.totalPaidVerified = totalPaid;
  if (lastVerifiedPayment) {
    balanceDoc.lastPaymentDate = lastVerifiedPayment.paidOnDate || lastVerifiedPayment.verifiedAt;
    balanceDoc.lastVerifiedDate = lastVerifiedPayment.verifiedAt;
  }
  await balanceDoc.save();

  return {
    pharmacyId: pharmacy._id,
    pharmacyName: pharmacy.name,
    pharmacyCode: pharmacy.code,
    medikartPercentage,
    deliveredRevenue,
    totalAccruedCommission: totalAccrued,
    cumulativeAccrued: totalAccrued,
    totalPaidCommission: totalPaid,
    totalPaidVerified: totalPaid,
    outstandingBalance,
    lastPaymentAmount: lastVerifiedPayment ? lastVerifiedPayment.amount : null,
    lastPaymentDate: lastVerifiedPayment ? (lastVerifiedPayment.paidOnDate || lastVerifiedPayment.verifiedAt) : null,
    lastVerifiedDate: lastVerifiedPayment ? lastVerifiedPayment.verifiedAt : null,
    pendingCount,
  };
};

/**
 * List all commission payment records for a pharmacy.
 * (Super Admin can view all pharmacies; Subadmins can view their assigned branch).
 */
const getPharmacyPayments = async (pharmacyId, adminUser) => {
  assertPharmacyAccess(adminUser, pharmacyId);

  const payments = await CommissionPayment.find({ pharmacyId })
    .populate("submittedBy", "name email role")
    .populate("verifiedBy", "name email role")
    .populate("pharmacyId", "name code")
    .sort({ createdAt: -1 });

  return payments;
};

/**
 * Submit a new commission payment proof for a pharmacy.
 */
const submitPayment = async (data, adminUser) => {
  assertPharmacyAccess(adminUser, data.pharmacyId);

  const pharmacy = await Pharmacy.findById(data.pharmacyId);
  if (!pharmacy) {
    throw new NotFoundError("Pharmacy not found");
  }

  if (!data.screenshotUrl) {
    throw new BadRequestError("Payment proof screenshot is required");
  }

  const payment = await CommissionPayment.create({
    pharmacyId: data.pharmacyId,
    amount: Number(data.amount),
    screenshotUrl: data.screenshotUrl,
    periodFrom: new Date(data.periodFrom),
    periodTo: new Date(data.periodTo),
    paidOnDate: new Date(data.paidOnDate),
    notes: data.notes ? String(data.notes).trim() : "",
    status: "pending",
    submittedBy: adminUser.id,
  });

  await logActivity({
    actor: adminUser,
    action: "commission_payment_submitted",
    entityType: "commission_payment",
    entityId: payment._id,
    before: null,
    after: {
      pharmacyId: pharmacy._id,
      pharmacyName: pharmacy.name,
      amount: payment.amount,
      paidOnDate: payment.paidOnDate,
      period: `${data.periodFrom} to ${data.periodTo}`,
    },
  });

  return payment;
};

/**
 * Super Admin verifies a pending commission payment and atomically decrements the outstanding balance.
 */
const verifyPayment = async (paymentId, adminUser) => {
  if (!adminUser || adminUser.role !== "super_admin") {
    throw new ForbiddenError(
      "Only Super Admin has permission to verify commission payments and adjust balances"
    );
  }

  const payment = await CommissionPayment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError("Commission payment record not found");
  }

  if (payment.status === "verified") {
    throw new BadRequestError("This commission payment has already been verified");
  }

  const previousStatus = payment.status;

  // 1. Mark payment as verified
  payment.status = "verified";
  payment.verifiedBy = adminUser.id;
  payment.verifiedAt = new Date();
  payment.rejectionReason = null;
  await payment.save();

  // 2. Atomically decrement outstanding balance
  const balanceDoc = await CommissionBalance.findOneAndUpdate(
    { pharmacyId: payment.pharmacyId },
    {
      $inc: {
        outstandingBalance: -payment.amount,
        totalPaidVerified: payment.amount,
      },
      $set: {
        lastVerifiedDate: new Date(),
        lastPaymentDate: payment.paidOnDate,
      },
    },
    { new: true, upsert: true }
  );

  // Guarantee balance does not stay negative
  if (balanceDoc.outstandingBalance < 0) {
    balanceDoc.outstandingBalance = 0;
    await balanceDoc.save();
  }

  // 3. Log audit entry
  await logActivity({
    actor: adminUser,
    action: "commission_payment_verified",
    entityType: "commission_payment",
    entityId: payment._id,
    before: { status: previousStatus },
    after: {
      status: "verified",
      verifiedAmount: payment.amount,
      newOutstandingBalance: balanceDoc.outstandingBalance,
      verifiedAt: payment.verifiedAt,
    },
  });

  return {
    payment,
    balance: balanceDoc,
  };
};

/**
 * Super Admin rejects a pending commission payment (requires a reason; leaves balance unchanged).
 */
const rejectPayment = async (paymentId, { rejectionReason }, adminUser) => {
  if (!adminUser || adminUser.role !== "super_admin") {
    throw new ForbiddenError(
      "Only Super Admin has permission to reject commission payment submissions"
    );
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new BadRequestError("A rejection reason is required");
  }

  const payment = await CommissionPayment.findById(paymentId);
  if (!payment) {
    throw new NotFoundError("Commission payment record not found");
  }

  if (payment.status === "verified") {
    throw new BadRequestError("Cannot reject an already verified payment");
  }

  const previousStatus = payment.status;

  payment.status = "rejected";
  payment.rejectionReason = rejectionReason.trim();
  payment.verifiedBy = adminUser.id;
  payment.verifiedAt = new Date();
  await payment.save();

  // Log audit entry
  await logActivity({
    actor: adminUser,
    action: "commission_payment_rejected",
    entityType: "commission_payment",
    entityId: payment._id,
    before: { status: previousStatus },
    after: {
      status: "rejected",
      rejectionReason: payment.rejectionReason,
      rejectedAt: payment.verifiedAt,
    },
  });

  return {
    payment,
  };
};

/**
 * Accrues commission onto a pharmacy's balance when an order completes delivery.
 */
const accrueOrderCommission = async (pharmacyId, commissionAmount) => {
  if (!pharmacyId || !commissionAmount || commissionAmount <= 0) return null;

  try {
    const updated = await CommissionBalance.findOneAndUpdate(
      { pharmacyId },
      {
        $inc: { outstandingBalance: Math.round(commissionAmount * 100) / 100 },
      },
      { new: true, upsert: true }
    );
    return updated;
  } catch (err) {
    console.error(`[Commission] Failed to accrue commission for pharmacy ${pharmacyId}:`, err.message);
    return null;
  }
};

/**
 * Super Admin / Admin: Get aggregate Medikart commission paid summary across all pharmacies
 * with date range filtering and breakdown by individual pharmacy branch.
 */
const getCommissionsPaidSummary = async (query = {}, adminUser) => {
  if (!adminUser) {
    throw new ForbiddenError("Authentication required");
  }

  const { startDate, endDate, datePreset, pharmacyId } = query;

  // Build match query for verified payments
  const matchQuery = { status: "verified" };

  // Super Admin vs Subadmin scope
  if (adminUser.role !== "super_admin" && adminUser.assignedPharmacyId) {
    matchQuery.pharmacyId = new mongoose.Types.ObjectId(adminUser.assignedPharmacyId);
  } else if (pharmacyId && mongoose.Types.ObjectId.isValid(pharmacyId)) {
    matchQuery.pharmacyId = new mongoose.Types.ObjectId(pharmacyId);
  }

  // Parse Date Range (considering paidOnDate)
  const now = new Date();
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowPKT = new Date(now.getTime() + PKT_OFFSET_MS);
  const midnightPKT = new Date(
    Date.UTC(nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), nowPKT.getUTCDate())
  );
  const todayStartUTC = new Date(midnightPKT.getTime() - PKT_OFFSET_MS);

  let dateFilterStart = null;
  let dateFilterEnd = null;

  if (datePreset === "today") {
    dateFilterStart = todayStartUTC;
    dateFilterEnd = new Date();
  } else if (datePreset === "yesterday") {
    dateFilterStart = new Date(todayStartUTC.getTime() - 24 * 60 * 60 * 1000);
    dateFilterEnd = todayStartUTC;
  } else if (datePreset === "7days") {
    dateFilterStart = new Date(todayStartUTC.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilterEnd = new Date();
  } else if (datePreset === "month") {
    const monthStartPKT = new Date(
      Date.UTC(nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), 1)
    );
    dateFilterStart = new Date(monthStartPKT.getTime() - PKT_OFFSET_MS);
    dateFilterEnd = new Date();
  } else if (startDate || endDate) {
    if (startDate) {
      dateFilterStart = new Date(startDate);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      dateFilterEnd = endD;
    }
  }

  if (dateFilterStart || dateFilterEnd) {
    matchQuery.paidOnDate = {};
    if (dateFilterStart) matchQuery.paidOnDate.$gte = dateFilterStart;
    if (dateFilterEnd) matchQuery.paidOnDate.$lte = dateFilterEnd;
  }

  // Query verified payments in the date range
  const payments = await CommissionPayment.find(matchQuery)
    .populate("pharmacyId", "name code phone address contactPerson medikartPercentage active")
    .populate("submittedBy", "name email role")
    .populate("verifiedBy", "name email role")
    .sort({ paidOnDate: -1, createdAt: -1 });

  // Compute total paid in this date range
  const totalPaidInPeriod = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalVerifiedCount = payments.length;

  // Query all active pharmacies to build complete per-branch summary
  const pharmacyScope = (adminUser.role !== "super_admin" && adminUser.assignedPharmacyId)
    ? { _id: new mongoose.Types.ObjectId(adminUser.assignedPharmacyId) }
    : (pharmacyId && mongoose.Types.ObjectId.isValid(pharmacyId) ? { _id: new mongoose.Types.ObjectId(pharmacyId) } : {});

  const allPharmacies = await Pharmacy.find(pharmacyScope).select("name code phone address contactPerson medikartPercentage active");
  const balances = await CommissionBalance.find(
    pharmacyScope._id ? { pharmacyId: pharmacyScope._id } : {}
  );
  const balanceMap = {};
  balances.forEach((b) => {
    balanceMap[b.pharmacyId.toString()] = b;
  });

  // Group payments by pharmacy
  const pharmacyPaymentsMap = {};
  payments.forEach((p) => {
    const phId = p.pharmacyId?._id ? p.pharmacyId._id.toString() : p.pharmacyId?.toString();
    if (!phId) return;
    if (!pharmacyPaymentsMap[phId]) {
      pharmacyPaymentsMap[phId] = [];
    }
    pharmacyPaymentsMap[phId].push(p);
  });

  const branchBreakdown = allPharmacies.map((ph) => {
    const phIdStr = ph._id.toString();
    const branchPayments = pharmacyPaymentsMap[phIdStr] || [];
    const totalPaidBranch = branchPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balanceDoc = balanceMap[phIdStr];

    return {
      pharmacyId: ph._id,
      pharmacyName: ph.name,
      pharmacyCode: ph.code,
      phone: ph.phone,
      contactPerson: ph.contactPerson,
      medikartPercentage: ph.medikartPercentage,
      totalPaidInPeriod: totalPaidBranch,
      verifiedPaymentsCount: branchPayments.length,
      outstandingBalance: balanceDoc ? balanceDoc.outstandingBalance : 0,
      allTimePaidVerified: balanceDoc ? balanceDoc.totalPaidVerified : totalPaidBranch,
      lastPaymentDate: branchPayments[0]?.paidOnDate || balanceDoc?.lastPaymentDate || null,
      lastVerifiedDate: branchPayments[0]?.verifiedAt || balanceDoc?.lastVerifiedDate || null,
      payments: branchPayments,
    };
  });

  // Sort breakdown: branches with payments in period first (descending totalPaid), then by name
  branchBreakdown.sort((a, b) => {
    if (b.totalPaidInPeriod !== a.totalPaidInPeriod) {
      return b.totalPaidInPeriod - a.totalPaidInPeriod;
    }
    return a.pharmacyName.localeCompare(b.pharmacyName);
  });

  // Overall all-time paid query
  const allTimeAgg = await CommissionPayment.aggregate([
    {
      $match: {
        status: "verified",
        ...(adminUser.role !== "super_admin" && adminUser.assignedPharmacyId
          ? { pharmacyId: new mongoose.Types.ObjectId(adminUser.assignedPharmacyId) }
          : {}),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const allTimeTotalPaid = allTimeAgg[0]?.total || 0;
  const allTimeVerifiedCount = allTimeAgg[0]?.count || 0;

  return {
    period: {
      datePreset: datePreset || "all",
      startDate: dateFilterStart ? dateFilterStart.toISOString() : null,
      endDate: dateFilterEnd ? dateFilterEnd.toISOString() : null,
    },
    summary: {
      totalPaidInPeriod,
      totalVerifiedCount,
      allTimeTotalPaid,
      allTimeVerifiedCount,
      activePharmaciesCount: branchBreakdown.filter((b) => b.totalPaidInPeriod > 0).length,
      totalPharmaciesCount: allPharmacies.length,
    },
    branches: branchBreakdown,
    recentPayments: payments.slice(0, 50),
  };
};

module.exports = {
  getPharmacyBalance,
  getPharmacyPayments,
  submitPayment,
  verifyPayment,
  rejectPayment,
  accrueOrderCommission,
  getCommissionsPaidSummary,
};
