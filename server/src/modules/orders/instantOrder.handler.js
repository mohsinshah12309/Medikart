/**
 * Instant Order Handler — Phase 14 (FR-CW-12, FR-AD-19).
 *
 * Instant order path: prescription upload + customer contact/delivery details,
 * NO product selection. Order created with items=[] and status="awaiting-pharmacist-pricing".
 * Admin reviews prescription and uses PATCH /admin/orders/:id/items to add medicines + total.
 *
 * Security guarantees:
 *   1. OTP must verify before order is created (FR-CW-09 / rules.md §3).
 *   2. Prescription upload is REQUIRED (rejecting without one).
 *   3. Prescription files stored outside public routes (rules.md §3).
 *   4. Admin pricing endpoint enforces allow-list (only items + totals writable).
 *   5. Silent overwrite prevention: already-priced orders reject re-pricing.
 */

const Order = require('./order.model');
const otpService = require('../otp/otp.service');
const { getDeliveryCharge } = require('../cities/city.service');
const smtp = require('../../integrations/smtp');
const { BadRequestError } = require('../../utils/errors');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

// ── Prescription Upload Configuration ────────────────────────────────────────
// Stored outside public routes: server/uploads/prescriptions/
const PRESCRIPTIONS_DIR = path.join(__dirname, '../../../uploads/prescriptions');

const prescriptionStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(PRESCRIPTIONS_DIR, { recursive: true });
      cb(null, PRESCRIPTIONS_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueId}${ext}`);
  },
});

const prescriptionUpload = multer({
  storage: prescriptionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Prescription must be a JPEG, PNG, or PDF file'));
    }
  },
}).single('prescription');

// ── Place Instant Order ───────────────────────────────────────────────────────
const placeInstantOrder = async (payload) => {
  const { customer, paymentMethod, otp, branchDescription, prescriptionFilename } = payload;

  // Validate prescription was uploaded
  if (!prescriptionFilename) {
    throw new BadRequestError('Prescription file is required for instant orders');
  }

  // Validate OTP email matches customer email
  if (otp.email !== customer.email) {
    throw new BadRequestError('OTP email must match the customer email');
  }

  // Verify OTP (FR-CW-09)
  await otpService.verifyOtp(otp.email, otp.code);

  // Get delivery charge (server-side only)
  const deliveryCharge = await getDeliveryCharge(customer.city);

  // Create order with empty items, awaiting-pharmacist-pricing status
  const order = await Order.create({
    type: 'instant',
    customer,
    items: [],
    totals: { subtotal: 0, deliveryCharge, total: deliveryCharge },
    paymentMethod,
    paymentState: 'pending',
    status: 'awaiting-pharmacist-pricing',
    requiresVerification: false,
    branchDescription: branchDescription || '',
    prescriptionUrl: `/uploads/prescriptions/${prescriptionFilename}`,
  });

  // Confirmation email — non-blocking
  sendInstantOrderConfirmationEmail(order).catch((err) => {
    console.error(`[orders] Instant order confirmation email failed for order ${order._id}: ${err.message}`);
  });

  return order;
};

// ── Email Template ────────────────────────────────────────────────────────────
const sendInstantOrderConfirmationEmail = async (order) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2c5282; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f7fafc; }
    .order-id { font-size: 18px; font-weight: bold; color: #2c5282; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #cbd5e0; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Instant Order Received</h1>
    </div>
    <div class="content">
      <p>Dear ${order.customer.name},</p>
      <p>We have received your prescription and order details.</p>
      <p class="order-id">Order ID: ${order._id}</p>
      <p><strong>Status:</strong> Awaiting pharmacist review and pricing</p>
      <p><strong>Delivery Address:</strong><br>${order.customer.address}<br>${order.customer.city}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
      <p>Our pharmacist will review your prescription and contact you with pricing details shortly.</p>
      <div class="footer">
        <p>If you have any questions, please contact us.</p>
        <p>&copy; ${new Date().getFullYear()} Medikart. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Instant Order Received - ${order._id}`,
    html,
  });
};

module.exports = { placeInstantOrder, prescriptionUpload };
