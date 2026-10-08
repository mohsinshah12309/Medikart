/**
 * Monthly Refill Zod Validation Schemas — Ingress Security Layer.
 *
 * Implements strict runtime validation against OWASP A03 (Injection) and
 * A08 (Software and Data Integrity Failures).
 */

const { z } = require("zod");

// Strict MongoDB 24-character hexadecimal ObjectID regex
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string({ required_error: "ID is required" })
  .trim()
  .regex(OBJECT_ID_REGEX, "Invalid MongoDB ObjectId format");

// Sanitized custom notes preventing HTML/script injections
const sanitizedNotesSchema = z
  .string()
  .trim()
  .max(200, "Notes cannot exceed 200 characters")
  .transform((val) =>
    val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim()
  )
  .optional();

// Single refill item schema
const refillItemInputSchema = z
  .object({
    product: objectIdSchema.optional(),
    productId: objectIdSchema.optional(), // Allow productId alias
    variantId: z.string().trim().max(100).nullable().optional(),
    quantity: z
      .number({ invalid_type_error: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1")
      .max(20, "Quantity cannot exceed 20 per item")
      .default(1),
    unitPriceAtAddition: z
      .number({ invalid_type_error: "Unit price must be a number" })
      .min(0, "Unit price must be non-negative")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Boolean(data.product || data.productId),
    {
      message: "Each item must have a valid product or productId reference",
      path: ["product"],
    }
  )
  .transform((data) => ({
    product: data.product || data.productId,
    variantId: data.variantId || null,
    quantity: data.quantity,
    unitPriceAtAddition: data.unitPriceAtAddition,
  }));

/**
 * 1. createRefillSchema
 * Validates array of items, frequencyDays (15, 30, 45, 60), and optional customNotes.
 * Also normalizes single-item payloads { productId, quantity } into items array.
 */
const createRefillSchema = z
  .object({
    items: z
      .array(refillItemInputSchema)
      .min(1, "At least one item is required in the monthly refill list")
      .max(25, "Cannot exceed 25 items in a single monthly refill list")
      .optional(),
    // Allow single item payload shorthand for quick-add buttons
    product: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
    quantity: z.number().int().min(1).max(20).optional(),
    variantId: z.string().trim().max(100).nullable().optional(),

    frequencyDays: z
      .union([
        z.literal(15),
        z.literal(30),
        z.literal(45),
        z.literal(60),
      ])
      .default(30),
    customNotes: sanitizedNotesSchema,
  })
  .strict()
  .refine(
    (data) => Boolean(data.items && data.items.length > 0) || Boolean(data.product || data.productId),
    {
      message: "Either an items array or a single product/productId must be provided",
      path: ["items"],
    }
  )
  .transform((data) => {
    let normalizedItems = data.items || [];
    if (normalizedItems.length === 0 && (data.product || data.productId)) {
      normalizedItems = [
        {
          product: data.product || data.productId,
          variantId: data.variantId || null,
          quantity: data.quantity || 1,
          unitPriceAtAddition: undefined,
        },
      ];
    }
    return {
      items: normalizedItems,
      frequencyDays: data.frequencyDays || 30,
      customNotes: data.customNotes || "",
    };
  });

/**
 * 2. updateRefillSchema
 * Supports updating status, frequencyDays, items, and customNotes.
 */
const updateRefillSchema = z
  .object({
    status: z.enum(["active", "paused", "cancelled"]).optional(),
    frequencyDays: z
      .union([
        z.literal(15),
        z.literal(30),
        z.literal(45),
        z.literal(60),
      ])
      .optional(),
    items: z
      .array(refillItemInputSchema)
      .min(1, "Items array must contain at least one product")
      .max(25, "Cannot exceed 25 items in a refill list")
      .optional(),
    // Allow single item quantity updates
    quantity: z.number().int().min(1).max(100).optional(),
    customNotes: sanitizedNotesSchema,
  })
  .strict();

/**
 * 3. refillQuerySchema
 * Validates pagination, status filtering, and defends against prototype pollution.
 */
const refillQuerySchema = z
  .object({
    page: z
      .preprocess((val) => (val === undefined ? 1 : Number(val)), z.number().int().min(1))
      .default(1),
    limit: z
      .preprocess((val) => (val === undefined ? 10 : Number(val)), z.number().int().min(1).max(50))
      .default(10),
    status: z.enum(["active", "paused", "cancelled"]).optional(),
    sort: z
      .enum(["createdAt", "-createdAt", "nextReminderDate", "-nextReminderDate"])
      .default("-createdAt"),
  })
  .strict()
  .refine((data) => {
    // Prototype pollution prevention
    const forbiddenKeys = ["__proto__", "constructor", "prototype"];
    return !Object.keys(data).some((key) => forbiddenKeys.includes(key));
  }, {
    message: "Illegal query parameter detected",
  });

/**
 * 4. refillParamIdSchema
 * Validates route parameters (/api/v1/customer/monthly-refill/:id)
 */
const refillParamIdSchema = z
  .object({
    id: objectIdSchema.optional(),
    itemId: objectIdSchema.optional(),
  })
  .refine((params) => Boolean(params.id || params.itemId), {
    message: "A valid 24-character hexadecimal ID parameter is required",
  });

module.exports = {
  createRefillSchema,
  updateRefillSchema,
  refillQuerySchema,
  refillParamIdSchema,
  refillItemInputSchema,
  objectIdSchema,
};
