/**
 * Monthly Refill Validation Schemas Proxy — Integrates canonical validators.
 */

const {
  createRefillSchema,
  updateRefillSchema,
  refillQuerySchema,
  refillParamIdSchema,
  refillItemInputSchema,
  objectIdSchema,
} = require("../../validators/monthlyRefill.validator");

const { z } = require("zod");

const reorderRefillSchema = z.object({
  address: z.string().trim().min(3, "Address must be at least 3 characters").optional(),
  city: z.string().trim().min(2, "City must be at least 2 characters").optional(),
  phone: z.string().trim().min(7, "Phone number must be at least 7 characters").optional(),
  paymentMethod: z.enum(["cod", "card"]).default("cod"),
});

module.exports = {
  createRefillSchema,
  updateRefillSchema,
  refillQuerySchema,
  refillParamIdSchema,
  refillItemInputSchema,
  objectIdSchema,
  // Backward compatibility aliases
  addRefillItemSchema: createRefillSchema,
  updateRefillItemSchema: updateRefillSchema,
  refillItemIdParamSchema: refillParamIdSchema,
  reorderRefillSchema,
};
