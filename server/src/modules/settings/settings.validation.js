/**
 * Settings validation — Phase 8.
 * Zod strict: only discount fields accepted on this endpoint.
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

module.exports = { storewideDiscountSchema };
