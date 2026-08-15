/**
 * OTP Validation Schemas — Phase 12.
 *
 * Route boundary Zod validation for POST /api/v1/otp/request and POST /api/v1/otp/verify.
 */

const { z } = require("zod");

const requestOtpSchema = z
  .object({
    email: z.string().email("Valid email address is required").trim().toLowerCase(),
  })
  .strict();

const verifyOtpSchema = z
  .object({
    email: z.string().email("Valid email address is required").trim().toLowerCase(),
    code: z
      .string()
      .length(6, "OTP code must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP code must contain digits only"),
  })
  .strict();

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
};
