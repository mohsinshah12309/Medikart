/**
 * AdminUserManagement routes — Phase 20.
 *
 * All routes here are protected with requireSuperAdmin middleware at mount point in app.js.
 */

const express = require("express");
const router = express.Router();

const adminUserController = require("./adminUser.controller");
const {
  validate,
  validateParams,
} = require("../../middleware/validate");
const {
  createAdminUserSchema,
  updateAdminUserSchema,
  adminUserIdParamsSchema,
} = require("./adminUser.validation");

// GET /api/v1/admin/users — list all admin users
router.get("/", adminUserController.getAdminUsers);

// POST /api/v1/admin/users — create a new admin user
router.post("/", validate(createAdminUserSchema), adminUserController.createAdminUser);

// PUT /api/v1/admin/users/:id — update an admin user
router.put(
  "/:id",
  validateParams(adminUserIdParamsSchema),
  validate(updateAdminUserSchema),
  adminUserController.updateAdminUser
);

// DELETE /api/v1/admin/users/:id — delete an admin user
router.delete(
  "/:id",
  validateParams(adminUserIdParamsSchema),
  adminUserController.deleteAdminUser
);

module.exports = router;
