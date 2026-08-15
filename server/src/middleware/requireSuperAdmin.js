/**
 * requireSuperAdmin middleware — Phase 5.
 *
 * Checks that the authenticated user (set by auth.js) has the "super_admin"
 * role. Must be used AFTER the auth middleware — it assumes req.admin exists.
 *
 * Phase 20 will be the first real consumer of this middleware (create/delete
 * other admins). It is built here so the pattern is established and it becomes
 * a true drop-in for Phase 20 with no rework needed.
 *
 * Usage in routes (after auth middleware):
 *   router.post("/admins", auth, requireSuperAdmin, adminController.create);
 */

const { ForbiddenError } = require("../utils/errors");

const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== "super_admin") {
    return next(
      new ForbiddenError("This action requires Super Admin privileges")
    );
  }
  next();
};

module.exports = requireSuperAdmin;
