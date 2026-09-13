/**
 * Monthly Refill Service — Customer Saved Medicines & Automated 30-Day Cycles.
 *
 * Implements:
 *   - Customer-scoped monthly medicine refill queue.
 *   - Object-level authorization (guaranteed customerId isolation).
 *   - Real-time catalog price population with active category and storewide discounts.
 *   - Instant one-click reordering through existing standard order workflow.
 *   - Automatic 30-day reminder reset on every successful reorder.
 */

const mongoose = require("mongoose");
const MonthlyRefill = require("./monthlyRefill.model");
const Customer = require("./customer.model");
const Product = require("../products/product.model");
const Order = require("../orders/order.model");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getStorewideDiscount } = require("../settings/settings.service");
const { getDeliveryCharge } = require("../cities/city.service");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../../utils/errors");

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Get populated Monthly Refill list for a customer.
 */
const getRefillList = async (customerId) => {
  const refill = await MonthlyRefill.findOne({ customerId }).populate({
    path: "items.productId",
    populate: { path: "categoryIds", select: "name slug discount" },
  });

  if (!refill) {
    return {
      _id: null,
      customerId,
      items: [],
      count: 0,
      subtotal: 0,
      lastOrderedAt: null,
      nextReminderAt: null,
      reminderSentAt: null,
    };
  }

  const storewideDiscount = await getStorewideDiscount();

  const formattedItems = [];
  let subtotal = 0;

  for (const item of refill.items) {
    const p = item.productId;
    if (!p) continue;

    const category = p.categoryIds?.[0] || null;
    const { effectivePrice, appliedDiscount } = getEffectivePrice(
      p,
      category,
      storewideDiscount
    );

    const coverImage =
      p.images?.find((img) => img.isPrimary)?.path ||
      p.images?.[0]?.path ||
      "/uploads/placeholder.webp";

    const itemSubtotal = round2(effectivePrice * item.quantity);
    subtotal += itemSubtotal;

    formattedItems.push({
      _id: item._id,
      productId: p._id,
      name: p.name,
      genericName: p.genericName || "",
      sku: p.sku || "",
      price: p.price,
      effectivePrice,
      discountPercent: appliedDiscount ? appliedDiscount.value : 0,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      stockStatus: p.stockStatus || "in_stock",
      isNarcotic: Boolean(p.isNarcotic),
      active: Boolean(p.active),
      coverImage,
      addedAt: item.addedAt,
    });
  }

  return {
    _id: refill._id,
    customerId: refill.customerId,
    items: formattedItems,
    count: formattedItems.length,
    subtotal: round2(subtotal),
    lastOrderedAt: refill.lastOrderedAt,
    nextReminderAt: refill.nextReminderAt,
    reminderSentAt: refill.reminderSentAt,
  };
};

/**
 * Add product(s) to the customer's monthly refill list.
 * Creates the refill document on first use.
 */
const addItem = async (customerId, payload) => {
  const itemsToAdd = Array.isArray(payload.items)
    ? payload.items
    : [{ productId: payload.productId, quantity: payload.quantity || 1 }];

  // Validate all products exist and are active
  const productIds = itemsToAdd.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    active: true,
  });

  if (products.length !== productIds.length) {
    throw new NotFoundError("One or more products were not found or are inactive");
  }

  for (const item of itemsToAdd) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (product.isNarcotic) {
      throw new BadRequestError(
        `"${product.name}" is a controlled narcotic medicine and cannot be added to automated monthly refills.`
      );
    }
  }

  let refill = await MonthlyRefill.findOne({ customerId });
  if (!refill) {
    refill = new MonthlyRefill({
      customerId,
      items: [],
    });
  }

  for (const item of itemsToAdd) {
    const existingIndex = refill.items.findIndex(
      (it) => it.productId.toString() === item.productId
    );

    if (existingIndex > -1) {
      refill.items[existingIndex].quantity = Math.max(
        1,
        refill.items[existingIndex].quantity + (item.quantity || 1)
      );
    } else {
      refill.items.push({
        productId: item.productId,
        quantity: Math.max(1, item.quantity || 1),
        addedAt: new Date(),
      });
    }
  }

  await refill.save();
  return getRefillList(customerId);
};

/**
 * Update item quantity in customer's refill list.
 * Verifies object-level ownership: item must belong to customer's document.
 */
const updateItemQuantity = async (customerId, itemId, quantity) => {
  const refill = await MonthlyRefill.findOne({ customerId });
  if (!refill) {
    // Check if the item belongs to another customer's document
    const otherRefill = await MonthlyRefill.findOne({
      "items._id": itemId,
    });
    if (otherRefill) {
      throw new ForbiddenError("You are not authorized to modify this refill item");
    }
    throw new NotFoundError("Monthly refill list not found");
  }

  const itemIndex = refill.items.findIndex(
    (it) => it._id.toString() === itemId || it.productId.toString() === itemId
  );

  if (itemIndex === -1) {
    const otherRefill = await MonthlyRefill.findOne({
      "items._id": itemId,
    });
    if (otherRefill) {
      throw new ForbiddenError("You are not authorized to modify this refill item");
    }
    throw new NotFoundError("Refill item not found in your list");
  }

  refill.items[itemIndex].quantity = quantity;
  await refill.save();

  return getRefillList(customerId);
};

/**
 * Remove an item from the customer's refill list.
 * Verifies object-level ownership before mutating.
 */
const removeItem = async (customerId, itemId) => {
  const refill = await MonthlyRefill.findOne({ customerId });
  if (!refill) {
    const otherRefill = await MonthlyRefill.findOne({
      "items._id": itemId,
    });
    if (otherRefill) {
      throw new ForbiddenError("You are not authorized to remove this refill item");
    }
    throw new NotFoundError("Monthly refill list not found");
  }

  const itemIndex = refill.items.findIndex(
    (it) => it._id.toString() === itemId || it.productId.toString() === itemId
  );

  if (itemIndex === -1) {
    const otherRefill = await MonthlyRefill.findOne({
      "items._id": itemId,
    });
    if (otherRefill) {
      throw new ForbiddenError("You are not authorized to remove this refill item");
    }
    throw new NotFoundError("Refill item not found in your list");
  }

  refill.items.splice(itemIndex, 1);
  await refill.save();

  return getRefillList(customerId);
};

/**
 * Clear customer's monthly refill list.
 */
const clearRefillList = async (customerId) => {
  const refill = await MonthlyRefill.findOne({ customerId });
  if (refill) {
    refill.items = [];
    await refill.save();
  }

  return {
    success: true,
    message: "Monthly refill list cleared successfully",
    items: [],
    count: 0,
    subtotal: 0,
  };
};

/**
 * Build a new standard Order from current refill items.
 * Sets:
 *   - lastOrderedAt = now
 *   - nextReminderAt = now + 30 days
 *   - reminderSentAt = null
 */
const reorderRefill = async (customerId, orderData = {}) => {
  const refill = await MonthlyRefill.findOne({ customerId });
  if (!refill || !refill.items || refill.items.length === 0) {
    throw new BadRequestError("Your monthly refill list is empty");
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError("Customer account not found");
  }

  // Check recent order for fallback address/city/phone if not passed
  let fallbackAddress = "";
  let fallbackCity = "Karachi";
  let fallbackPhone = customer.phone || "";

  const lastOrder = await Order.findOne({ "customer.email": customer.email })
    .sort({ createdAt: -1 })
    .lean();

  if (lastOrder && lastOrder.customer) {
    fallbackAddress = lastOrder.customer.address || fallbackAddress;
    fallbackCity = lastOrder.customer.city || fallbackCity;
    fallbackPhone = lastOrder.customer.phone || fallbackPhone;
  }

  const address = (orderData.address || fallbackAddress).trim();
  const city = (orderData.city || fallbackCity).trim();
  const phone = (orderData.phone || fallbackPhone).trim();
  const paymentMethod = orderData.paymentMethod === "card" ? "card" : "cod";

  if (!address || address.length < 3) {
    throw new BadRequestError("A valid delivery address is required to place your refill order");
  }
  if (!city) {
    throw new BadRequestError("A valid delivery city is required to place your refill order");
  }
  if (!phone || phone.length < 7) {
    throw new BadRequestError("A valid contact phone number is required to place your refill order");
  }

  // Fetch products and verify availability
  const productIds = refill.items.map((i) => i.productId);
  const [products, storewidePercent, deliveryCharge] = await Promise.all([
    Product.find({ _id: { $in: productIds }, active: true }).populate(
      "categoryIds",
      "name slug discount"
    ),
    getStorewideDiscount(),
    getDeliveryCharge(city),
  ]);

  if (products.length === 0) {
    throw new BadRequestError("None of the products in your refill list are currently available");
  }

  for (const item of refill.items) {
    const product = products.find((p) => p._id.toString() === item.productId.toString());
    if (!product) {
      throw new BadRequestError("One or more products in your refill list are no longer available");
    }
    if (product.stockStatus === "out_of_stock") {
      throw new BadRequestError(`"${product.name}" is currently out of stock`);
    }
    if (product.isNarcotic) {
      throw new BadRequestError(`"${product.name}" requires prescription verification and cannot be auto-reordered`);
    }
  }

  // Build order items with server-computed effective prices
  const orderItems = refill.items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId.toString());
    const category = product.categoryIds?.[0] ?? null;
    const { effectivePrice } = getEffectivePrice(product, category, storewidePercent);

    return {
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: item.quantity,
    };
  });

  const platformFee = 10;
  const subtotal = round2(
    orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
  );
  const total = round2(subtotal + deliveryCharge + platformFee);

  // Create standard order
  const order = await Order.create({
    type: "standard",
    customer: {
      name: customer.name,
      email: customer.email,
      phone,
      address,
      city,
    },
    items: orderItems,
    totals: {
      subtotal,
      deliveryCharge,
      platformFee,
      total,
    },
    paymentMethod,
    paymentState: paymentMethod === "cod" ? "pending" : "pending",
    status: "pending",
  });

  // Update refill schedule: 30 days cycle reset
  const now = new Date();
  const nextReminder = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  refill.lastOrderedAt = now;
  refill.nextReminderAt = nextReminder;
  refill.reminderSentAt = null; // Reset so next reminder triggers in 30 days
  await refill.save();

  return {
    success: true,
    message: "Monthly refill order placed successfully!",
    order,
    nextReminderAt: nextReminder,
  };
};

module.exports = {
  getRefillList,
  addItem,
  updateItemQuantity,
  removeItem,
  clearRefillList,
  reorderRefill,
};
