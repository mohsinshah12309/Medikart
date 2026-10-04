const mongoose = require("mongoose");
const XLSX = require("xlsx");
const Order = require("./order.model");

/**
 * Order Export Service (SRP)
 * Encapsulates Excel spreadsheet generation and business formatting for orders.
 */

/**
 * Export orders to Excel with date filtering and role-based pharmacy scoping.
 */
const exportOrdersToExcel = async (
  {
    type,
    status,
    search,
    startDate,
    endDate,
    pharmacyId,
    paymentMethod,
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

  if (cleanTerm) {
    const searchConditions = [
      { orderCode: { $regex: cleanTerm, $options: "i" } },
      { "customer.name": { $regex: cleanTerm, $options: "i" } },
      { "customer.email": { $regex: cleanTerm, $options: "i" } },
      { "customer.phone": { $regex: cleanTerm, $options: "i" } },
      { "customer.city": { $regex: cleanTerm, $options: "i" } },
    ];
    if (isObjectId) {
      searchConditions.unshift({ _id: new mongoose.Types.ObjectId(cleanTerm) });
    }
    query.$or = searchConditions;
  }

  // Date Filtering (PKT UTC+5 timezone aware)
  if (startDate || endDate) {
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

  const orders = await Order.find(query)
    .populate("assignedPharmacyId", "name code phone address city medikartPercentage")
    .sort({ createdAt: -1 });

  // Format orders into Excel rows
  const rows = orders.map((order) => {
    // Format PKT Date
    const pktDate = order.createdAt
      ? new Date(order.createdAt.getTime() + 5 * 60 * 60 * 1000)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19)
      : "N/A";

    const itemsSummary = (order.items || [])
      .map((item) => `${item.name} (x${item.quantity} @ Rs.${item.price})`)
      .join("; ");

    const pharmacy = order.assignedPharmacyId;
    const pharmacyName = pharmacy
      ? `${pharmacy.name}${pharmacy.code ? ` (${pharmacy.code})` : ""}`
      : "Unassigned";

    const subtotal = order.totals?.subtotal || 0;
    const platformFee = order.totals?.platformFee ?? 10;
    const deliveryCharge = order.totals?.deliveryCharge || 0;
    const total = order.totals?.total || 0;

    // Commission calculation
    let commission = platformFee;
    if (pharmacy?.medikartPercentage) {
      commission += (subtotal * pharmacy.medikartPercentage) / 100;
    }
    commission = Math.round(commission * 100) / 100;

    const pharmacyPayout = Math.max(0, Math.round((subtotal - (commission - platformFee)) * 100) / 100);

    return {
      "Order Code": order.orderCode || String(order._id),
      "Date & Time (PKT)": pktDate,
      "Order Type": (order.type || "standard").toUpperCase(),
      "Fulfillment Status": (order.status || "pending").toUpperCase(),
      "Payment Method": order.paymentMethod === "cod" ? "Cash on Delivery" : "Habib Metro Card",
      "Payment Status": (order.paymentState || "pending").toUpperCase(),
      "Customer Name": order.customer?.name || "N/A",
      "Customer Phone": order.customer?.phone || "N/A",
      "Customer Email": order.customer?.email || "N/A",
      "Delivery City": order.customer?.city || "N/A",
      "Delivery Address": order.customer?.address || "N/A",
      "Total Items": (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0),
      "Items Details": itemsSummary || "No items listed / Instant prescription",
      "Subtotal (PKR)": subtotal,
      "Delivery Charge (PKR)": deliveryCharge,
      "Platform Fee (PKR)": platformFee,
      "Total Amount (PKR)": total,
      "Medikart Commission (PKR)": commission,
      "Pharmacy Payout (PKR)": pharmacyPayout,
      "Assigned Pharmacy": pharmacyName,
      "Cancellation Reason": order.cancellation?.reason || "N/A",
      "Prescription Status": order.verification?.status
        ? order.verification.status.toUpperCase()
        : "N/A",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Notice": "No orders found for the selected criteria" }]);

  // Column width definitions
  worksheet["!cols"] = [
    { wch: 16 }, // Order Code
    { wch: 20 }, // Date & Time (PKT)
    { wch: 14 }, // Order Type
    { wch: 18 }, // Fulfillment Status
    { wch: 18 }, // Payment Method
    { wch: 15 }, // Payment Status
    { wch: 22 }, // Customer Name
    { wch: 16 }, // Customer Phone
    { wch: 26 }, // Customer Email
    { wch: 16 }, // Delivery City
    { wch: 35 }, // Delivery Address
    { wch: 12 }, // Total Items
    { wch: 45 }, // Items Details
    { wch: 15 }, // Subtotal
    { wch: 18 }, // Delivery Charge
    { wch: 16 }, // Platform Fee
    { wch: 18 }, // Total Amount
    { wch: 24 }, // Medikart Commission
    { wch: 20 }, // Pharmacy Payout
    { wch: 25 }, // Assigned Pharmacy
    { wch: 30 }, // Cancellation Reason
    { wch: 18 }, // Prescription Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Medikart Orders");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return { buffer, count: orders.length, startDate, endDate };
};

module.exports = {
  exportOrdersToExcel,
};
