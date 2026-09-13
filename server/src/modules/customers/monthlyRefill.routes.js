/**
 * Monthly Refill Routes — Customer-Scoped Endpoints.
 *
 * All routes are protected by customerAuth middleware.
 */

const express = require("express");
const router = express.Router();
const monthlyRefillController = require("./monthlyRefill.controller");
const customerAuth = require("../../middleware/customerAuth");
const { validate, validateParams } = require("../../middleware/validate");
const {
  addRefillItemSchema,
  updateRefillItemSchema,
  refillItemIdParamSchema,
  reorderRefillSchema,
} = require("./monthlyRefill.validation");

// Enforce customer authentication on all refill routes
router.use(customerAuth);

// 1. GET / - Return only req.customer.id's own list
router.get("/", monthlyRefillController.getRefillList);

// 2. POST / - Add product(s); create list doc on first use
router.post("/", validate(addRefillItemSchema), monthlyRefillController.addItem);

// 3. DELETE / - Clear entire list
router.delete("/", monthlyRefillController.clearRefillList);

// 4. POST /reorder - Build a new Order from current items, set 30-day reminder cycle
router.post("/reorder", validate(reorderRefillSchema), monthlyRefillController.reorderRefill);

// 5. PATCH /:itemId - Update item quantity; verify ownership
router.patch(
  "/:itemId",
  validateParams(refillItemIdParamSchema),
  validate(updateRefillItemSchema),
  monthlyRefillController.updateItemQuantity
);

// 6. DELETE /:itemId - Remove one item; verify ownership
router.delete(
  "/:itemId",
  validateParams(refillItemIdParamSchema),
  monthlyRefillController.removeItem
);

module.exports = router;
