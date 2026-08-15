/**
 * Settings routes — Phase 8 (minimal — storewide discount only).
 * Phase 24 will extend this file with more settings endpoints.
 */

const express = require("express");
const router = express.Router();

const settingsController = require("./settings.controller");
const { validate } = require("../../middleware/validate");
const { storewideDiscountSchema } = require("./settings.validation");

// GET  /api/v1/admin/settings/discount
router.get("/discount", settingsController.getStorewideDiscount);

// PUT  /api/v1/admin/settings/discount
router.put("/discount", validate(storewideDiscountSchema), settingsController.setStorewideDiscount);

module.exports = router;
