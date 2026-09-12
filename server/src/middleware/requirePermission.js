/**
 * requirePermission middleware — RBAC permission check.
 *
 * Checks that the authenticated admin user (set by auth.js) has at least
 * one of the required permissions, or has the "super_admin" role.
 * Must be used AFTER auth middleware.
 *
 * Usage in routes:
 *   router.get("/", requirePermission("view_products", "manage_products"), controller.getAll);
 *   router.post("/", requirePermission("manage_products"), controller.create);
 */

const { ForbiddenError } = require("../utils/errors");

const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new ForbiddenError("Authentication required"));
    }

    // Super Admin has unrestricted access to all resources
    if (req.admin.role === "super_admin") {
      return next();
    }

    const userPermissions = Array.isArray(req.admin.permissions)
      ? req.admin.permissions
      : [];

    // Check if the user has any of the acceptable permissions
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          "Access denied: You do not have permission to access this resource or perform this action."
        )
      );
    }

    next();
  };
};

module.exports = requirePermission;
