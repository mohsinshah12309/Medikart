/**
 * Prescription validation schemas — Fix 1 (Prescription Access Control).
 *
 * The filename is validated strictly to prevent path traversal — only
 * alphanumerics, dots, underscores, and hyphens are allowed. No slashes,
 * no backslashes, no ".." sequences.
 */

const { z } = require("zod");

// GET /api/v1/admin/prescriptions/:filename
const prescriptionFilenameSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, "Invalid filename format"),
});

module.exports = { prescriptionFilenameSchema };
