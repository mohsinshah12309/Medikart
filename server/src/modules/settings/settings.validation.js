/**
 * Settings validation — Phase 8 (storewide discount) + Phase 24 (page content).
 * Zod strict schemas per rules.md §3: explicit allow-list only.
 */

const { z } = require("zod");

// PUT /api/v1/admin/settings/discount
const storewideDiscountSchema = z
  .object({
    value: z
      .number({ required_error: "Discount value is required" })
      .min(0, "Must be 0–100")
      .max(100, "Must be 0–100"),
    active: z.boolean({ required_error: "active flag is required" }),
  })
  .strict();

// PUT /api/v1/admin/settings/content — Phase 24
// All fields optional so callers can PATCH just what they need.
const pageContentSchema = z
  .object({
    aboutText: z.string().trim().optional(),
    contactEmail: z.string().email("Invalid email format").trim().optional().or(z.literal("")),
    contactPhone: z.string().trim().optional(),
  })
  .strict();

module.exports = { storewideDiscountSchema, pageContentSchema };
