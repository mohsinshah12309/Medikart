const express = require("express");
const router = express.Router();
const cartController = require("./cart.controller");
const optionalCustomerAuth = require("../../middleware/optionalCustomerAuth");

// All cart routes support optional customer auth (authenticated customer or guest)
router.use(optionalCustomerAuth);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:productId", cartController.updateQuantity);
router.delete("/items/:productId", cartController.removeItem);
router.delete("/", cartController.clearCart);
router.post("/merge", cartController.mergeCart);

module.exports = router;
