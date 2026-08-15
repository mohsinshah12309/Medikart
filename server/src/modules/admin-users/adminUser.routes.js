/**
 * AdminUser routes — Phase 5.
 *
 * Public routes (no auth required):
 *   POST /api/v1/auth/admin/login
 *
 * This is the ONLY public admin route. All /admin/* routes are protected
 * by the auth middleware (applied in app.js, not here).
 *
 * Per rules.md §2: validation at the route boundary, before the controller.
 */

const express = require("express");
const router = express.Router();

const adminUserController = require("./adminUser.controller");
const { validate } = require("../../middleware/validate");
const { loginSchema } = require("./adminUser.validation");

// POST /api/v1/auth/admin/login — public, no auth middleware
router.post("/login", validate(loginSchema), adminUserController.login);

module.exports = router;
