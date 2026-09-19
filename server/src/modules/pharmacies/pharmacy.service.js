const mongoose = require("mongoose");
const Pharmacy = require("./pharmacy.model");
const City = require("../cities/city.model");
const Order = require("../orders/order.model");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../../utils/errors");
const { encrypt, decrypt } = require("../../services/encryption.service");
const { logActivity } = require("../activity-logs/activityLog.service");

const createPharmacy = async (data, adminUser = null) => {
  if (adminUser && adminUser.role !== "super_admin") {
    throw new ForbiddenError("Access denied: Only Super Admin can create new pharmacies");
  }

  const pharmacyData = { ...data };
  if (pharmacyData.code) pharmacyData.code = pharmacyData.code.toUpperCase().trim();

  // Secure AES-256-GCM encryption of bank account number
  if (pharmacyData.accountNumber !== undefined) {
    const rawAcct = String(pharmacyData.accountNumber || "").replace(/[\s-]/g, "").trim();
    if (rawAcct) {
      pharmacyData.accountNumberEncrypted = encrypt(rawAcct);
      pharmacyData.accountNumberLast4 = rawAcct.slice(-4);
    } else {
      pharmacyData.accountNumberEncrypted = null;
      pharmacyData.accountNumberLast4 = null;
    }
    delete pharmacyData.accountNumber; // Never store raw plaintext
  }

  const pharmacy = new Pharmacy(pharmacyData);
  await pharmacy.save();
  return pharmacy;
};

const getPharmacies = async ({ active, city } = {}, adminUser = null) => {
  const query = {};

  if (adminUser && adminUser.role !== "super_admin") {
    const assignedId = adminUser.assignedPharmacyId
      ? (adminUser.assignedPharmacyId._id ? adminUser.assignedPharmacyId._id.toString() : adminUser.assignedPharmacyId.toString())
      : null;
    if (assignedId) {
      query._id = new mongoose.Types.ObjectId(assignedId);
    }
  }

  if (active !== undefined) query.active = active;
  if (city) {
    if (mongoose.Types.ObjectId.isValid(city)) {
      query.cityIds = new mongoose.Types.ObjectId(city);
    } else {
      query.cityIds = city;
    }
  }

  return Pharmacy.find(query)
    .populate("cityIds", "name deliveryCharge")
    .sort({ name: 1 });
};

const getPharmacyById = async (id, adminUser = null) => {
  if (adminUser && adminUser.role !== "super_admin") {
    const assignedId = adminUser.assignedPharmacyId
      ? (adminUser.assignedPharmacyId._id ? adminUser.assignedPharmacyId._id.toString() : adminUser.assignedPharmacyId.toString())
      : null;
    if (assignedId && assignedId !== id.toString()) {
      throw new ForbiddenError("Access denied: You can only view details for your assigned pharmacy branch");
    }
  }

  const pharmacy = await Pharmacy.findById(id).populate("cityIds", "name deliveryCharge");
  if (!pharmacy) throw new NotFoundError("Pharmacy not found");
  return pharmacy;
};

const updatePharmacy = async (id, updateData, adminUser = null) => {
  const payload = { ...updateData };

  if (adminUser && adminUser.role !== "super_admin") {
    const assignedId = adminUser.assignedPharmacyId
      ? (adminUser.assignedPharmacyId._id ? adminUser.assignedPharmacyId._id.toString() : adminUser.assignedPharmacyId.toString())
      : null;
    if (assignedId && assignedId !== id.toString()) {
      throw new ForbiddenError("Access denied: You can only update your assigned pharmacy branch");
    }
    // Branch staff cannot modify platform-level fields
    if (assignedId) {
      delete payload.medikartPercentage;
      delete payload.code;
      delete payload.active;
    }
  }

  if (payload.code) payload.code = payload.code.toUpperCase().trim();

  // Secure AES-256-GCM encryption of bank account number on update
  if (payload.accountNumber !== undefined) {
    const rawAcct = String(payload.accountNumber || "").replace(/[\s-]/g, "").trim();
    if (rawAcct) {
      payload.accountNumberEncrypted = encrypt(rawAcct);
      payload.accountNumberLast4 = rawAcct.slice(-4);
    } else {
      payload.accountNumberEncrypted = null;
      payload.accountNumberLast4 = null;
    }
    delete payload.accountNumber; // Never store raw plaintext
  }

  const pharmacy = await Pharmacy.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  ).populate("cityIds", "name deliveryCharge");

  if (!pharmacy) throw new NotFoundError("Pharmacy not found");
  return pharmacy;
};

const revealAccountNumber = async (id, adminUser) => {
  if (!adminUser || adminUser.role !== "super_admin") {
    throw new ForbiddenError("Only Super Admin can reveal sensitive pharmacy bank account details");
  }

  const pharmacy = await Pharmacy.findById(id).select("+accountNumberEncrypted");
  if (!pharmacy) throw new NotFoundError("Pharmacy not found");

  let decryptedAccountNumber = null;
  if (pharmacy.accountNumberEncrypted) {
    decryptedAccountNumber = decrypt(pharmacy.accountNumberEncrypted);
  }

  // Log audit access
  await logActivity({
    actor: adminUser,
    action: "pharmacy_account_revealed",
    entityType: "pharmacy",
    entityId: pharmacy._id,
    before: null,
    after: {
      pharmacyName: pharmacy.name,
      pharmacyCode: pharmacy.code,
      hasAccountNumber: !!decryptedAccountNumber,
      revealedAt: new Date(),
    },
  });

  return {
    pharmacyId: pharmacy._id,
    name: pharmacy.name,
    accountTitle: pharmacy.accountTitle || "",
    accountNumber: decryptedAccountNumber,
    accountNumberLast4: pharmacy.accountNumberLast4,
  };
};

const deletePharmacy = async (id, adminUser = null) => {
  if (adminUser && adminUser.role !== "super_admin") {
    throw new ForbiddenError("Access denied: Only Super Admin can delete pharmacies");
  }

  const pharmacy = await Pharmacy.findByIdAndDelete(id);
  if (!pharmacy) throw new NotFoundError("Pharmacy not found");
  return pharmacy;
};

/**
 * Get fulfillment and revenue reports for pharmacies
 * Supports date range, specific pharmacy, and city filtering
 */
const getPharmacyReports = async ({ pharmacyId, city, startDate, endDate } = {}, adminUser = null) => {
  if (adminUser && adminUser.role !== "super_admin") {
    const assignedId = adminUser.assignedPharmacyId
      ? (adminUser.assignedPharmacyId._id ? adminUser.assignedPharmacyId._id.toString() : adminUser.assignedPharmacyId.toString())
      : null;
    if (!assignedId) {
      return {
        summary: {
          totalAssignedOrders: 0,
          totalRevenueSum: 0,
          totalMedikartShare: 0,
          totalDelivered: 0,
          totalCancelled: 0,
        },
        reports: [],
      };
    }
    pharmacyId = assignedId;
  }

  const match = {};

  if (pharmacyId) {
    if (mongoose.Types.ObjectId.isValid(pharmacyId)) {
      match.assignedPharmacyId = new mongoose.Types.ObjectId(pharmacyId);
    }
  } else {
    // If no specific pharmacy, only match orders that have an assigned pharmacy
    match.assignedPharmacyId = { $ne: null, $exists: true };
  }

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) {
      match.createdAt.$gte = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
        ? new Date(`${startDate}T00:00:00+05:00`)
        : new Date(startDate);
    }
    if (endDate) {
      match.createdAt.$lte = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
        ? new Date(`${endDate}T23:59:59.999+05:00`)
        : new Date(endDate);
    }
  }

  const pharmacyQuery = {};
  if (pharmacyId && mongoose.Types.ObjectId.isValid(pharmacyId)) {
    pharmacyQuery._id = new mongoose.Types.ObjectId(pharmacyId);
  }
  if (city && mongoose.Types.ObjectId.isValid(city)) {
    pharmacyQuery.cityIds = new mongoose.Types.ObjectId(city);
  }

  const [pharmacies, reportData] = await Promise.all([
    Pharmacy.find(pharmacyQuery).sort({ name: 1 }),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$assignedPharmacyId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totals.total" },
          deliveredRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$totals.total", 0],
            },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["pending", "packed", "shipped", "pending_verification"],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const reportMap = new Map();
  reportData.forEach((r) => {
    if (r._id) {
      reportMap.set(r._id.toString(), r);
    }
  });

  const detailedReports = pharmacies.map((ph) => {
    const stats = reportMap.get(ph._id.toString()) || {
      totalOrders: 0,
      totalRevenue: 0,
      deliveredRevenue: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
    };
    const deliveredRevenue = stats.deliveredRevenue || (stats.deliveredOrders > 0 ? stats.totalRevenue : 0);
    const medikartPercentage = Number(ph.medikartPercentage) || 0;
    const medikartRevenueShare = Math.round((deliveredRevenue * medikartPercentage) / 100);

    return {
      pharmacyId: ph._id,
      name: ph.name,
      code: ph.code,
      phone: ph.phone,
      address: ph.address,
      active: ph.active,
      medikartPercentage,
      medikartRevenueShare,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      deliveredRevenue,
      deliveredOrders: stats.deliveredOrders,
      cancelledOrders: stats.cancelledOrders,
      pendingOrders: stats.pendingOrders,
      averageOrderValue:
        stats.totalOrders > 0
          ? Math.round(stats.totalRevenue / stats.totalOrders)
          : 0,
    };
  });

  const summary = detailedReports.reduce(
    (acc, curr) => ({
      totalAssignedOrders: acc.totalAssignedOrders + curr.totalOrders,
      totalRevenueSum: acc.totalRevenueSum + curr.totalRevenue,
      totalMedikartShare: acc.totalMedikartShare + curr.medikartRevenueShare,
      totalDelivered: acc.totalDelivered + curr.deliveredOrders,
      totalCancelled: acc.totalCancelled + curr.cancelledOrders,
    }),
    {
      totalAssignedOrders: 0,
      totalRevenueSum: 0,
      totalMedikartShare: 0,
      totalDelivered: 0,
      totalCancelled: 0,
    }
  );

  return {
    summary,
    reports: detailedReports,
  };
};

module.exports = {
  createPharmacy,
  getPharmacies,
  getPharmacyById,
  updatePharmacy,
  deletePharmacy,
  revealAccountNumber,
  getPharmacyReports,
};
