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

module.exports = { loginSchema };
