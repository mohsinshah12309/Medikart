const express = require("express");
const requirePermission = require("../../middleware/requirePermission");
const router = express.Router();
const pharmacyController = require("./pharmacy.controller");

// Admin routes (mounted under /api/v1/admin/pharmacies)
router.get("/reports", requirePermission("view_pharmacies", "manage_pharmacies"), pharmacyController.getPharmacyReports);
router.get("/", requirePermission("view_pharmacies", "manage_pharmacies"), pharmacyController.getPharmacies);
router.get("/:id", requirePermission("view_pharmacies", "manage_pharmacies"), pharmacyController.getPharmacyById);
router.post("/", requirePermission("manage_pharmacies"), pharmacyController.createPharmacy);
router.put("/:id", requirePermission("manage_pharmacies"), pharmacyController.updatePharmacy);
router.patch("/:id", requirePermission("manage_pharmacies"), pharmacyController.updatePharmacy);
router.delete("/:id", requirePermission("manage_pharmacies"), pharmacyController.deletePharmacy);

module.exports = router;
