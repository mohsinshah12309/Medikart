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
 *
 * Phase 19 — FR-CW-15: confirmation email deduplication.
 *   sendInstantOrderConfirmationEmailOnce uses an atomic findOneAndUpdate so a
 *   retried request can never fire a second confirmation email for the same order.
 */

const Order = require("./order.model");
const otpService = require("../otp/otp.service");
const { getDeliveryCharge } = require("../cities/city.service");
const smtp = require("../../integrations/smtp");
const { enqueueSheetSync } = require("../integrations/sheetsSyncQueue");
const { BadRequestError, ValidationError } = require("../../utils/errors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs").promises;

// ── Prescription Upload Configuration ────────────────────────────────────────
// Stored outside public routes: server/uploads/prescriptions/
const PRESCRIPTIONS_DIR = path.join(
  __dirname,
  "../../../uploads/prescriptions",
);

// Fix 4 — TRUE content validation. Files are held in memory first so the
// actual bytes can be inspected (magic-byte/header check) BEFORE anything is
// written to disk. A file renamed to .jpg or .pdf with fake mimetype is
// rejected — never stored. NFR-SEC-04.
const prescriptionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Prescription must be a JPEG, PNG, or PDF file"));
    }
  },
}).single("prescription");

/**
 * Validate the actual content of a prescription buffer (magic bytes / header).
 * Fix 4 — extension and client-supplied mimetype are NOT trusted.
 *
 * @param {Buffer} buffer - raw file content from multer
 * @returns {string} - true file extension ('.jpg', '.png', or '.pdf')
 */
const validatePrescriptionContent = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    throw new ValidationError("Prescription file is empty or too small");
  }

  // PDF: starts with "%PDF-" (bytes 25 50 44 46 2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return ".pdf";
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return ".png";
  }

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }

  throw new ValidationError(
    "Prescription file content is not a valid JPEG, PNG, or PDF",
  );
};

/**
 * Store a validated prescription buffer to disk.
 * Fix 4 — called AFTER content validation; generates a random filename.
 *
 * @param {Buffer} buffer - validated prescription file content
 * @returns {Promise<string>} - the stored filename
 */
const savePrescriptionToDisk = async (buffer) => {
  const ext = validatePrescriptionContent(buffer);
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const filename = `${Date.now()}-${uniqueId}${ext}`;

  await fs.mkdir(PRESCRIPTIONS_DIR, { recursive: true });
  await fs.writeFile(path.join(PRESCRIPTIONS_DIR, filename), buffer);

  return filename;
};

// ── Place Instant Order ───────────────────────────────────────────────────────
const placeInstantOrder = async (payload) => {
  const {
    customer,
    paymentMethod,
    otp,
    branchDescription,
    prescriptionFilename,
  } = payload;

  // Validate prescription was uploaded
  if (!prescriptionFilename) {
    throw new BadRequestError(
      "Prescription file is required for instant orders",
    );
  }

  // Validate OTP email matches customer email
  if (otp.email !== customer.email) {
    throw new BadRequestError("OTP email must match the customer email");
  }

  // Verify OTP (FR-CW-09)
  await otpService.verifyOtp(otp.email, otp.code);

  // Get delivery charge (server-side only)
  const deliveryCharge = await getDeliveryCharge(customer.city);

  // ── SNAPSHOT (FR-AD-16) ───────────────────────────────────────────────
  // An instant order is submitted WITHOUT product selection (items: []), so
  // there are no narcotics-flagged items at submission time — the snapshot is
  // false by definition. This is the same snapshot-at-submission principle as
  // standardOrder.handler.js / narcoticsOrder.handler.js.
  // The value is SNAPSHOTTED onto the order document here and is NEVER
  // recomputed from live Product documents later (e.g. when the admin prices
  // the order). A product flagged narcotics after this order exists must not
  // retroactively change this value.
  const requiresVerification = false;

  // Create order with empty items, awaiting-pharmacist-pricing status
  const order = await Order.create({
    type: "instant",
    customer,
    items: [],
    totals: { subtotal: 0, deliveryCharge, total: deliveryCharge },
    paymentMethod,
    paymentState: "pending",
    status: "awaiting-pharmacist-pricing",
    // SNAPSHOT — never recomputed after this write (FR-AD-16)
    requiresVerification,
    branchDescription: branchDescription || "",
    // Fix 1 — prescription files are ONLY accessible through the
    // authenticated admin route, never a public static URL (FR-SYS-02).
    prescriptionUrl: `/api/v1/admin/prescriptions/${prescriptionFilename}`,
    // Phase 19: starts as false; flipped atomically to true when the email fires.
    confirmationEmailSent: false,
  });

  // ── Confirmation email — non-blocking, dedup-guarded (FR-CW-15) ──────────
  sendInstantOrderConfirmationEmailOnce(order).catch((err) => {
    console.error(
      `[orders] Instant order confirmation email failed for order ${order._id}: ${err.message}`,
    );
  });

  // ── Google Sheets sync — non-blocking (Phase 18 / FR-SYS-04) ────────────
  // Enqueued AFTER the order is persisted to MongoDB. A Sheets API failure
  // (transient or permanent) never blocks or rolls back the order.
  enqueueSheetSync(order);

  return order;
};

// ── Email deduplication wrapper (Phase 19 / FR-CW-15) ────────────────────────

/**
 * Atomically claim the confirmation-email send slot, then send once.
 * See standardOrder.handler.js for full rationale.
 */
const sendInstantOrderConfirmationEmailOnce = async (order) => {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, confirmationEmailSent: false },
    { $set: { confirmationEmailSent: true } },
    { new: false }
  );
  if (!claimed) {
    return; // Another caller already sent this email.
  }
  await sendInstantOrderConfirmationEmail(order);
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

module.exports = {
  placeInstantOrder,
  prescriptionUpload,
  savePrescriptionToDisk,
  validatePrescriptionContent,
  sendInstantOrderConfirmationEmailOnce,
};
