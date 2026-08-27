/**
 * AdminUser validation schemas — Phase 5.
 *
 * Per rules.md §3: explicit allow-list only, Zod strict() to reject any
 * unexpected fields (OWASP API3 / mass-assignment protection).
 *
 * Only the login schema is needed in this phase. Create/update schemas come
 * in Phase 20 (Admin Account Management).
 */

const { z } = require("zod");

// POST /api/v1/auth/admin/login
const loginSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  })
  .strict(); // reject any extra fields

// POST /api/v1/admin/users
const createAdminUserSchema = z
  .object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required").trim(),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
    role: z.enum(["super_admin", "admin"], {
      invalid_type_error: "Role must be super_admin or admin",
    }).default("admin"),
    permissions: z.array(z.string()).default([]),
  })
  .strict();

// PUT /api/v1/admin/users/:id
const updateAdminUserSchema = z
  .object({
    name: z.string().min(1, "Name must not be empty").trim().optional(),
    email: z.string().email("Invalid email format").toLowerCase().trim().optional(),
    role: z.enum(["super_admin", "admin"]).optional(),
    permissions: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  })
  .strict();

// URL parameter validation for admin user ID
const adminUserIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid admin user ID format"),
});

const verify2FASchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits"),
  tempToken: z.string().min(1, "tempToken is required"),
}).strict();

const confirm2FASchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits"),
  setupToken: z.string().min(1, "setupToken is required"),
}).strict();

const disable2FASchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits"),
}).strict();

module.exports = {
  loginSchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  adminUserIdParamsSchema,
  verify2FASchema,
  confirm2FASchema,
  disable2FASchema,
};
