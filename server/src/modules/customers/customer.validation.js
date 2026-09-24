/**
 * Customer validation schemas.
 *
 * Enforces strong password rules and input sanitization for customer authentication
 * and wishlist management.
 */

const { z } = require("zod");

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters").trim(),
    email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
    password: passwordRule,
    phone: z.string().trim().optional().default(""),
    overrideSuggestion: z.boolean().optional(),
  })
  .strict();

const verifyEmailSchema = z
  .object({
    email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
    code: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
  })
  .strict();

const resendVerificationSchema = z
  .object({
    email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
    overrideSuggestion: z.boolean().optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email: z.string().email("Please provide a valid email address").trim().toLowerCase(),
  })
  .strict();

const resetPasswordSchema = z
  .object({
    token: z.string().regex(/^[0-9a-fA-F]{64}$/, "This password reset link is invalid or has expired. Please request a new one."),
    password: passwordRule,
  })
  .strict();

const wishlistParamSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
});

module.exports = {
  signupSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  wishlistParamSchema,
};
