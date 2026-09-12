/**
 * Customer Wishlist Controller.
 */

const wishlistService = require("./wishlist.service");

const getWishlist = async (req, res, next) => {
  try {
    const items = await wishlistService.getWishlist(req.customer.id);
    res.status(200).json({
      status: "success",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getWishlistIds = async (req, res, next) => {
  try {
    const ids = await wishlistService.getWishlistIds(req.customer.id);
    res.status(200).json({
      status: "success",
      data: ids,
    });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const item = await wishlistService.addToWishlist(req.customer.id, req.params.productId);
    res.status(201).json({
      status: "success",
      message: "Product added to wishlist",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const result = await wishlistService.removeFromWishlist(req.customer.id, req.params.productId);
    res.status(200).json({
      status: "success",
      message: "Product removed from wishlist",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  getWishlistIds,
  addToWishlist,
  removeFromWishlist,
};
