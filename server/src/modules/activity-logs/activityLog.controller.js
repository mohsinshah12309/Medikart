/**
 * ActivityLog controller — Phase 11.
 *
 * Controllers stay thin per rules.md Section 2: read request, call service, shape response.
 */

const activityLogService = require("./activityLog.service");

const getActivityLogs = async (req, res, next) => {
  try {
    const { entityType, entityId, page, limit } = req.query;
    const result = await activityLogService.getActivityLogs({
      entityType,
      entityId,
      page,
      limit,
    });

    res.status(200).json({
      status: "success",
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
};
