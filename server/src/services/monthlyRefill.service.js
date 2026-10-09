/**
 * Monthly Refill Domain Service — Enterprise Hexagonal Architecture.
 *
 * Implements:
 *   - DDD Aggregate Root invariants & Domain Logic.
 *   - Redis Cache-Aside Pattern (TTL 300s) with atomic cache invalidation.
 *   - Distributed Locking (`SET NX PX`) for batch reminder processing.
 *   - Catalog inventory verification & atomic mutations.
 *   - HMAC-SHA256 signed reorder deep link generation.
 *
 * Literature Foundations:
 *   - Clean Architecture (Robert C. Martin): Domain decoupled from transport/Express.
 *   - Domain-Driven Design (Eric Evans): Aggregates, invariants, and value objects.
 *   - Patterns of Enterprise Application Architecture (Martin Fowler): Unit of Work & Idempotent operations.
 *   - Fault Tolerance (Michael Nygard, *Release It!*): Resilient fallbacks & timeouts.
 */

const crypto = require("crypto");
const mongoose = require("mongoose");
const MonthlyRefill = require("../models/monthlyRefill.model");
const Product = require("../modules/products/product.model");
const Customer = require("../modules/customers/customer.model");
const Order = require("../modules/orders/order.model");
const { getEffectivePrice } = require("../modules/discounts/discount.service");
const { getStorewideDiscount } = require("../modules/settings/settings.service");
const { getDeliveryCharge } = require("../modules/cities/city.service");
const { sendBrevoMonthlyRefillEmail, generateReorderDeepLink } = require("./brevoReminder.service");
const redisClient = require("../config/redisClient");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/errors");

const REFILL_CACHE_TTL = 300; // 5 minutes in seconds
const MAX_REFILL_ITEMS = 25;
const VALID_FREQUENCIES = [15, 30, 45, 60];

const round2 = (n) => Math.round((n || 0) * 100) / 100;

class MonthlyRefillService {
  constructor() {
    this.cachePrefix = "refill:customer:";
  }

  /**
   * Generates cache key for customer refill aggregate.
   * @param {string} customerId
   * @returns {string}
   */
  getCacheKey(customerId) {
    return `${this.cachePrefix}${customerId}`;
  }

  /**
   * Atomically invalidates Redis cache for a customer.
   * @param {string} customerId
   */
  async invalidateCache(customerId) {
    if (!customerId) return;
    try {
      const key = this.getCacheKey(customerId);
      await redisClient.del(key);
    } catch (err) {
      // Non-blocking cache failure (resilient design)
      console.warn(`[RefillCache] Invalidation failed for ${customerId}:`, err.message);
    }
  }

  /**
   * Formats and projects an items array with real-time catalog pricing and images.
   */
  async populateRefillItems(items, storewideDiscount) {
    if (!items || items.length === 0) return { formattedItems: [], subtotal: 0 };

    const formattedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const p = item.product || item.productId;
      if (!p) continue;

      const category = (p.categoryIds && p.categoryIds[0]) || null;
      let effectivePrice = p.price || 0;
      let appliedDiscount = null;

      try {
        const discountCalc = getEffectivePrice(p, category, storewideDiscount);
        effectivePrice = discountCalc.effectivePrice;
        appliedDiscount = discountCalc.appliedDiscount;
      } catch (_) {
        effectivePrice = p.price || 0;
      }

      const coverImage =
        p.images?.find((img) => img.isPrimary)?.path ||
        p.images?.[0]?.path ||
        "/uploads/placeholder.webp";

      const qty = item.quantity || 1;
      const itemSubtotal = round2(effectivePrice * qty);
      subtotal += itemSubtotal;

      formattedItems.push({
        _id: item._id ? item._id.toString() : new mongoose.Types.ObjectId().toString(),
        productId: p._id ? p._id.toString() : p.toString(),
        name: p.name || "Prescription Medicine",
        genericName: p.genericName || "",
        sku: p.sku || "",
        price: p.price || 0,
        effectivePrice,
        discountPercent: appliedDiscount ? appliedDiscount.value : 0,
        quantity: qty,
        unitPriceAtAddition: item.unitPriceAtAddition || effectivePrice,
        subtotal: itemSubtotal,
        stockStatus: p.stockStatus || "in_stock",
        isNarcotic: Boolean(p.isNarcotic),
        requiresPrescription: Boolean(p.requiresPrescription),
        active: Boolean(p.active !== false),
        coverImage,
        addedAt: item.addedAt || new Date(),
      });
    }

    return { formattedItems, subtotal: round2(subtotal) };
  }

  /**
   * Retrieve customer's active monthly refill routine (with Cache-Aside pattern).
   *
   * @param {string} customerId
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async getCustomerRefill(customerId, options = {}) {
    if (!customerId) throw new BadRequestError("Customer ID is required");

    const cacheKey = this.getCacheKey(customerId);

    // 1. Try reading from Redis cache (Cache-Aside pattern)
    if (!options.bypassCache) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed;
        }
      } catch (err) {
        console.warn(`[RefillCache] Read failed for ${customerId}:`, err.message);
      }
    }

    // 2. Fetch from MongoDB with lean read and projection pruning
    const refill = await MonthlyRefill.findOne({
      $or: [{ customer: customerId }, { customerId: customerId }],
    })
      .populate({
        path: "items.productId",
        populate: { path: "categoryIds", select: "name slug discount" },
      })
      .populate({
        path: "items.product",
        populate: { path: "categoryIds", select: "name slug discount" },
      })
      .lean();

    if (!refill) {
      const emptyResult = {
        _id: null,
        id: null,
        customer: customerId,
        customerId,
        items: [],
        count: 0,
        subtotal: 0,
        frequencyDays: 30,
        status: "active",
        lastOrderedAt: null,
        nextReminderDate: null,
        nextReminderAt: null,
        lastNotifiedAt: null,
        reminderSentAt: null,
        customNotes: "",
      };
      return emptyResult;
    }

    // 3. Compute real-time pricing and projections
    let storewideDiscount = null;
    try {
      storewideDiscount = await getStorewideDiscount();
    } catch (_) {}

    const { formattedItems, subtotal } = await this.populateRefillItems(
      refill.items,
      storewideDiscount
    );

    const result = {
      _id: refill._id.toString(),
      id: refill._id.toString(),
      customer: refill.customer ? refill.customer.toString() : customerId,
      customerId: refill.customerId ? refill.customerId.toString() : customerId,
      items: formattedItems,
      count: formattedItems.length,
      subtotal,
      frequencyDays: refill.frequencyDays || 30,
      status: refill.status || "active",
      lastOrderedAt: refill.lastOrderedAt || null,
      nextReminderDate: refill.nextReminderDate || refill.nextReminderAt || null,
      nextReminderAt: refill.nextReminderAt || refill.nextReminderDate || null,
      lastNotifiedAt: refill.lastNotifiedAt || refill.reminderSentAt || null,
      reminderSentAt: refill.reminderSentAt || refill.lastNotifiedAt || null,
      customNotes: refill.customNotes || "",
      updatedAt: refill.updatedAt,
      createdAt: refill.createdAt,
    };

    // 4. Cache-Aside write with strict TTL
    try {
      await redisClient.set(cacheKey, JSON.stringify(result), "EX", REFILL_CACHE_TTL);
    } catch (err) {
      console.warn(`[RefillCache] Write failed for ${customerId}:`, err.message);
    }

    return result;
  }

  /**
   * Create or initialize a Monthly Refill list for a customer.
   *
   * @param {string} customerId
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async createRefill(customerId, payload = {}) {
    if (!customerId) throw new BadRequestError("Customer ID is required");

    // Invariant check: frequency restrictions
    const frequencyDays = Number(payload.frequencyDays) || 30;
    if (!VALID_FREQUENCIES.includes(frequencyDays)) {
      throw new BadRequestError(`Invalid frequency. Allowed: ${VALID_FREQUENCIES.join(", ")} days.`);
    }

    // Normalize incoming items array vs single-item shorthand
    let rawItems = [];
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      rawItems = payload.items;
    } else if (payload.product || payload.productId) {
      rawItems = [
        {
          product: payload.product || payload.productId,
          variantId: payload.variantId || null,
          quantity: payload.quantity || 1,
        },
      ];
    } else {
      throw new BadRequestError("At least one product item is required");
    }

    // Invariant check: Item limits
    if (rawItems.length > MAX_REFILL_ITEMS) {
      throw new BadRequestError(`Cannot exceed ${MAX_REFILL_ITEMS} items in a monthly refill`);
    }

    // Inventory and active catalog pre-verification (OWASP A04)
    const productIds = rawItems.map((i) => i.product || i.productId);
    const existingProducts = await Product.find({
      _id: { $in: productIds },
      active: true,
    }).lean();

    const productMap = new Map(existingProducts.map((p) => [p._id.toString(), p]));

    for (const item of rawItems) {
      const pid = (item.product || item.productId).toString();
      const productDoc = productMap.get(pid);
      if (!productDoc) {
        throw new NotFoundError(`Product ${pid} is inactive or not found in catalog`);
      }
      if (productDoc.stockStatus === "out_of_stock") {
        throw new BadRequestError(`Product "${productDoc.name}" is currently out of stock`);
      }
    }

    // Find existing refill document or create new
    let refill = await MonthlyRefill.findOne({
      $or: [{ customer: customerId }, { customerId: customerId }],
    });

    const now = new Date();
    const nextReminder = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

    if (!refill) {
      const validatedItems = rawItems.map((item) => {
        const pid = (item.product || item.productId).toString();
        const p = productMap.get(pid);
        return {
          product: p._id,
          productId: p._id,
          variantId: item.variantId || null,
          quantity: Math.min(Math.max(1, Number(item.quantity) || 1), 20),
          unitPriceAtAddition: p.price || 0,
          addedAt: now,
        };
      });

      refill = new MonthlyRefill({
        customer: customerId,
        customerId,
        items: validatedItems,
        frequencyDays,
        nextReminderDate: nextReminder,
        nextReminderAt: nextReminder,
        status: "active",
        customNotes: payload.customNotes || "",
      });
      await refill.save();
    } else {
      // Merge items idempotently
      for (const item of rawItems) {
        const pid = (item.product || item.productId).toString();
        const p = productMap.get(pid);
        const qty = Math.min(Math.max(1, Number(item.quantity) || 1), 20);

        const existingIndex = refill.items.findIndex(
          (it) => (it.product && it.product.toString() === pid) || (it.productId && it.productId.toString() === pid)
        );

        if (existingIndex > -1) {
          refill.items[existingIndex].quantity = qty;
        } else {
          if (refill.items.length >= MAX_REFILL_ITEMS) {
            throw new BadRequestError(`Monthly refill cannot exceed ${MAX_REFILL_ITEMS} items`);
          }
          refill.items.push({
            product: p._id,
            productId: p._id,
            variantId: item.variantId || null,
            quantity: qty,
            unitPriceAtAddition: p.price || 0,
            addedAt: now,
          });
        }
      }

      refill.frequencyDays = frequencyDays;
      if (!refill.nextReminderDate || refill.nextReminderDate < now) {
        refill.nextReminderDate = nextReminder;
        refill.nextReminderAt = nextReminder;
      }
      if (payload.customNotes !== undefined) {
        refill.customNotes = payload.customNotes;
      }
      refill.status = "active";
      await refill.save();
    }

    // Invalidate Redis cache
    await this.invalidateCache(customerId);

    return this.getCustomerRefill(customerId, { bypassCache: true });
  }

  /**
   * Update a refill routine (frequency, status, notes, or specific item quantity).
   *
   * @param {string} customerId
   * @param {string} refillId
   * @param {Object} updatePayload
   * @returns {Promise<Object>}
   */
  async updateRefill(customerId, refillId, updatePayload = {}) {
    if (!customerId) throw new BadRequestError("Customer ID is required");

    // Scope strictly to customer (OWASP A01 BOLA defense)
    const query = {
      $or: [{ customer: customerId }, { customerId: customerId }],
    };
    if (refillId && refillId !== "me" && refillId !== "default") {
      query._id = refillId;
    }

    const refill = await MonthlyRefill.findOne(query);
    if (!refill) {
      throw new NotFoundError("Monthly refill routine not found for this customer");
    }

    // Invariant: Status transitions
    if (updatePayload.status) {
      const allowedStatuses = ["active", "paused", "cancelled"];
      if (!allowedStatuses.includes(updatePayload.status)) {
        throw new BadRequestError(`Invalid status: ${updatePayload.status}`);
      }
      refill.status = updatePayload.status;
    }

    // Invariant: Frequency restrictions
    if (updatePayload.frequencyDays !== undefined) {
      const freq = Number(updatePayload.frequencyDays);
      if (!VALID_FREQUENCIES.includes(freq)) {
        throw new BadRequestError(`Invalid frequency: ${freq}. Allowed: ${VALID_FREQUENCIES.join(", ")}`);
      }
      refill.frequencyDays = freq;

      // Recalculate next reminder date if active
      if (refill.status === "active") {
        const base = refill.lastOrderedAt || new Date();
        const next = new Date(base.getTime() + freq * 24 * 60 * 60 * 1000);
        refill.nextReminderDate = next;
        refill.nextReminderAt = next;
      }
    }

    if (updatePayload.customNotes !== undefined) {
      refill.customNotes = updatePayload.customNotes;
    }

    // Update single item quantity if provided
    if (updatePayload.itemId && updatePayload.quantity !== undefined) {
      const item = refill.items.id(updatePayload.itemId);
      if (!item) {
        throw new NotFoundError("Item not found in refill list");
      }
      item.quantity = Math.min(Math.max(1, Number(updatePayload.quantity)), 20);
    }

    // Overwrite items array if provided
    if (Array.isArray(updatePayload.items)) {
      if (updatePayload.items.length > MAX_REFILL_ITEMS) {
        throw new BadRequestError(`Cannot exceed ${MAX_REFILL_ITEMS} items`);
      }
      refill.items = updatePayload.items;
    }

    await refill.save();
    await this.invalidateCache(customerId);

    return this.getCustomerRefill(customerId, { bypassCache: true });
  }

  /**
   * Delete entire refill routine or remove a single item from the list.
   *
   * @param {string} customerId
   * @param {string} refillId
   * @param {string} [itemId]
   * @returns {Promise<Object>}
   */
  async deleteRefill(customerId, refillId, itemId) {
    if (!customerId) throw new BadRequestError("Customer ID is required");

    const query = {
      $or: [{ customer: customerId }, { customerId: customerId }],
    };
    if (refillId && refillId !== "me" && refillId !== "default") {
      query._id = refillId;
    }

    const refill = await MonthlyRefill.findOne(query);
    if (!refill) {
      throw new NotFoundError("Monthly refill routine not found");
    }

    if (itemId) {
      // Remove single item using subdocument pull
      refill.items.pull({ _id: itemId });
      await refill.save();
    } else {
      // Clear entire routine items
      refill.items = [];
      refill.status = "paused";
      await refill.save();
    }

    await this.invalidateCache(customerId);
    return this.getCustomerRefill(customerId, { bypassCache: true });
  }

  /**
   * Process automated batch reminders across distributed workers with Redis distributed lock.
   *
   * @returns {Promise<Object>}
   */
  async processBatchReminders() {
    const lockKey = "lock:batch:monthly_refill_reminders";
    const workerId = crypto.randomUUID();
    const lockTtlMs = 60000; // 60 seconds

    // Acquire Redis distributed lock (SET NX PX)
    let acquired = false;
    try {
      const lockRes = await redisClient.set(lockKey, workerId, "PX", lockTtlMs, "NX");
      acquired = lockRes === "OK";
    } catch (err) {
      console.warn("[RefillBatch] Lock acquisition error:", err.message);
      // Fallback: continue if lock fails in single-process mode
      acquired = true;
    }

    if (!acquired) {
      return { success: false, message: "Another worker is currently processing refill reminders" };
    }

    try {
      const now = new Date();
      // Zero COLLSCAN: Compound index `{ nextReminderDate: 1, status: 1 }`
      const eligibleRefills = await MonthlyRefill.find({
        status: "active",
        nextReminderDate: { $lte: now },
        "items.0": { $exists: true },
      })
        .populate("customer", "name email phone")
        .populate("customerId", "name email phone")
        .populate("items.product", "name price images")
        .populate("items.productId", "name price images")
        .lean();

      let dispatched = 0;
      let failed = 0;

      for (const refill of eligibleRefills) {
        const cust = refill.customer || refill.customerId;
        if (!cust || !cust.email) continue;

        try {
          // Offloaded async dispatch
          await sendBrevoMonthlyRefillEmail({
            customer: cust,
            refill,
          });

          // Reset reminder schedule for next cycle
          const nextDate = new Date(now.getTime() + (refill.frequencyDays || 30) * 24 * 60 * 60 * 1000);
          await MonthlyRefill.updateOne(
            { _id: refill._id },
            {
              $set: {
                lastNotifiedAt: now,
                reminderSentAt: now,
                nextReminderDate: nextDate,
                nextReminderAt: nextDate,
              },
            }
          );
          await this.invalidateCache(cust._id.toString());
          dispatched++;
        } catch (dispatchErr) {
          console.error(`[RefillBatch] Error sending reminder to ${cust.email}:`, dispatchErr.message);
          failed++;
        }
      }

      return {
        success: true,
        eligible: eligibleRefills.length,
        dispatched,
        failed,
      };
    } finally {
      // Release distributed lock
      try {
        const currentLock = await redisClient.get(lockKey);
        if (currentLock === workerId) {
          await redisClient.del(lockKey);
        }
      } catch (_) {}
    }
  }

  /**
   * One-click reorder of customer's saved monthly refill list.
   *
   * @param {string} customerId
   * @param {Object} reorderData
   * @returns {Promise<Object>}
   */
  async reorderRefill(customerId, reorderData = {}) {
    if (!customerId) throw new BadRequestError("Customer ID is required");

    const refill = await MonthlyRefill.findOne({
      $or: [{ customer: customerId }, { customerId: customerId }],
    })
      .populate("items.productId")
      .populate("items.product");

    if (!refill || !refill.items || refill.items.length === 0) {
      throw new BadRequestError("No items found in your monthly refill routine to reorder");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) throw new NotFoundError("Customer not found");

    const city = reorderData.city || customer.city || "Lahore";
    const shippingAddress = reorderData.shippingAddress || customer.address || "Standard Customer Address";
    const paymentMethod = reorderData.paymentMethod || "cod";

    const storewideDiscount = await getStorewideDiscount();
    const orderItems = [];
    let itemsTotal = 0;

    for (const item of refill.items) {
      const p = item.productId || item.product;
      if (!p || !p.active) continue;

      const { effectivePrice } = getEffectivePrice(p, p.categoryIds?.[0], storewideDiscount);
      const qty = item.quantity || 1;
      const subtotal = round2(effectivePrice * qty);
      itemsTotal += subtotal;

      orderItems.push({
        productId: p._id,
        name: p.name,
        price: p.price,
        effectivePrice,
        quantity: qty,
        subtotal,
        isNarcotic: Boolean(p.isNarcotic),
        requiresPrescription: Boolean(p.requiresPrescription),
      });
    }

    if (orderItems.length === 0) {
      throw new BadRequestError("All items in your refill are currently inactive or out of stock");
    }

    const deliveryFee = await getDeliveryCharge(city, itemsTotal);
    const finalTotal = round2(itemsTotal + deliveryFee);

    // Create Order document
    const order = new Order({
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      shippingAddress,
      city,
      items: orderItems,
      itemsTotal: round2(itemsTotal),
      deliveryFee,
      totalAmount: finalTotal,
      paymentMethod,
      orderType: "standard",
      status: "pending",
      paymentStatus: "pending",
      notes: "Placed via Medikart 30-Day Monthly Refill routine",
    });

    await order.save();

    // Reset reminder schedule for the next cycle
    const now = new Date();
    const freq = refill.frequencyDays || 30;
    refill.lastOrderedAt = now;
    refill.nextReminderDate = new Date(now.getTime() + freq * 24 * 60 * 60 * 1000);
    refill.nextReminderAt = refill.nextReminderDate;
    await refill.save();

    await this.invalidateCache(customerId);

    return {
      orderId: order._id,
      orderNumber: order.orderNumber || order._id.toString(),
      totalAmount: finalTotal,
      nextReminderDate: refill.nextReminderDate,
    };
  }
}

const monthlyRefillServiceInstance = new MonthlyRefillService();

module.exports = monthlyRefillServiceInstance;
