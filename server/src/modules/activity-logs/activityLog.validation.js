/**
 * ActivityLog validation — Phase 11.
 *
 * Route-boundary Zod validation for activity log queries.
 */

const { z } = require("zod");

const getActivityLogsQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "entityId must be a valid 24-character hex Mongo ID")
    .optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

module.exports = {
  getActivityLogsQuerySchema,
};
