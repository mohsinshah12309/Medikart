/**
 * Order controller — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Per rules.md §2: controllers stay thin — read the request, call the service,
 * shape the response. Business logic lives in order.service.js and handlers.
 */

const orderService = require("./order.service");
const {
  prescriptionUpload,
  savePrescriptionToDisk,
} = require("./instantOrder.handler");
const {
  placeInstantOrderSchema,
  placeNarcoticsOrderSchema,
} = require("./order.validation");
const { BadRequestError } = require("../../utils/errors");

/**
 * Helper — safely parse a JSON string field from a multipart form body.
 * Fix 3: returns undefined if the field is absent; throws a 400
 * BadRequestError on malformed JSON (never an unhandled 500).
 */
const parseJsonField = (raw, fieldName) => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new BadRequestError(`Invalid JSON in field '${fieldName}'`);
  }
};

const placeStandardOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder("standard", req.body);
    res.status(201).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const placeNarcoticsOrder = async (req, res, next) => {
  // Use multer middleware to handle prescription file upload
  prescriptionUpload(req, res, async (err) => {
    if (err) return next(err);

    try {
      // Fix 3 — parse the JSON form fields safely (400 on malformed JSON).
      const payload = {
        customer: parseJsonField(req.body.customer, "customer"),
        items: parseJsonField(req.body.items, "items") || [],
        paymentMethod: req.body.paymentMethod,
        otp: parseJsonField(req.body.otp, "otp"),
        prescriptionFilename: null,
      };

      // Fix 3 — validate the parsed JSON before touching the file system.
      placeNarcoticsOrderSchema.parse(payload);

      // Fix 4 — validate the prescription file's TRUE content (magic bytes)
      // and write it to disk only after the payload is known to be valid.
      // A renamed .exe or fake mimetype is rejected here — never stored.
      payload.prescriptionFilename = req.file
        ? await savePrescriptionToDisk(req.file.buffer)
        : null;

      const order = await orderService.placeOrder("narcotics", payload);
      res.status(201).json({
        status: "success",
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  });
};

const reviewNarcoticsOrder = async (req, res, next) => {
  try {
    const order = await orderService.reviewNarcoticsOrder(
      req.params.id,
      req.body.decision,
      req.admin,
    );
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const placeInstantOrder = async (req, res, next) => {
  // Use multer middleware to handle prescription file upload
  prescriptionUpload(req, res, async (err) => {
    if (err) return next(err);

    try {
      // Fix 3 — parse the JSON form fields safely (400 on malformed JSON).
      const payload = {
        customer: parseJsonField(req.body.customer, "customer"),
        paymentMethod: req.body.paymentMethod,
        otp: parseJsonField(req.body.otp, "otp"),
        branchDescription: req.body.branchDescription,
        prescriptionFilename: null,
      };

      // Fix 3 — validate the parsed JSON before touching the file system.
      placeInstantOrderSchema.parse(payload);

      // Fix 4 — validate the prescription file's TRUE content (magic bytes)
      // and write it to disk only after the payload is known to be valid.
      payload.prescriptionFilename = req.file
        ? await savePrescriptionToDisk(req.file.buffer)
        : null;

      const order = await orderService.placeOrder("instant", payload);
      res.status(201).json({
        status: "success",
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  });
};

const getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders(req.query, req.admin);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/orders/stats
 *
 * Returns aggregated dashboard counts for the Overview screen.
 * Phase 23 gap fix — this is a new endpoint, previously missing.
 *
 * Response shape:
 *   { status, data: { todayOrders, totalOrders, narcoticsPending, pricingPending } }
 */
const getOrderStats = async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats(req.query, req.admin);
    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.admin);
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const getPublicOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({
      status: "success",
      data: {
        order: {
          _id: order._id,
          orderCode: order.orderCode,
          type: order.type,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentState: order.paymentState,
          customer: {
            name: order.customer?.name,
            phone: order.customer?.phone,
            city: order.customer?.city,
            address: order.customer?.address,
          },
          items: order.items || [],
          totals: order.totals || {},
          prescriptionUrl: order.prescriptionUrl || null,
          branchDescription: order.branchDescription || null,
          createdAt: order.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const priceInstantOrder = async (req, res, next) => {
  try {
    const order = await orderService.priceInstantOrder(req.params.id, req.body, req.admin);
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, {
      reason: req.body.reason,
      admin: req.admin,
    });
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const refundOrder = async (req, res, next) => {
  try {
    const order = await orderService.refundOrder(req.params.id, req.admin);
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, {
      status: req.body.status,
      reason: req.body.reason,
      admin: req.admin,
    });
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const assignPharmacy = async (req, res, next) => {
  try {
    const order = await orderService.assignPharmacy(
      req.params.id,
      req.body.pharmacyId,
      req.admin
    );
    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const exportOrdersExcel = async (req, res, next) => {
  try {
    const { buffer, count, startDate, endDate } = await orderService.exportOrdersToExcel(
      req.query,
      req.admin
    );

    const dateRangeLabel = startDate && endDate
      ? `${startDate}_to_${endDate}`
      : startDate
      ? `from_${startDate}`
      : endDate
      ? `until_${endDate}`
      : "all_dates";

    const filename = `Medikart_Orders_${dateRangeLabel}_${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  placeStandardOrder,
  placeNarcoticsOrder,
  reviewNarcoticsOrder,
  placeInstantOrder,
  getOrders,
  getOrderStats,
  getOrderById,
  exportOrdersExcel,
  getPublicOrder,
  priceInstantOrder,
  cancelOrder,
  refundOrder,
  updateOrderStatus,
  assignPharmacy,
};

