/**
 * Commission Routes — Mounted under /api/v1/admin/commissions
 *
 * All routes require admin authentication (applied at app.js level).
 * Verification and Rejection routes are strictly restricted to Super Admin.
 */

const express = require("express");
const upload = require("../../middleware/upload");
const requireSuperAdmin = require("../../middleware/requireSuperAdmin");
const requirePermission = require("../../middleware/requirePermission");
const { validate, validateParams } = require("../../middleware/validate");
const {
  submitPaymentSchema,
  rejectPaymentSchema,
  paymentIdParamSchema,
  pharmacyIdParamSchema,
} = require("./commission.validation");
const commissionController = require("./commission.controller");

const router = express.Router();

// 1. Submit a new commission payment proof (accessible to Subadmin & Super Admin)
router.post(
  "/",
  requirePermission("manage_pharmacies", "view_pharmacies", "manage_orders"),
  upload.single("screenshot"),
  commissionController.submitPayment
);

// 2. Get all commission payment records for a specific pharmacy
router.get(
  "/pharmacy/:pharmacyId",
  validateParams(pharmacyIdParamSchema),
  requirePermission("manage_pharmacies", "view_pharmacies", "manage_orders"),
  commissionController.getPharmacyPayments
);

// 3. Get outstanding balance & stats for a pharmacy
router.get(
  "/pharmacy/:pharmacyId/balance",
  validateParams(pharmacyIdParamSchema),
  requirePermission("manage_pharmacies", "view_pharmacies", "manage_orders"),
  commissionController.getPharmacyBalance
);

// 4. Super Admin ONLY: Verify a payment and atomically decrement outstanding balance
router.patch(
  "/:paymentId/verify",
  validateParams(paymentIdParamSchema),
  requireSuperAdmin,
  commissionController.verifyPayment
);

// 5. Super Admin ONLY: Reject a payment submission (requires reason, leaves balance unchanged)
router.patch(
  "/:paymentId/reject",
  validateParams(paymentIdParamSchema),
  requireSuperAdmin,
  validate(rejectPaymentSchema),
  commissionController.rejectPayment
);

// 6. Super Admin & authorized admins: Get paid commission summary & per-branch breakdown with date filters
router.get(
  "/paid-summary",
  requirePermission("manage_pharmacies", "view_pharmacies", "manage_orders", "view_orders"),
  commissionController.getCommissionsPaidSummary
);

module.exports = router;
