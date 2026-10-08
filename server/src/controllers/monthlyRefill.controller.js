/**
 * Monthly Refill Controller & Service Engine — Zero-Trust Customer API Layer.
 *
 * Implements enterprise MERN standards, strict BOLA/IDOR prevention,
 * defense-in-depth against OWASP Top 10 vulnerabilities.
 */

const mongoose = require("mongoose");
const MonthlyRefill = require("../models/monthlyRefill.model");
const Product = require("../modules/products/product.model");
const Customer = require("../modules/customers/customer.model");
const monthlyRefillService = require("../modules/customers/monthlyRefill.service");
const { sendBrevoMonthlyRefillEmail } = require("../services/brevoReminder.service");
const { getClientIp, logSecurityAlert } = require("../utils/securityLogger");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} = require("../utils/errors");

const MAX_REFILL_ITEMS_LIMIT = 25;

/**
 * Audit log helper for structured refill lifecycle events (OWASP A09).
 */
function logRefillAudit(req, action, details = {}) {
  const customerId = (req.user && req.user.id) || (req.customer && req.customer.id) || "anonymous";
  const clientIp = getClientIp(req);
  const ua = req.headers ? req.headers["user-agent"] : "unknown";

  const auditEntry = {
    eventType: "AUDIT_LOG",
    module: "MONTHLY_REFILL",
    action, // 'REFILL_CREATED' | 'REFILL_UPDATED' | 'REFILL_DELETED' | 'REMINDER_TRIGGERED'
    customerId,
    ip: clientIp,
    userAgent: ua,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (process.env.NODE_ENV !== "test") {
    console.log(`📋 [REFILL_AUDIT] ${action} | Customer: ${customerId} | IP: ${clientIp}`);
  }
}

/**
 * Sanitizes and projects a MonthlyRefill document for egress (OWASP A02).
 */
function sanitizeRefillResponse(refillDoc) {
  if (!refillDoc) return null;

  const raw = refillDoc.toObject ? refillDoc.toObject({ virtuals: true }) : { ...refillDoc };
  delete raw.__v;

  const formattedItems = (raw.items || []).map((it) => {
    const prod = it.product || it.productId || {};
    const price = typeof it.unitPriceAtAddition === "number" && it.unitPriceAtAddition > 0
      ? it.unitPriceAtAddition
      : typeof prod.price === "number"
      ? prod.price
      : 0;

    return {
      _id: it._id?.toString() || it.id,
      productId: prod._id?.toString() || it.productId?.toString() || it.product?.toString(),
      name: prod.name || "Prescription Medicine",
      genericName: prod.genericName || "",
      sku: prod.sku || "",
      coverImage: prod.images?.[0]?.path || "/uploads/placeholder.webp",
      quantity: it.quantity,
      unitPriceAtAddition: price,
      price,
      effectivePrice: price,
      subtotal: Math.round(price * (it.quantity || 1) * 100) / 100,
      stockStatus: prod.stockStatus || "in_stock",
      isNarcotic: Boolean(prod.isNarcotic),
      requiresPrescription: Boolean(prod.requiresPrescription),
    };
  });

  const subtotal = Math.round(
    formattedItems.reduce((acc, it) => acc + (it.subtotal || 0), 0) * 100
  ) / 100;

  return {
    _id: raw._id?.toString(),
    id: raw._id?.toString(),
    customer: raw.customer?.toString() || raw.customerId?.toString(),
    customerId: raw.customerId?.toString() || raw.customer?.toString(),
    status: raw.status || "active",
    frequencyDays: raw.frequencyDays || 30,
    nextReminderDate: raw.nextReminderDate || raw.nextReminderAt,
    nextReminderAt: raw.nextReminderAt || raw.nextReminderDate,
    lastNotifiedAt: raw.lastNotifiedAt || raw.reminderSentAt,
    reminderSentAt: raw.reminderSentAt || raw.lastNotifiedAt,
    lastOrderedAt: raw.lastOrderedAt,
    customNotes: raw.customNotes || "",
    items: formattedItems,
    count: formattedItems.length,
    subtotal,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * 1. getRefillList — Scoped strictly to authenticated customer (OWASP A01 BOLA defense).
 * GET /api/v1/customer/monthly-refill
 */
const getRefillList = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.customer?.id;
    if (!customerId) {
      throw new UnauthorizedError("Authentication required");
    }

    const { page = 1, limit = 10, status } = req.query || {};

    const filter = {
      $or: [
        { customer: new mongoose.Types.ObjectId(customerId) },
        { customerId: new mongoose.Types.ObjectId(customerId) },
      ],
    };

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "cancelled" };
    }

    const totalCount = await MonthlyRefill.countDocuments(filter);
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));

    const refills = await MonthlyRefill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(50, Number(limit)))
      .populate({
        path: "items.product",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      })
      .populate({
        path: "items.productId",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      });

    const sanitizedList = refills.map(sanitizeRefillResponse);

    const primaryRefill = sanitizedList[0] || {
      items: [],
      count: 0,
      subtotal: 0,
      status: "active",
      frequencyDays: 30,
      nextReminderDate: null,
      nextReminderAt: null,
    };

    return res.status(200).json({
      status: "success",
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      data: {
        ...primaryRefill,
        subscriptions: sanitizedList,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. getRefillById — Single refill lookup with strict ownership validation (OWASP A01).
 * GET /api/v1/customer/monthly-refill/:id
 */
const getRefillById = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.customer?.id;
    const refillId = req.params.id || req.params.itemId;

    if (!mongoose.Types.ObjectId.isValid(refillId)) {
      throw new BadRequestError("Invalid refill identifier format");
    }

    const refill = await MonthlyRefill.findOne({
      _id: new mongoose.Types.ObjectId(refillId),
      $or: [
        { customer: new mongoose.Types.ObjectId(customerId) },
        { customerId: new mongoose.Types.ObjectId(customerId) },
      ],
    })
      .populate({
        path: "items.product",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      })
      .populate({
        path: "items.productId",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      });

    if (!refill) {
      const otherRefill = await MonthlyRefill.findById(refillId);
      if (otherRefill) {
        logSecurityAlert({
          alertType: "UNAUTHORIZED_REFILL_ACCESS_ATTEMPT",
          message: `IDOR probe detected: Customer ${customerId} attempted to access refill ${refillId}`,
          req,
        });
        throw new ForbiddenError("You are not authorized to view this refill resource");
      }
      throw new NotFoundError("Monthly refill subscription not found");
    }

    return res.status(200).json({
      status: "success",
      data: sanitizeRefillResponse(refill),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. createRefill — Validates stock, prevents narcotics, calculates cycle.
 * POST /api/v1/customer/monthly-refill
 */
const createRefill = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.customer?.id;
    if (!customerId) {
      throw new UnauthorizedError("Authentication required");
    }

    const { items = [], frequencyDays = 30, customNotes = "" } = req.body;

    if (!items || items.length === 0) {
      throw new BadRequestError("At least one product item is required");
    }

    if (items.length > MAX_REFILL_ITEMS_LIMIT) {
      throw new BadRequestError(`Cannot exceed ${MAX_REFILL_ITEMS_LIMIT} items in monthly refill`);
    }

    // Validate each product against active catalogue & live stock (OWASP A04)
    const productIds = items.map((it) => it.product || it.productId);
    const existingProducts = await Product.find({
      _id: { $in: productIds },
      active: true,
    }).select("name price stockStatus active isNarcotic");

    const productMap = new Map();
    existingProducts.forEach((p) => productMap.set(p._id.toString(), p));

    const validatedSubdocs = [];
    for (const rawItem of items) {
      const pid = (rawItem.product || rawItem.productId).toString();
      const product = productMap.get(pid);

      if (!product) {
        throw new BadRequestError(
          `Product (${pid}) is either inactive or no longer available in the catalogue`
        );
      }

      if (product.isNarcotic) {
        throw new BadRequestError(
          `Narcotic medication "${product.name}" cannot be added to automated monthly refills for patient safety`
        );
      }

      if (product.stockStatus === "out_of_stock") {
        throw new BadRequestError(
          `Product "${product.name}" is currently out of stock and cannot be added to refills`
        );
      }

      validatedSubdocs.push({
        product: product._id,
        productId: product._id,
        variantId: rawItem.variantId || null,
        quantity: Math.min(20, Math.max(1, Number(rawItem.quantity) || 1)),
        unitPriceAtAddition: product.price,
        addedAt: new Date(),
      });
    }

    const validFrequency = [15, 30, 45, 60].includes(Number(frequencyDays))
      ? Number(frequencyDays)
      : 30;

    const nextReminderDate = new Date(Date.now() + validFrequency * 24 * 60 * 60 * 1000);

    // Idempotent upsert: Find active refill for customer or create new
    let refill = await MonthlyRefill.findOne({
      $or: [
        { customer: new mongoose.Types.ObjectId(customerId) },
        { customerId: new mongoose.Types.ObjectId(customerId) },
      ],
      status: "active",
    });

    if (refill) {
      // Merge items idempotently
      for (const newSubdoc of validatedSubdocs) {
        const existingIdx = refill.items.findIndex(
          (it) =>
            (it.product && it.product.toString() === newSubdoc.product.toString()) ||
            (it.productId && it.productId.toString() === newSubdoc.product.toString())
        );

        if (existingIdx >= 0) {
          refill.items[existingIdx].quantity += newSubdoc.quantity;
          refill.items[existingIdx].unitPriceAtAddition = newSubdoc.unitPriceAtAddition;
        } else {
          if (refill.items.length >= MAX_REFILL_ITEMS_LIMIT) {
            throw new BadRequestError(
              `Maximum refill capacity reached (${MAX_REFILL_ITEMS_LIMIT} items)`
            );
          }
          refill.items.push(newSubdoc);
        }
      }

      if (customNotes) refill.customNotes = customNotes;
      refill.frequencyDays = validFrequency;
      refill.nextReminderDate = nextReminderDate;
      refill.nextReminderAt = nextReminderDate;
      await refill.save();

      logRefillAudit(req, "REFILL_UPDATED", { refillId: refill._id.toString(), count: refill.items.length });
    } else {
      refill = await MonthlyRefill.create({
        customer: new mongoose.Types.ObjectId(customerId),
        customerId: new mongoose.Types.ObjectId(customerId),
        items: validatedSubdocs,
        frequencyDays: validFrequency,
        nextReminderDate,
        nextReminderAt: nextReminderDate,
        customNotes,
        status: "active",
      });

      logRefillAudit(req, "REFILL_CREATED", { refillId: refill._id.toString(), count: validatedSubdocs.length });
    }

    const populated = await MonthlyRefill.findById(refill._id)
      .populate({
        path: "items.product",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      })
      .populate({
        path: "items.productId",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      });

    return res.status(200).json({
      status: "success",
      message: "Monthly refill saved successfully",
      data: sanitizeRefillResponse(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. updateRefill — Updates subscription status, frequency, or items (OWASP A01 IDOR defense).
 * PATCH /api/v1/customer/monthly-refill/:id
 */
const updateRefill = async (req, res, next) => {
  try {
    const customerId = (req.user?.id || req.customer?.id)?.toString();
    const targetId = req.params.id || req.params.itemId;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new BadRequestError("Invalid identifier format");
    }

    const customerObjId = new mongoose.Types.ObjectId(customerId);
    const targetObjId = new mongoose.Types.ObjectId(targetId);

    // First: Check if this resource belongs to current customer
    let refill = await MonthlyRefill.findOne({
      $and: [
        {
          $or: [
            { customer: customerObjId },
            { customerId: customerObjId },
          ],
        },
        {
          $or: [
            { _id: targetObjId },
            { "items._id": targetObjId },
            { "items.productId": targetObjId },
            { "items.product": targetObjId },
          ],
        },
      ],
    });

    if (!refill) {
      // Check if target resource belongs to ANOTHER customer (Object-level authorization check)
      const otherRefill = await MonthlyRefill.findOne({
        $or: [
          { _id: targetObjId },
          { "items._id": targetObjId },
          { "items.productId": targetObjId },
          { "items.product": targetObjId },
        ],
      });

      if (otherRefill) {
        logSecurityAlert({
          alertType: "UNAUTHORIZED_REFILL_UPDATE_ATTEMPT",
          message: `IDOR update rejected: Customer ${customerId} attempted to modify resource ${targetId} belonging to another customer`,
          req,
        });
        throw new ForbiddenError("You are not authorized to modify this refill item");
      }

      throw new NotFoundError("Monthly refill resource not found");
    }

    const { status, frequencyDays, customNotes, quantity } = req.body;

    // Handle item quantity update
    const itemSubdoc =
      refill.items.id(targetId) ||
      refill.items.find(
        (it) =>
          it._id?.toString() === targetId ||
          it.productId?.toString() === targetId ||
          it.product?.toString() === targetId
      );

    if (itemSubdoc && quantity !== undefined) {
      itemSubdoc.quantity = Math.max(1, Number(quantity) || 1);
    }

    if (status && ["active", "paused", "cancelled"].includes(status)) {
      refill.status = status;
    }

    if (frequencyDays && [15, 30, 45, 60].includes(Number(frequencyDays))) {
      refill.frequencyDays = Number(frequencyDays);
      refill.nextReminderDate = new Date(Date.now() + refill.frequencyDays * 24 * 60 * 60 * 1000);
      refill.nextReminderAt = refill.nextReminderDate;
    }

    if (customNotes !== undefined) {
      refill.customNotes = String(customNotes).slice(0, 200).trim();
    }

    await refill.save();
    logRefillAudit(req, "REFILL_UPDATED", { refillId: refill._id.toString() });

    const populated = await MonthlyRefill.findById(refill._id)
      .populate({
        path: "items.product",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      })
      .populate({
        path: "items.productId",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      });

    return res.status(200).json({
      status: "success",
      message: "Monthly refill updated successfully",
      data: sanitizeRefillResponse(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. deleteRefill — Soft-deletes / cancels or removes refill (OWASP A01 IDOR defense).
 * DELETE /api/v1/customer/monthly-refill/:id
 */
const deleteRefill = async (req, res, next) => {
  try {
    const customerId = (req.user?.id || req.customer?.id)?.toString();
    const targetId = req.params.id || req.params.itemId;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new BadRequestError("Invalid identifier format");
    }

    const customerObjId = new mongoose.Types.ObjectId(customerId);
    const targetObjId = new mongoose.Types.ObjectId(targetId);

    let refill = await MonthlyRefill.findOne({
      $and: [
        {
          $or: [
            { customer: customerObjId },
            { customerId: customerObjId },
          ],
        },
        {
          $or: [
            { _id: targetObjId },
            { "items._id": targetObjId },
            { "items.productId": targetObjId },
            { "items.product": targetObjId },
          ],
        },
      ],
    });

    if (!refill) {
      const otherRefill = await MonthlyRefill.findOne({
        $or: [
          { _id: targetObjId },
          { "items._id": targetObjId },
          { "items.productId": targetObjId },
          { "items.product": targetObjId },
        ],
      });

      if (otherRefill) {
        logSecurityAlert({
          alertType: "UNAUTHORIZED_REFILL_DELETE_ATTEMPT",
          message: `IDOR delete rejected: Customer ${customerId} attempted to remove resource ${targetId} belonging to another customer`,
          req,
        });
        throw new ForbiddenError("You are not authorized to remove this refill item");
      }

      throw new NotFoundError("Monthly refill resource not found");
    }

    // Check if target is full document
    if (refill._id.toString() === targetId) {
      refill.status = "cancelled";
      await refill.save();

      logRefillAudit(req, "REFILL_DELETED", { refillId: refill._id.toString() });

      return res.status(200).json({
        status: "success",
        message: "Monthly refill subscription cancelled",
        data: sanitizeRefillResponse(refill),
      });
    }

    // Otherwise target is an item subdocument
    const itemIndex = refill.items.findIndex(
      (it) =>
        it._id?.toString() === targetId ||
        it.productId?.toString() === targetId ||
        it.product?.toString() === targetId
    );

    if (itemIndex >= 0) {
      refill.items.splice(itemIndex, 1);
      await refill.save();

      logRefillAudit(req, "REFILL_UPDATED", {
        refillId: refill._id.toString(),
        removedItemId: targetId,
      });
    }

    const populated = await MonthlyRefill.findById(refill._id)
      .populate({
        path: "items.product",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      })
      .populate({
        path: "items.productId",
        select: "name genericName sku price stockStatus images isNarcotic requiresPrescription active",
      });

    return res.status(200).json({
      status: "success",
      message: "Item removed from monthly refill list",
      data: sanitizeRefillResponse(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. clearRefillList — Clears all items from the customer's active refill.
 * DELETE /api/v1/customer/monthly-refill
 */
const clearRefillList = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.customer?.id;

    const refill = await MonthlyRefill.findOne({
      $or: [
        { customer: new mongoose.Types.ObjectId(customerId) },
        { customerId: new mongoose.Types.ObjectId(customerId) },
      ],
      status: "active",
    });

    if (refill) {
      refill.items = [];
      await refill.save();
      logRefillAudit(req, "REFILL_DELETED", { refillId: refill._id.toString(), reason: "CLEAR_ALL" });
    }

    return res.status(200).json({
      status: "success",
      message: "Monthly refill routine cleared",
      data: {
        items: [],
        count: 0,
        subtotal: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. triggerManualReminderTest — Rate-limited email preview testing endpoint.
 * POST /api/v1/customer/monthly-refill/test-reminder
 */
const triggerManualReminderTest = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.customer?.id;

    const [customer, refill] = await Promise.all([
      Customer.findById(customerId).select("name email emailVerified isBlocked"),
      MonthlyRefill.findOne({
        $or: [
          { customer: new mongoose.Types.ObjectId(customerId) },
          { customerId: new mongoose.Types.ObjectId(customerId) },
        ],
        status: "active",
      })
        .populate({
          path: "items.product",
          select: "name price stockStatus images sku",
        })
        .populate({
          path: "items.productId",
          select: "name price stockStatus images sku",
        }),
    ]);

    if (!customer) {
      throw new NotFoundError("Customer account not found");
    }

    if (customer.isBlocked) {
      throw new ForbiddenError("Customer account is suspended");
    }

    if (!customer.emailVerified) {
      throw new BadRequestError("Please verify your email address before testing refill reminders");
    }

    if (!refill || !refill.items || refill.items.length === 0) {
      throw new BadRequestError("Your monthly refill routine has no active items to preview");
    }

    const emailItems = refill.items.map((it) => {
      const prod = it.product || it.productId;
      return {
        name: prod?.name || "Medicine",
        quantity: it.quantity,
        unitPriceAtAddition: it.unitPriceAtAddition,
        imageUrl: prod?.images?.[0]?.path,
      };
    });

    const mailResult = await sendBrevoMonthlyRefillEmail({
      customer,
      refill,
      items: emailItems,
    });

    const timestamp = new Date();
    refill.lastNotifiedAt = timestamp;
    refill.reminderSentAt = timestamp;
    await refill.save();

    logRefillAudit(req, "REMINDER_TRIGGERED", {
      refillId: refill._id.toString(),
      recipient: customer.email,
      success: mailResult.success,
    });

    return res.status(200).json({
      status: "success",
      message: `Refill reminder test email dispatched to ${customer.email}`,
      data: {
        dispatchedTo: customer.email,
        itemsCount: emailItems.length,
        messageId: mailResult.messageId || null,
        lastNotifiedAt: refill.lastNotifiedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. reorderRefill — Delegated to monthlyRefill.service for full order creation.
 */
const reorderRefill = async (req, res, next) => {
  try {
    const customerId = req.user?.id || req.customer?.id;
    const result = await monthlyRefillService.reorderRefill(
      customerId,
      req.body || {}
    );
    return res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Backward-compatible helper aliases for frontend integration:
 */
const addItem = createRefill;
const updateItemQuantity = updateRefill;
const removeItem = deleteRefill;

module.exports = {
  getRefillList,
  getRefillById,
  createRefill,
  updateRefill,
  deleteRefill,
  clearRefillList,
  triggerManualReminderTest,
  reorderRefill,
  // Backward compatibility exports
  addItem,
  updateItemQuantity,
  removeItem,
};
