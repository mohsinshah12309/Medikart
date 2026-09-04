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
  // requiresVerification is read from the live product flags at the exact
  // moment of order creation and copied onto the order document. We never
  // reference Product documents again for this value, and never recompute it
  // on reads/updates of this order. Check EVERY item — a single narcotics-
  // flagged item in the cart triggers the whole workflow (FR-CW-14).
  const requiresVerification = products.some(
    (product) => product.isNarcotic === true,
  );

  // ── Step 4: Prescription gate ──────────────────────────────────────────────
  // If the cart contains a narcotics-flagged product, a prescription file is
  // mandatory and the order cannot be created without it (FR-CW-13).
  if (requiresVerification && !prescriptionFilename) {
    throw new BadRequestError(
      "Prescription file is required for an order containing narcotics-flagged products",
    );
  }

  if (requiresVerification && paymentMethod !== 'cod') {
    throw new BadRequestError("Narcotics orders can only be paid via Cash on Delivery.");
  }

  // ── Step 5: Verify OTP (FR-CW-09) ──────────────────────────────────────────
  // Must succeed before any order document is created.
  await otpService.verifyOtp(otp.email, otp.code);

  // ── Step 6: Build order items with server-computed effective prices ─────────
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    const category = product.categoryIds?.[0] ?? null;
    const { effectivePrice } = getEffectivePrice(
      product,
      category,
      storewidePercent,
    );
    return {
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: item.quantity,
    };
  });

  // ── Step 7: Compute totals server-side (rules.md §1) ──────────────────────
  const subtotal = round2(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  const total = round2(subtotal + deliveryCharge);

  // ── Step 9: Save order — status pending_verification, NOT pending ──────────
  // The requiresVerification value is baked permanently into this document.
  // Phase 16 reads paymentState (kept 'pending') for authorize/capture.
  const order = await Order.create({
    type: "narcotics",
    customer,
    items: orderItems,
    totals: { subtotal, deliveryCharge, total },
    paymentMethod,
    paymentState: "pending", // Phase 16 owns card authorize/capture from here
    status: "pending_verification",
    requiresVerification, // SNAPSHOT — never recomputed after this write
    verification: { status: "pending" },
    // Fix 1 — prescription files are ONLY accessible through the
    // authenticated admin route, never a public static URL (FR-SYS-02).
    prescriptionUrl: prescriptionFilename
      ? `/api/v1/admin/prescriptions/${prescriptionFilename}`
      : null,
    // Phase 19: starts as false; flipped atomically to true when the email fires.
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
const sendNarcoticsOrderConfirmationEmail = async (order) => {
  const itemRows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${i.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">PKR ${i.price.toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#0d9488;">Order Received — Medikart</h2>
      <p>Hello ${order.customer.name},</p>
      <p>Your order contains one or more prescription-controlled products. Our pharmacist will verify the uploaded prescription before fulfillment begins.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Status:</strong> Pending verification</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;">Product</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="width:100%;margin-top:8px;">
        <tr>
          <td>Subtotal</td>
          <td>PKR ${order.totals.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Delivery</td>
          <td>PKR ${order.totals.deliveryCharge.toFixed(2)}</td>
        </tr>
        <tr style="font-weight:bold;font-size:1.05em;">
          <td>Total</td>
          <td>PKR ${order.totals.total.toFixed(2)}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:0.875em;">
        Questions? Contact us. Thank you for shopping with Medikart.
      </p>
    </div>`;

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Order Received — Medikart (#${order._id})`,
    html,
    text: `Your order has been received. Order ID: ${order._id}. It is pending pharmacist verification. Total: PKR ${order.totals.total.toFixed(2)}.`,
  });
};

module.exports = { placeNarcoticsOrder, sendNarcoticsOrderConfirmationEmailOnce };
