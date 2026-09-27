const express = require("express");
const router = express.Router();
const customerController = require("./customer.controller");
const { validate } = require("../../middleware/validate");
const customerAuth = require("../../middleware/customerAuth");
const { createRateLimiter } = require("../../middleware/rateLimiter");
const {
  signupSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./customer.validation");

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Account Creation Rate Limiter (Max 5 signups / hr in production to prevent bot accounts)
const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 5 : (isDev ? 100 : 5),
  message: "Too many account creation attempts. Please wait an hour before creating another account.",
});

// Customer Login & Auth Limiter (Max 10 attempts / 15 min in production to stop brute force)
const customerLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 5 : (isDev ? 100 : 10),
  message: "Too many login attempts. Please try again in 15 minutes.",
});

router.post("/signup", signupLimiter, validate(signupSchema), customerController.signup);
router.post("/verify-email", customerLoginLimiter, validate(verifyEmailSchema), customerController.verifyEmail);
router.post("/resend-verification", customerLoginLimiter, validate(resendVerificationSchema), customerController.resendVerification);
router.post("/login", customerLoginLimiter, validate(loginSchema), customerController.login);
router.post("/forgot-password", customerLoginLimiter, validate(forgotPasswordSchema), customerController.forgotPassword);
router.post("/reset-password", customerLoginLimiter, validate(resetPasswordSchema), customerController.resetPassword);

// Authenticated customer routes
router.get("/me", customerAuth, customerController.getProfile);

module.exports = router;
