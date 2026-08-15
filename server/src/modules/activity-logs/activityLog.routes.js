/**
 * ActivityLog routes — Phase 11.
 *
 * GET /api/v1/admin/activity-logs — list logs, filterable by entityType and entityId.
 */

const express = require("express");
const router = express.Router();

const activityLogController = require("./activityLog.controller");
const { validateQuery } = require("../../middleware/validate");
const { getActivityLogsQuerySchema } = require("./activityLog.validation");

// GET /admin/activity-logs — list logs (filterable)
router.get(
  "/",
  validateQuery(getActivityLogsQuerySchema),
  activityLogController.getActivityLogs
);

module.exports = router;
