/**
 * ActivityLog service — Phase 11 (Narcotics Flagging & Audit).
 *
 * Handles writing audit log entries and querying them.
 *
 * NON-BLOCKING GUARANTEE (rules.md / Phase 11 spec):
 * Log writes must NEVER block business logic operations. If an activity log
 * save fails (e.g. database glitch), log the error to server logs and return
 * null without rethrowing.
 */

const ActivityLog = require("./activityLog.model");

/**
 * Creates an activity log entry asynchronously without throwing/blocking.
 *
 * @param {Object} logData
 * @param {Object} logData.actor - req.admin identity
 * @param {String} logData.action - action string (e.g. 'narcotics_flag_added')
 * @param {String} logData.entityType - entity type (e.g. 'product')
 * @param {String} logData.entityId - target entity ID
 * @param {Object} [logData.before] - prior state snapshot
 * @param {Object} [logData.after] - new state snapshot
 */
const logActivity = async ({ actor, action, entityType, entityId, before, after }) => {
  try {
    const entry = await ActivityLog.create({
      actor,
      action,
      entityType,
      entityId,
      before,
      after,
      timestamp: new Date(),
    });
    return entry;
  } catch (error) {
    // Non-blocking log write failure handling: log error server-side only
    console.error("Failed to write ActivityLog entry:", error.message);
    return null;
  }
};

/**
 * Retrieves activity logs, optionally filtered by entityType and entityId.
 *
 * @param {Object} filters
 * @param {String} [filters.entityType]
 * @param {String} [filters.entityId]
 * @param {Number} [filters.page=1]
 * @param {Number} [filters.limit=50]
 */
const getActivityLogs = async ({ entityType, entityId, page = 1, limit = 50 }) => {
  const query = {};

  if (entityType) {
    query.entityType = entityType;
  }
  if (entityId) {
    query.entityId = entityId;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    ActivityLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  logActivity,
  getActivityLogs,
};
