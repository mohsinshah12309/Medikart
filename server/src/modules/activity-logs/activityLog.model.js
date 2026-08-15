/**
 * ActivityLog model — Phase 11 (Narcotics Flagging & Audit).
 *
 * Stores audit log entries for sensitive admin actions such as changing
 * narcotics flags, admin role updates, etc.
 *
 * Schema fields per FR-AD-15 / NFR-COMP-02:
 * - actor: Object containing admin details ({ id, email, role })
 * - action: String (e.g. 'narcotics_flag_added', 'narcotics_flag_removed')
 * - entityType: String (e.g. 'product')
 * - entityId: ObjectId / String
 * - before: Mixed (state before change, e.g. { isNarcotic: false })
 * - after: Mixed (state after change, e.g. { isNarcotic: true })
 * - timestamp: Date (default Date.now)
 */

const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Index for efficient filtering by entityType and entityId (FR-AD-15)
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
