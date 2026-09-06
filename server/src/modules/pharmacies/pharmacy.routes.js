const express = require("express");
const router = express.Router();
const pharmacyController = require("./pharmacy.controller");

// Admin routes (mounted under /api/v1/admin/pharmacies)
router.get("/reports", pharmacyController.getPharmacyReports);
router.get("/", pharmacyController.getPharmacies);
router.get("/:id", pharmacyController.getPharmacyById);
router.post("/", pharmacyController.createPharmacy);
router.put("/:id", pharmacyController.updatePharmacy);
router.patch("/:id", pharmacyController.updatePharmacy);
router.delete("/:id", pharmacyController.deletePharmacy);

module.exports = router;
