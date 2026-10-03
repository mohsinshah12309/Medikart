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
    name: z.string().min(1, "Product name is required").max(500, "Product name cannot exceed 500 characters").trim(),
    genericName: z.string().max(500).optional().default(""),
    description: z.string().max(50000).optional().default(""),
    keywords: z.array(z.string().max(100)).optional().default([]),
    tags: z.array(z.string().max(100)).optional().default([]),
    price: z.number().min(0, "Price must be non-negative").max(10000000, "Price cannot exceed 10,000,000"),
    sku: z.string().min(1, "SKU is required").max(100, "SKU cannot exceed 100 characters").trim(),
    categoryIds: z.array(z.string()).optional().default([]),
    isNarcotic: z.boolean().optional().default(false),
    requiresPrescription: z.boolean().optional().default(false),
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
    name: z.string().min(1).max(500).trim().optional(),
    genericName: z.string().max(500).optional(),
    description: z.string().max(50000).optional(),
    keywords: z.array(z.string().max(100)).optional(),
    tags: z.array(z.string().max(100)).optional(),
    price: z.number().min(0).max(10000000).optional(),
    sku: z.string().min(1).max(100).trim().optional(),
    categoryIds: z.array(z.string()).optional(),
    isNarcotic: z.boolean().optional(),
    requiresPrescription: z.boolean().optional(),
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

// Routes with both product id and imageId
const productImageParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
  imageId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid image ID format"),
});

// Phase 11 — Single product narcotics flag update schema
const narcoticToggleSchema = z
  .object({
    isNarcotic: z.boolean({ required_error: "isNarcotic boolean is required" }),
  })
  .strict();

// Phase 11 — Bulk narcotics flag update schema (OWASP API4 max batch size enforced)
const bulkNarcoticsSchema = z
  .object({
    productIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"))
      .min(1, "At least one product ID is required")
      .max(100, "Maximum batch size is 100 products per request"),
    isNarcotic: z.boolean({ required_error: "isNarcotic boolean is required" }),
  })
  .strict();

// GET /admin/products query schema (Phase 22 / Step 13)
const listProductsQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  isNarcotic: z.enum(["true", "false"]).optional(),
  stockStatus: z.enum(["in_stock", "out_of_stock"]).optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format").optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").optional().default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").optional().default(50),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productImageParamsSchema,
  narcoticToggleSchema,
  bulkNarcoticsSchema,
  listProductsQuerySchema,
};

