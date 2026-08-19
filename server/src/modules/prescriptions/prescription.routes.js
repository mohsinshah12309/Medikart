/**
 * Prescription routes — Fix 1 (Prescription Access Control).
 *
 * GET /api/v1/admin/prescriptions/:filename
 *
 * Mounted under /api/v1/admin in app.js, so the auth middleware is applied
 * automatically. The controller performs the object-level check (filename
 * must belong to a real order).
 */

const express = require("express");
const router = express.Router();

const prescriptionController = require("./prescription.controller");
const { validateParams } = require("../../middleware/validate");
const { prescriptionFilenameSchema } = require("./prescription.validation");

// GET /admin/prescriptions/:filename — authenticated, object-level checked
router.get(
  "/:filename",
  validateParams(prescriptionFilenameSchema),
  prescriptionController.getPrescription,
);

module.exports = router;
