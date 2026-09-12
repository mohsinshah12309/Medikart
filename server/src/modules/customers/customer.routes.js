/**
 * Customer Authentication Routes.
 */

const express = require("express");
const router = express.Router();
const customerController = require("./customer.controller");
const { validate } = require("../../middleware/validate");
const customerAuth = require("../../middleware/customerAuth");
const {
  signupSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./customer.validation");

router.post("/signup", validate(signupSchema), customerController.signup);
router.post("/verify-email", validate(verifyEmailSchema), customerController.verifyEmail);
router.post("/resend-verification", validate(resendVerificationSchema), customerController.resendVerification);
router.post("/login", validate(loginSchema), customerController.login);
router.post("/forgot-password", validate(forgotPasswordSchema), customerController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), customerController.resetPassword);

// Authenticated customer routes
router.get("/me", customerAuth, customerController.getProfile);

module.exports = router;
