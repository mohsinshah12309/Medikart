/**
 * PasswordReset validation schemas — Phase 6.
 *
 * Zod strict() on both schemas — reject any unexpected fields
 * (OWASP API3 / mass assignment protection).
 */

const { z } = require("zod");

// POST /forgot-password
const forgotPasswordSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
  })
  .strict();

// POST /reset-password
const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: "Reset token is required" })
      .min(1, "Reset token is required"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "Password must be at least 8 characters"),
  })
  .strict();

module.exports = { forgotPasswordSchema, resetPasswordSchema };
