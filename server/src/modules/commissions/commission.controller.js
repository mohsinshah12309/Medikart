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
 * Process uploaded screenshot buffer with sharp (auto-orient, resize max 1600px, convert to WebP).
 */
async function processProofImage(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new ValidationError("Invalid image file buffer");
  }

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
