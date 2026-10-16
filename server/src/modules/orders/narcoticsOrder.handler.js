/**
 * Narcotics Order Handler — Phase 15 (FR-CW-13, FR-CW-14, FR-AD-16, PRD §12/§13.3).
 *
 * This is the single most compliance-critical handler in the project. It gates
 * cart submission behind prescription verification when the cart contains any
 * product currently carrying isNarcotic: true.
 *
 * Security / compliance guarantees:
 *   1. Every item in the cart is checked — never just the first one — to
 *      determine whether a prescription is required (FR-CW-13/14).
 *   2. requiresVerification is SNAPSHOTTED at the exact moment of order
 *      creation from the products' current flags. A flag change on a product
 *      AFTER this order exists must never alter this field (FR-AD-16). The
 *      value is copied onto the order document once, right here, and never
 *      recomputed from Product documents later.
 *   3. If the cart requires verification, a prescription file is REQUIRED —
 *      the order cannot be submitted without one.
 *   4. Order status is set to pending_verification (not pending) and the
 *      verification subdocument is initialised to { status: 'pending' }.
 *   5. Prices are ALWAYS server-computed through discount.service — never
 *      trusted from the client (rules.md §1).
 *   6. Payment is NOT captured here. paymentState stays 'pending' and Phase 16
 *      layers authorize/capture on top, reading the payment-state field the
 *      PRD §14 schema already defines.
 *
 * Phase 19 — FR-CW-15: confirmation email deduplication.
 *   sendNarcoticsOrderConfirmationEmailOnce uses an atomic findOneAndUpdate so
 *   a retried request can never fire a second confirmation email for the same order.
 */

const Product = require("../products/product.model");
const Order = require("./order.model");
const otpService = require("../otp/otp.service");
const { getDeliveryCharge } = require("../cities/city.service");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getStorewideDiscount } = require("../settings/settings.service");
const smtp = require("../../integrations/smtp");
const { NotFoundError, BadRequestError } = require("../../utils/errors");

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Place a narcotics order.
 *
 * @param {object} payload - validated request, multer-prescription in hand
 * @param {object} payload.customer
 * @param {Array}  payload.items  - [{ productId, quantity }]
 * @param {string} payload.paymentMethod
 * @param {object} payload.otp
 * @param {string|null} payload.prescriptionFilename  - null when not uploaded
 * @returns {Promise<Order>}
 */
const placeNarcoticsOrder = async ({
  customer,
  items,
  paymentMethod,
  otp,
  prescriptionFilename,
  prescriptionFilenames,
  patientName,
  pharmacistNotes,
  customerNotes,
  prescriptionConfirmation,
}) => {
  if (otp.email !== customer.email) {
    throw new BadRequestError("OTP email must match the customer email");
  }

  // ── Step 1: Fetch products, storewide discount, and delivery charge concurrently ──
  const productIds = items.map((i) => i.productId);
  const [products, storewidePercent, deliveryCharge] = await Promise.all([
    Product.find({
      _id: { $in: productIds },
      active: true,
    }).populate("categoryIds", "name slug discount"),
    getStorewideDiscount(),
    getDeliveryCharge(customer.city),
  ]);

  // ── Step 2: Validate existence and stock for EVERY item ────────────────────
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) {
      throw new NotFoundError(`Product not found: ${item.productId}`);
    }
    if (product.stockStatus === "out_of_stock") {
      throw new BadRequestError(
        `Product "${product.name}" is currently out of stock`,
      );
    }
  }

  // ── Step 3: THE SNAPSHOT ───────────────────────────────────────────────────
  const requiresVerification = products.some(
    (product) => product.isNarcotic === true || product.requiresPrescription === true || product.rxStatus === "prescription_required",
  );

  const files = Array.isArray(prescriptionFilenames) && prescriptionFilenames.length > 0
    ? prescriptionFilenames
    : prescriptionFilename
    ? [prescriptionFilename]
    : [];

  // ── Step 4: Prescription gate ──────────────────────────────────────────────
  if (requiresVerification && files.length === 0) {
    throw new BadRequestError(
      "Prescription file is required for an order containing prescription-required products",
    );
  }

  if (requiresVerification && paymentMethod !== 'cod') {
    throw new BadRequestError("Prescription orders can only be paid via Cash on Delivery.");
  }

  // ── Step 5: Verify OTP (FR-CW-09) ──────────────────────────────────────────
  await otpService.verifyOtp(otp.email, otp.code);

  // ── Step 6: Build order items with server-computed effective prices & review status ──
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    const category = product.categoryIds?.[0] ?? null;
    const { effectivePrice } = getEffectivePrice(
      product,
      category,
      storewidePercent,
    );
    const itemNeedsRx = Boolean(
      product.isNarcotic || product.requiresPrescription || product.rxStatus === "prescription_required"
    );
    return {
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: item.quantity,
      isNarcotic: Boolean(product.isNarcotic),
      rxStatus: product.rxStatus || (product.isNarcotic ? "prescription_required" : "none"),
      reviewStatus: itemNeedsRx ? "pending" : "approved",
      rejectionReason: null,
    };
  });

  // ── Step 7: Compute totals server-side (rules.md §1) ──────────────────────
  const platformFee = 10;
  const subtotal = round2(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  const total = round2(subtotal + deliveryCharge + platformFee);

  // ── Step 9: Save order ────────────────────────────────────────────────────
  const prescriptionUrls = files.map((f) => `/api/v1/admin/prescriptions/${f}`);
  const primaryPrescriptionUrl = prescriptionUrls[0] || null;
  const initialStatus = requiresVerification || hasPrescriptionFiles
    ? "pending_verification"
    : "pending";

  const order = await Order.create({
    type: "narcotics",
    customer,
    items: orderItems,
    totals: { subtotal, deliveryCharge, platformFee, total },
    paymentMethod,
    paymentState: "pending",
    status: initialStatus,
    requiresVerification: requiresVerification || hasPrescriptionFiles,
    verification: { status: "pending" },
    prescriptionUrl: primaryPrescriptionUrl,
    prescriptionUrls,
    patientName: patientName || null,
    pharmacistNotes: pharmacistNotes || null,
    customerNotes: customerNotes || null,
    prescriptionConfirmation: Boolean(prescriptionConfirmation),
    confirmationEmailSent: false,
  });

  // ── Step 10: Confirmation email — non-blocking, dedup-guarded (FR-CW-15) ──
  sendNarcoticsOrderConfirmationEmailOnce(order).catch((err) => {
    console.error(
      `[orders] Narcotics order confirmation email failed for order ${order._id}: ${err.message}`,
    );
  });

  return order;
};

// ── Email deduplication wrapper (Phase 19 / FR-CW-15) ────────────────────────

/**
 * Atomically claim the confirmation-email send slot, then send once.
 * See standardOrder.handler.js for full rationale.
 */
const sendNarcoticsOrderConfirmationEmailOnce = async (order) => {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, confirmationEmailSent: false },
    { $set: { confirmationEmailSent: true } },
    { new: false }
  );
  if (!claimed) {
    return; // Another caller already sent this email.
  }
  await sendNarcoticsOrderConfirmationEmail(order);
};

// ─── Confirmation email template ───────────────────────────────────────────────
const { generateStandardOrderPlacedTemplate } = require("../../utils/emailTemplates");

const sendNarcoticsOrderConfirmationEmail = async (order) => {
  const template = generateStandardOrderPlacedTemplate({ order });
  const orderCode = order.orderCode || (order._id ? `MK-${String(order._id).slice(-6).toUpperCase()}` : "MK-ORDER");

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Order Received (Prescription Verification) — Medikart (#${orderCode})`,
    html: template.html,
    text: template.text,
    purpose: "order_placed",
    fromName: "Medikart Orders",
  });
};

module.exports = { placeNarcoticsOrder, sendNarcoticsOrderConfirmationEmailOnce };
