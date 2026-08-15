/**
 * Product validation schemas — Phase 4.
 *
 * Per rules.md Section 2 & 3: explicit allow-list of settable fields per
 * request type. A product update request must only be able to set the fields
 * a product edit is meant to touch — reject or silently ignore anything
 * outside that list (OWASP API3 / mass assignment protection).
 *
 * Zod's .strict() ensures any fields not in the schema are rejected.
 */

const { z } = require("zod");

// Reusable discount schema
const discountSchema = z
  .object({
    type: z.enum(["percentage"]).optional(),
    value: z.number().min(0).max(100).optional(),
    active: z.boolean().optional(),
  })
  .optional();

// Image schema for nested validation
const imageSchema = z.object({
  path: z.string().min(1),
  isPrimary: z.boolean().optional(),
});

// POST /admin/products — create new product
const createProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required").trim(),
    description: z.string().optional().default(""),
    price: z.number().min(0, "Price must be non-negative"),
    sku: z.string().min(1, "SKU is required").trim(),
    categoryIds: z.array(z.string()).optional().default([]),
    isNarcotic: z.boolean().optional().default(false),
    stockStatus: z.enum(["in_stock", "out_of_stock"]).optional(),
    images: z.array(imageSchema).optional().default([]),
    discount: discountSchema,
    active: z.boolean().optional().default(true),
  })
  .strict(); // reject any fields not defined above

// PUT /admin/products/:id — update existing product
// Allow-list: only the fields that should be editable in an update
const updateProductSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    sku: z.string().min(1).trim().optional(),
    categoryIds: z.array(z.string()).optional(),
    isNarcotic: z.boolean().optional(),
    stockStatus: z.enum(["in_stock", "out_of_stock"]).optional(),
    images: z.array(imageSchema).optional(),
    discount: discountSchema,
    active: z.boolean().optional(),
  })
  .strict() // reject any unrecognized fields (e.g., 'role')
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// GET /admin/products/:id — validate MongoDB ObjectId
const productIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
};
