/**
 * AdminUser routes — Phase 5 & 6.
 *
 * All routes here are PUBLIC (no auth middleware) — they are mounted at
 * /api/v1/auth/admin in app.js, BEFORE the auth middleware that protects
 * all /api/v1/admin/* routes.
 *
 * Public routes:
 *   POST /login           — Phase 5: issue JWT
 *   POST /forgot-password — Phase 6: request a reset link
 *   POST /reset-password  — Phase 6: consume token, set new password
 *
 * Per rules.md §2: validation at the route boundary, before the controller.
 */

const express = require("express");
const router = express.Router();

const adminUserController = require("./adminUser.controller");
const passwordResetController = require("./passwordReset.controller");
const { validate } = require("../../middleware/validate");
const { loginSchema } = require("./adminUser.validation");
const {
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./passwordReset.validation");

// POST /api/v1/auth/admin/login — Phase 5
router.post("/login", validate(loginSchema), adminUserController.login);

// POST /api/v1/auth/admin/forgot-password — Phase 6
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  passwordResetController.forgotPassword
);

// POST /api/v1/auth/admin/reset-password — Phase 6
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  passwordResetController.resetPassword
);

module.exports = router;

