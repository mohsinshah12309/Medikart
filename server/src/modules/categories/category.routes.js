/**
 * Category routes — Phase 4.
 *
 * Per rules.md Section 2: /api/v1/<resource>, plural nouns, standard REST
 * verbs. Request validation at the route boundary.
 *
 * These routes are not yet authenticated (Phase 5 adds that), but are fully
 * validated per Section 3's security requirements.
 */

const express = require("express");
const router = express.Router();

const categoryController = require("./category.controller");
const categoryDiscountController = require("./category.discount.controller");
const { validate, validateParams, validateQuery } = require("../../middleware/validate");
const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoriesQuerySchema,
} = require("./category.validation");
const { categoryDiscountSchema } = require("./category.discount.validation");

// POST /admin/categories — create new category
router.post("/", validate(createCategorySchema), categoryController.createCategory);

// GET /admin/categories — get all categories (with optional filters)
router.get("/", validateQuery(listCategoriesQuerySchema), categoryController.getAllCategories);

// GET /admin/categories/:id — get single category
router.get(
  "/:id",
  validateParams(categoryIdSchema),
  categoryController.getCategoryById
);

// PUT /admin/categories/:id — update category
router.put(
  "/:id",
  validateParams(categoryIdSchema),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

// PATCH /admin/categories/:id/discount — Phase 8: set/clear category-level discount
router.patch(
  "/:id/discount",
  validateParams(categoryIdSchema),
  validate(categoryDiscountSchema),
  categoryDiscountController.setCategoryDiscount
);

// DELETE /admin/categories/:id — delete category
router.delete(
  "/:id",
  validateParams(categoryIdSchema),
  categoryController.deleteCategory
);

module.exports = router;
