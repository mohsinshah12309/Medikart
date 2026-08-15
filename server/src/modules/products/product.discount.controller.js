/**
 * Product discount controller — Phase 8.
 *
 * PATCH /api/v1/admin/products/:id/discount
 *
 * Only touches the discount sub-document — nothing else on the product.
 * This is the allow-list enforcement at the controller level on top of
 * Zod validation already done at the route boundary.
 */

const Product = require("./product.model");
const { NotFoundError } = require("../../utils/errors");

const setProductDiscount = async (req, res, next) => {
  try {
    const { value, active } = req.body; // only these two fields accepted

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "discount.value": value,
          "discount.active": active,
          "discount.type": "percentage", // always percentage in this phase
        },
      },
      { new: true, runValidators: true }
    );

    if (!product) throw new NotFoundError("Product not found");

    res.status(200).json({
      status: "success",
      data: { discount: product.discount },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { setProductDiscount };
