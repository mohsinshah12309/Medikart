const mongoose = require("mongoose");
const Pharmacy = require("./pharmacy.model");
const Order = require("../orders/order.model");
const { NotFoundError, BadRequestError } = require("../../utils/errors");

const createPharmacy = async (data) => {
  if (data.code) data.code = data.code.toUpperCase().trim();
  const pharmacy = new Pharmacy(data);
  await pharmacy.save();
  return pharmacy;
};

const getPharmacies = async ({ active, city } = {}) => {
  const query = {};
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

const getPharmacyById = async (id) => {
  const pharmacy = await Pharmacy.findById(id).populate("cityIds", "name deliveryCharge");
  if (!pharmacy) throw new NotFoundError("Pharmacy not found");
  return pharmacy;
};

const updatePharmacy = async (id, updateData) => {
  if (updateData.code) updateData.code = updateData.code.toUpperCase().trim();
  const pharmacy = await Pharmacy.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("cityIds", "name deliveryCharge");

  if (!pharmacy) throw new NotFoundError("Pharmacy not found");
  return pharmacy;
};

const deletePharmacy = async (id) => {
  const pharmacy = await Pharmacy.findByIdAndDelete(id);
  if (!pharmacy) throw new NotFoundError("Pharmacy not found");
  return pharmacy;
};

/**
 * Get fulfillment and revenue reports for pharmacies
 * Supports date range, specific pharmacy, and city filtering
 */
const getPharmacyReports = async ({ pharmacyId, city, startDate, endDate } = {}) => {
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
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
    };
    const medikartPercentage = Number(ph.medikartPercentage) || 0;
    const medikartRevenueShare = Math.round(((stats.totalRevenue || 0) * medikartPercentage) / 100);

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
  getPharmacyReports,
};
