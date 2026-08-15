/**
 * Product discount validation schema — Phase 8.
 * Strict: only the discount sub-document fields can be patched.
 */

const { z } = require("zod");

// PATCH /api/v1/admin/products/:id/discount
const productDiscountSchema = z
  .object({
    value: z.number().min(0).max(100).nullable(),  // null = clear the discount
    active: z.boolean(),
  })
  .strict();

// Reuse existing productIdSchema for param validation
const { productIdSchema } = require("./product.validation");

module.exports = { productDiscountSchema, productIdSchema };
