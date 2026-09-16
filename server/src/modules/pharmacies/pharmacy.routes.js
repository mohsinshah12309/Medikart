const express = require("express");
const requirePermission = require("../../middleware/requirePermission");
const requireSuperAdmin = require("../../middleware/requireSuperAdmin");
const { validate, validateParams } = require("../../middleware/validate");
const {
  createPharmacySchema,
  updatePharmacySchema,
  pharmacyIdParamSchema,
} = require("./pharmacy.validation");
const router = express.Router();
const pharmacyController = require("./pharmacy.controller");

// Admin routes (mounted under /api/v1/admin/pharmacies)
router.get(
  "/reports",
  requirePermission("view_pharmacies", "manage_pharmacies", "view_orders", "manage_orders"),
  pharmacyController.getPharmacyReports
);

router.get(
  "/",
  requirePermission("view_pharmacies", "manage_pharmacies", "view_orders", "manage_orders"),
  pharmacyController.getPharmacies
);

// Super Admin ONLY: Reveal encrypted bank account number
router.get(
  "/:id/reveal-account",
  validateParams(pharmacyIdParamSchema),
  requireSuperAdmin,
  pharmacyController.revealAccountNumber
);

router.get(
  "/:id",
  validateParams(pharmacyIdParamSchema),
  requirePermission("view_pharmacies", "manage_pharmacies", "view_orders", "manage_orders"),
  pharmacyController.getPharmacyById
);

router.post(
  "/",
  requirePermission("manage_pharmacies"),
  validate(createPharmacySchema),
  pharmacyController.createPharmacy
);

router.put(
  "/:id",
  validateParams(pharmacyIdParamSchema),
  requirePermission("manage_pharmacies"),
  validate(updatePharmacySchema),
  pharmacyController.updatePharmacy
);

router.patch(
  "/:id",
  validateParams(pharmacyIdParamSchema),
  requirePermission("manage_pharmacies"),
  validate(updatePharmacySchema),
  pharmacyController.updatePharmacy
);

router.delete(
  "/:id",
  validateParams(pharmacyIdParamSchema),
  requirePermission("manage_pharmacies"),
  pharmacyController.deletePharmacy
);

module.exports = router;
