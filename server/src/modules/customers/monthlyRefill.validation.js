/**
 * Monthly Refill Validation Schemas (Zod).
 */

const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const singleItemSchema = z.object({
  productId: z
    .string({ required_error: "Product ID is required" })
    .regex(objectIdRegex, "Product ID must be a valid 24-character hexadecimal ObjectId"),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .positive("Quantity must be a positive integer (at least 1)")
    .default(1),
});

const addRefillItemSchema = z.union([
  singleItemSchema,
  z.object({
    items: z
      .array(singleItemSchema)
      .min(1, "At least one item must be provided"),
  }),
]);

const updateRefillItemSchema = z.object({
  quantity: z
    .number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .positive("Quantity must be a positive integer (at least 1)"),
});

const refillItemIdParamSchema = z.object({
  itemId: z
    .string({ required_error: "Item ID is required" })
    .regex(objectIdRegex, "Item ID must be a valid 24-character hexadecimal ObjectId"),
});

const reorderRefillSchema = z.object({
  address: z.string().trim().min(3, "Address must be at least 3 characters").optional(),
  city: z.string().trim().min(2, "City must be at least 2 characters").optional(),
  phone: z.string().trim().min(7, "Phone number must be at least 7 characters").optional(),
  paymentMethod: z.enum(["cod", "card"]).default("cod"),
});

module.exports = {
  addRefillItemSchema,
  updateRefillItemSchema,
  refillItemIdParamSchema,
  reorderRefillSchema,
};
