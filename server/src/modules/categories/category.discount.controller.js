/**
 * Category discount controller — Phase 8.
 * PATCH /api/v1/admin/categories/:id/discount
 */

const Category = require("./category.model");
const { NotFoundError } = require("../../utils/errors");
const { invalidateCategoryCache } = require("./category.service");

const setCategoryDiscount = async (req, res, next) => {
  try {
    const { value, active } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { "discount.value": value, "discount.active": active } },
      { new: true, runValidators: true }
    );

    if (!category) throw new NotFoundError("Category not found");

    await invalidateCategoryCache();

    res.status(200).json({
      status: "success",
      data: { discount: category.discount },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { setCategoryDiscount };
