/**
 * Commission Controller
 *
 * Handles HTTP request validation, file upload processing for payment proof,
 * and dispatching to commissionService.
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sharp = require("sharp");
const commissionService = require("./commission.service");
const { ValidationError } = require("../../utils/errors");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads/commissions");

/**
 * Ensure target uploads directory exists.
 */
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validate the actual binary content of an image buffer via magic bytes.
 * Extension and client-supplied Content-Type are NOT trusted (both are spoofable).
 * This mirrors the same defence used by prescription uploads (instantOrder.handler.js).
 *
 * @param {Buffer} buffer - raw upload bytes
 * @throws {ValidationError} if bytes don't match any known image signature
 */
function validateImageMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    throw new ValidationError("Image file is empty or too small");
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer.length >= 8 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) return;

  // WebP: starts with "RIFF" (52 49 46 46) + 4 bytes + "WEBP" (57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) return;

  // GIF: "GIF87a" or "GIF89a"
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) return;

  throw new ValidationError(
    "Payment proof file content does not match any supported image format (JPEG, PNG, WebP, GIF)"
  );
}

/**
 * Process uploaded screenshot buffer with sharp (auto-orient, resize max 1600px, convert to WebP).
 * Magic bytes are validated BEFORE any processing or disk write.
 */
async function processProofImage(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new ValidationError("Invalid image file buffer");
  }

  // Fix: Explicit magic-byte validation — reject spoofed files before Sharp touches them
  validateImageMagicBytes(buffer);

  try {
    ensureUploadDir();
    const filename = `proof_${crypto.randomBytes(8).toString("hex")}_${Date.now()}.webp`;
    const diskPath = path.join(UPLOAD_DIR, filename);

    const processedBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(diskPath, processedBuffer);
    return `/uploads/commissions/${filename}`;
  } catch (err) {
    // Re-throw ValidationErrors from magic-byte check as-is
    if (err instanceof ValidationError) throw err;
    console.error("[CommissionController] Image processing failed:", err.message);
    throw new ValidationError("Failed to process payment proof image");
  }
}

/**
 * POST /api/v1/admin/commissions
 */
const submitPayment = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // If file was attached via multipart form
    if (req.file && req.file.buffer) {
      payload.screenshotUrl = await processProofImage(req.file.buffer);
    }

    if (!payload.screenshotUrl) {
      throw new ValidationError("Payment proof screenshot is required");
    }

    const payment = await commissionService.submitPayment(payload, req.admin);
    res.status(201).json({
      status: "success",
      message: "Commission payment proof submitted successfully",
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/commissions/pharmacy/:pharmacyId
 */
const getPharmacyPayments = async (req, res, next) => {
  try {
    const payments = await commissionService.getPharmacyPayments(
      req.params.pharmacyId,
      req.admin
    );
    res.status(200).json({
      status: "success",
      results: payments.length,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/commissions/pharmacy/:pharmacyId/balance
 */
const getPharmacyBalance = async (req, res, next) => {
  try {
    const balance = await commissionService.getPharmacyBalance(
      req.params.pharmacyId,
      req.admin
    );
    res.status(200).json({
      status: "success",
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/commissions/:paymentId/verify
 */
const verifyPayment = async (req, res, next) => {
  try {
    const result = await commissionService.verifyPayment(
      req.params.paymentId,
      req.admin
    );
    res.status(200).json({
      status: "success",
      message: "Payment successfully verified and balance adjusted",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/commissions/:paymentId/reject
 */
const rejectPayment = async (req, res, next) => {
  try {
    const result = await commissionService.rejectPayment(
      req.params.paymentId,
      req.body,
      req.admin
    );
    res.status(200).json({
      status: "success",
      message: "Commission payment submission rejected",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/commissions/paid-summary
 */
const getCommissionsPaidSummary = async (req, res, next) => {
  try {
    const summary = await commissionService.getCommissionsPaidSummary(
      req.query,
      req.admin
    );
    res.status(200).json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitPayment,
  getPharmacyPayments,
  getPharmacyBalance,
  verifyPayment,
  rejectPayment,
  getCommissionsPaidSummary,
};
