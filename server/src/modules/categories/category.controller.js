/**
 * Category controller — Phase 4.
 *
 * Per rules.md Section 2: controllers stay thin — they read the request, call
 * the service, shape the response. Business rules live in the service layer.
 *
 * All errors are thrown as typed errors and caught by the central errorHandler.
 */

const categoryService = require("./category.service");

/**
 * POST /admin/categories — create a new category
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    // Return only the newly created ID for test script compatibility
    res.status(201).json({ _id: category._id });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/categories — get all categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    // Extract query filters if provided
    const filters = {
      active: req.query.active === "true" ? true : req.query.active === "false" ? false : undefined,
      isNarcotic: req.query.isNarcotic === "true" ? true : req.query.isNarcotic === "false" ? false : undefined,
    };

    const categories = await categoryService.getAllCategories(filters);
    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/categories/:id — get a single category
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/categories/:id — update a category
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    // Return only the updated ID
    res.status(200).json({ _id: category._id });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/categories/:id — delete a category
 */
const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).send(); // 204 No Content on successful delete
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
