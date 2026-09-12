/**
 * Customer Wishlist Routes.
 *
 * All routes are protected by customerAuth middleware.
 */

const express = require("express");
const router = express.Router();
const wishlistController = require("./wishlist.controller");
const customerAuth = require("../../middleware/customerAuth");
const { validateParams } = require("../../middleware/validate");
const { wishlistParamSchema } = require("./customer.validation");

router.use(customerAuth);

router.get("/", wishlistController.getWishlist);
router.get("/ids", wishlistController.getWishlistIds);
router.post("/:productId", validateParams(wishlistParamSchema), wishlistController.addToWishlist);
router.delete("/:productId", validateParams(wishlistParamSchema), wishlistController.removeFromWishlist);

module.exports = router;
