/**
 * Standard Order Handler â€” Phase 13 (FR-CW-09, FR-CW-11, rules.md Â§1, Â§3).
 *
 * Full standard COD order path:
 *   OTP verify â†’ product lookup â†’ server-side price computation â†’
 *   delivery charge lookup â†’ order save â†’ confirmation email (non-blocking)
 *
 * Security guarantees:
 *   1. OTP must verify before ANY order document is created (FR-CW-09).
 *   2. Prices are ALWAYS read from DB and run through discount.service â€”
 *      any price field in the request was stripped by Zod before this runs.
 *   3. Delivery charge is server-only via city.service (FR-CW-11).
 *   4. requiresVerification is snapshotted from the current product flags
 *      (PRD Â§12 / FR-AD-16), without introducing the Phase 15 gate here.
 */

const Product = require('../products/product.model');
const Order = require('./order.model');
const otpService = require('../otp/otp.service');
const { getDeliveryCharge } = require('../cities/city.service');
const { getEffectivePrice } = require('../discounts/discount.service');
const { getStorewideDiscount } = require('../settings/settings.service');
const smtp = require('../../integrations/smtp');
const { enqueueSheetSync } = require('../integrations/sheetsSyncQueue');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Place a standard COD order.
 *
 * @param {object} payload  - validated + Zod-stripped request body
 * @returns {Promise<Order>}
 */
const placeStandardOrder = async ({ customer, items, paymentMethod, otp }) => {
  if (otp.email !== customer.email) {
    throw new BadRequestError('OTP email must match the customer email');
  }

  // â”€â”€ Step 1: Fetch products from DB (never trust client prices) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    active: true,
  }).populate('categoryIds', 'name slug discount');

  // â”€â”€ Step 2: Validate existence and stock for every requested item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) {
      throw new NotFoundError(`Product not found: ${item.productId}`);
    }
    if (product.stockStatus === 'out_of_stock') {
      throw new BadRequestError(
        `Product "${product.name}" is currently out of stock`
      );
    }
  }

  // â”€â”€ Step 3: Verify OTP (FR-CW-09) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Must succeed before any order document is created. We validate the cart
  // first so a failed stock check does not unnecessarily consume an OTP.
  await otpService.verifyOtp(otp.email, otp.code);

  const requiresVerification = products.some((product) => product.isNarcotic === true);
  if (requiresVerification && paymentMethod !== 'cod') {
    throw new BadRequestError("Narcotics orders can only be paid via Cash on Delivery.");
  }

  // â”€â”€ Step 4: Fetch storewide discount once (discount.service is pure) â”€â”€â”€â”€â”€â”€â”€
  const storewidePercent = await getStorewideDiscount();

  // â”€â”€ Step 5: Build order items with server-computed effective prices â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Prices are snapshotted at order time â€” a later discount change does not
  // alter existing order line items.
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    // Use first category for discount precedence lookup (product > category > storewide)
    const category = product.categoryIds?.[0] ?? null;
    const { effectivePrice } = getEffectivePrice(product, category, storewidePercent);
    return {
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      quantity: item.quantity,
    };
  });

  // â”€â”€ Step 6: Compute totals server-side (rules.md Â§1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subtotal = round2(
    orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  const deliveryCharge = await getDeliveryCharge(customer.city); // FR-CW-11
  const total = round2(subtotal + deliveryCharge);

  // â”€â”€ Step 7: Save order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const order = await Order.create({
    type: 'standard',
    customer,
    items: orderItems,
    totals: { subtotal, deliveryCharge, total },
    paymentMethod,
    paymentState: 'pending',
    status: 'pending',
    // Snapshot the source product state at submission time. Phase 15 owns the
    // prescription gate and verification workflow; this phase only persists it.
    requiresVerification,
  });

  // ── Step 8: Confirmation email — non-blocking (rules.md §6) ──────────────
  // A send failure must NOT roll back or block the order.
  sendOrderConfirmationEmail(order).catch((err) => {
    console.error(
      `[orders] Confirmation email failed for order ${order._id}: ${err.message}`
    );
  });

  // ── Step 9: Google Sheets sync — non-blocking (Phase 18 / FR-SYS-03) ─────
  // Enqueued AFTER the order is persisted to MongoDB. A Sheets API failure
  // (transient or permanent) never blocks or rolls back the order.
  enqueueSheetSync(order);

  return order;
};

// ─── Confirmation email ─────────────────────────────────────────────────────

const sendOrderConfirmationEmail = async (order) => {
  const itemRows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${i.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">PKR ${i.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#0d9488;">Order Confirmed â€” Medikart</h2>
      <p>Hello ${order.customer.name},</p>
      <p>Thank you for your order. We have received it and it is being processed.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
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
          <td style="padding:4px 12px;">Subtotal</td>
          <td style="padding:4px 12px;text-align:right;">PKR ${order.totals.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;">Delivery</td>
          <td style="padding:4px 12px;text-align:right;">PKR ${order.totals.deliveryCharge.toFixed(2)}</td>
        </tr>
        <tr style="font-weight:bold;font-size:1.05em;">
          <td style="padding:8px 12px;">Total</td>
          <td style="padding:8px 12px;text-align:right;">PKR ${order.totals.total.toFixed(2)}</td>
        </tr>
      </table>
      <hr style="margin:16px 0;">
      <p><strong>Delivery to:</strong> ${order.customer.address}, ${order.customer.city}</p>
      <p><strong>Payment:</strong> Cash on Delivery</p>
      <p style="color:#6b7280;font-size:0.875em;">
        Questions? Contact us. Thank you for shopping with Medikart.
      </p>
    </div>`;

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Order Confirmed â€” Medikart (#${order._id})`,
    html,
    text: `Order confirmed! Order ID: ${order._id}. Total: PKR ${order.totals.total.toFixed(2)}. Payment: Cash on Delivery. Delivery to: ${order.customer.address}, ${order.customer.city}.`,
  });
};

module.exports = { placeStandardOrder };
