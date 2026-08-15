/**
 * City validation schemas — Phase 7.
 *
 * Per rules.md §3: explicit allow-list only (OWASP API3 mass-assignment).
 * Zod .strict() rejects any field not in the schema.
 *
 * CRITICAL DESIGN NOTE (FR-CW-11):
 *   `deliveryCharge` is a property you SET when creating/updating a city via
 *   the admin CRUD. It is NEVER a field accepted from a customer-facing request.
 *   The customer-facing delivery charge is always computed server-side by
 *   city.service.getDeliveryCharge(cityName) — that function takes only a city
 *   name and returns the charge from the DB. No caller can pass a charge in.
 *
 * Allow-list for create: name, deliveryCharge, active
 * Allow-list for update:  name, deliveryCharge, active  (all optional)
 */

const { z } = require("zod");

// POST /api/v1/admin/cities
const createCitySchema = z
  .object({
    name: z
      .string({ required_error: "City name is required" })
      .min(1, "City name is required")
      .trim(),
    deliveryCharge: z
      .number({ required_error: "Delivery charge is required" })
      .min(0, "Delivery charge must be non-negative"),
    active: z.boolean().optional().default(true),
  })
  .strict();

// PUT /api/v1/admin/cities/:id
const updateCitySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    deliveryCharge: z.number().min(0).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// GET/PUT/DELETE /api/v1/admin/cities/:id
const cityIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid city ID format"),
});

module.exports = { createCitySchema, updateCitySchema, cityIdSchema };
