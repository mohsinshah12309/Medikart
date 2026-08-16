/**
 * Order validation schemas — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Per rules.md §2 & §3: explicit allow-list of settable fields per request type.
 *
 * SECURITY: Fields NOT in these schemas (e.g. price, total, status,
 * paymentState, requiresVerification) are silently stripped by Zod's default
 * behaviour — clients cannot inject server-computed values (OWASP API3 /
 * mass assignment protection). We deliberately do NOT use .strict() here so
 * that a payload containing { price: 1 } is accepted and the price field is
 * simply ignored — the server always uses its own DB-computed value.
 */

const { z } = require("zod");

// POST /api/v1/orders/standard — customer-facing, no auth
const placeStandardOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required").trim(),
    email: z
      .string()
      .email("Valid email address is required")
      .trim()
      .toLowerCase(),
    phone: z.string().min(1, "Phone number is required").trim(),
    address: z.string().min(1, "Delivery address is required").trim(),
    city: z.string().min(1, "City is required").trim(),
  }),
  items: z
    .array(
      z.object({
        productId: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
        quantity: z
          .number({ invalid_type_error: "Quantity must be a number" })
          .int("Quantity must be a whole number")
          .min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "At least one item is required"),
  paymentMethod: z.literal("cod"),
  otp: z.object({
    email: z.string().email("Valid OTP email is required").trim().toLowerCase(),
    code: z
      .string()
      .length(6, "OTP code must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP code must contain digits only"),
  }),
});

// POST /api/v1/orders/instant — customer-facing, no auth, multipart/form-data
// Note: Validated manually in controller after multer processes the file
const placeInstantOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required").trim(),
    email: z
      .string()
      .email("Valid email address is required")
      .trim()
      .toLowerCase(),
    phone: z.string().min(1, "Phone number is required").trim(),
    address: z.string().min(1, "Delivery address is required").trim(),
    city: z.string().min(1, "City is required").trim(),
  }),
  paymentMethod: z.literal("cod"),
  otp: z.object({
    email: z.string().email("Valid OTP email is required").trim().toLowerCase(),
    code: z
      .string()
      .length(6, "OTP code must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP code must contain digits only"),
  }),
  branchDescription: z.string().optional(),
});

// PATCH /api/v1/admin/orders/:id/items — admin pricing endpoint (Phase 14 / FR-AD-19)
// SECURITY: Only items array is writable — totals computed server-side
const priceInstantOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
        quantity: z
          .number({ invalid_type_error: "Quantity must be a number" })
          .int("Quantity must be a whole number")
          .min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "At least one item is required"),
});

// PATCH /api/v1/admin/orders/:id/verification — admin approve/reject for
// narcotics prescription review (Phase 15 / FR-AD-20).
// SECURITY allow-list: only `decision` is writable. `reviewedBy`/`reviewedAt`
// are always server-set from req.admin — a client can never inject them.
const narcoticsVerificationSchema = z.object({
  decision: z.enum(["approved", "rejected"], {
    invalid_type_error: 'Decision must be "approved" or "rejected"',
  }),
});

// GET /api/v1/admin/orders — admin list with optional filters
const adminOrderQuerySchema = z.object({
  type: z.enum(["standard", "instant", "narcotics"]).optional(),
  status: z
    .enum([
      "awaiting-pharmacist-pricing",
      "pending",
      "pending_verification",
      "packed",
      "shipped",
      "delivered",
      "rejected",
      "cancelled",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// GET /api/v1/admin/orders/:id
const orderIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID format"),
});

module.exports = {
  placeStandardOrderSchema,
  placeInstantOrderSchema,
  priceInstantOrderSchema,
  narcoticsVerificationSchema,
  adminOrderQuerySchema,
  orderIdParamsSchema,
};
