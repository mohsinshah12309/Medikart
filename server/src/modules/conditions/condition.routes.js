const express = require("express");
const router = express.Router();
const conditionController = require("./condition.controller");

// Admin CRUD routes (mounted under /api/v1/admin/conditions)
router.get("/", conditionController.getAdminConditions);
router.post("/", conditionController.createCondition);
router.put("/:id", conditionController.updateCondition);
router.patch("/:id", conditionController.updateCondition);
router.delete("/:id", conditionController.deleteCondition);

module.exports = router;
