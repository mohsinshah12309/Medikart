/**
 * Category validation schemas — Phase 4.
 *
 * Per rules.md Section 2 & 3: explicit allow-list of settable fields per
 * request type. Mass assignment protection via Zod's .strict() mode.
 */

const { z } = require("zod");

// Reusable discount schema
const discountSchema = z
  .object({
    value: z.number().min(0).max(100).optional(),
    active: z.boolean().optional(),
  })
  .optional();

// POST /admin/categories — create new category
const createCategorySchema = z
  .object({
    name: z.string().min(1, "Category name is required").trim(),
    slug: z
      .string()
      .min(1, "Slug is required")
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase alphanumeric with hyphens only"
      ),
    isNarcotic: z.boolean().optional().default(false),
    discount: discountSchema,
    active: z.boolean().optional().default(true),
  })
  .strict(); // reject any fields not defined above

// PUT /admin/categories/:id — update existing category
const updateCategorySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    slug: z
      .string()
      .min(1)
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase alphanumeric with hyphens only"
      )
      .optional(),
    isNarcotic: z.boolean().optional(),
    discount: discountSchema,
    active: z.boolean().optional(),
  })
  .strict() // reject any unrecognized fields
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// GET /admin/categories/:id — validate MongoDB ObjectId
const categoryIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
};
