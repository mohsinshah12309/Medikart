const express = require("express");
const requirePermission = require("../../middleware/requirePermission");
const router = express.Router();
const conditionController = require("./condition.controller");

// Admin CRUD routes (mounted under /api/v1/admin/conditions)
router.get("/", requirePermission("view_conditions", "manage_conditions"), conditionController.getAdminConditions);
router.post("/", requirePermission("manage_conditions"), conditionController.createCondition);
router.put("/:id", requirePermission("manage_conditions"), conditionController.updateCondition);
router.patch("/:id", conditionController.updateCondition);
router.delete("/:id", requirePermission("manage_conditions"), conditionController.deleteCondition);

module.exports = router;
