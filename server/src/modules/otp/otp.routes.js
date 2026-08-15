/**
 * OTP Routes — Phase 12.
 *
 * Public routes:
 * POST /api/v1/otp/request
 * POST /api/v1/otp/verify
 */

const express = require("express");
const router = express.Router();

const otpController = require("./otp.controller");
const { validate } = require("../../middleware/validate");
const { requestOtpSchema, verifyOtpSchema } = require("./otp.validation");

// POST /api/v1/otp/request — public endpoint to request an OTP code
router.post("/request", validate(requestOtpSchema), otpController.requestOtp);

// POST /api/v1/otp/verify — public endpoint to verify an OTP code
router.post("/verify", validate(verifyOtpSchema), otpController.verifyOtp);

module.exports = router;
