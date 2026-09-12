/**
 * Settings routes — Phase 8 (storewide discount) + Phase 24 (page content).
 */

const express = require("express");
const requirePermission = require("../../middleware/requirePermission");
const router = express.Router();

const settingsController = require("./settings.controller");
const { validate } = require("../../middleware/validate");
const { storewideDiscountSchema, pageContentSchema } = require("./settings.validation");

// GET  /api/v1/admin/settings/discount
router.get("/discount", requirePermission("view_settings", "manage_settings"), settingsController.getStorewideDiscount);

// PUT  /api/v1/admin/settings/discount
router.put("/discount", requirePermission("manage_settings"), validate(storewideDiscountSchema), settingsController.setStorewideDiscount);

// GET  /api/v1/admin/settings/content  — Phase 24 About/Contact page content
router.get("/content", requirePermission("view_settings", "manage_settings"), settingsController.getPageContent);

// PUT  /api/v1/admin/settings/content  — Phase 24 About/Contact page content
router.put("/content", requirePermission("manage_settings"), validate(pageContentSchema), settingsController.setPageContent);

module.exports = router;
