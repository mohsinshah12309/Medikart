/**
 * Category service — Phase 4.
 *
 * Per rules.md Section 2: business rules live in the service layer only.
 * Controllers stay thin.
 *
 * This service handles CRUD operations for categories. Discount precedence
 * logic (Phase 8) will be added in a later phase.
 */

const Category = require("./category.model");
const { NotFoundError } = require("../../utils/errors");

/**
 * Create a new category
 */
const createCategory = async (categoryData) => {
  const category = new Category(categoryData);
  await category.save();
  return category;
};

/**
 * Get all categories (with optional filtering)
 */
const getAllCategories = async (filters = {}, page = 1, limit = 20) => {
  const query = {};

  // Build query filters if provided
  if (filters.active !== undefined) {
    query.active = filters.active;
  }
  if (filters.isNarcotic !== undefined) {
    query.isNarcotic = filters.isNarcotic;
  }

  const skip = (page - 1) * limit;

  const categories = await Category.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return categories;
};

/**
 * Get a single category by ID
 */
const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return category;
};

/**
 * Update a category by ID
 */
const updateCategory = async (categoryId, updateData) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { $set: updateData },
    {
      new: true, // return updated document
      runValidators: true, // run schema validators
    }
  );

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return category;
};

/**
 * Delete a category by ID
 */
const deleteCategory = async (categoryId) => {
  const category = await Category.findByIdAndDelete(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return category;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
