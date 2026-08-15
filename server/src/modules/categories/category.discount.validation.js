/**
 * Category discount validation schema — Phase 8.
 */

const { z } = require("zod");

// PATCH /api/v1/admin/categories/:id/discount
const categoryDiscountSchema = z
  .object({
    value: z.number().min(0).max(100).nullable(),
    active: z.boolean(),
  })
  .strict();

const { categoryIdSchema } = require("./category.validation");

module.exports = { categoryDiscountSchema, categoryIdSchema };
