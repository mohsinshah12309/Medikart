/**
 * Order validation schemas — Phase 13 (Standard Order Workflow).
 *
 * Per rules.md §2 & §3: explicit allow-list of settable fields per request type.
 *
 * SECURITY: Fields NOT in placeStandardOrderSchema (e.g. price, total, status,
 * paymentState, requiresVerification) are silently stripped by Zod's default
 * behaviour — clients cannot inject server-computed values (OWASP API3 /
 * mass assignment protection). We deliberately do NOT use .strict() here so
 * that a payload containing { price: 1 } is accepted and the price field is
 * simply ignored — the server always uses its own DB-computed value.
 */

const { z } = require('zod');

// POST /api/v1/orders/standard — customer-facing, no auth
const placeStandardOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required').trim(),
    email: z
      .string()
      .email('Valid email address is required')
      .trim()
      .toLowerCase(),
    phone: z.string().min(1, 'Phone number is required').trim(),
    address: z.string().min(1, 'Delivery address is required').trim(),
    city: z.string().min(1, 'City is required').trim(),
  }),
  items: z
    .array(
      z.object({
        productId: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
        quantity: z
          .number({ invalid_type_error: 'Quantity must be a number' })
          .int('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
  paymentMethod: z.literal('cod'),
  otp: z.object({
    email: z
      .string()
      .email('Valid OTP email is required')
      .trim()
      .toLowerCase(),
    code: z
      .string()
      .length(6, 'OTP code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP code must contain digits only'),
  }),
});

// GET /api/v1/admin/orders — admin list with optional filters
const adminOrderQuerySchema = z.object({
  type: z.enum(['standard', 'instant', 'narcotics']).optional(),
  status: z
    .enum(['pending', 'packed', 'shipped', 'delivered', 'cancelled'])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// GET /api/v1/admin/orders/:id
const orderIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format'),
});

module.exports = {
  placeStandardOrderSchema,
  adminOrderQuerySchema,
  orderIdParamsSchema,
};
