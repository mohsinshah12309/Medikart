const crypto = require("crypto");
const cartService = require("./cart.service");
const { UnauthorizedError, BadRequestError } = require("../../utils/errors");

/**
 * Extracts cart scope (customerId or guestId) from request.
 * If guest has no cookie or header, generates and sets a fresh UUIDv4 cookie.
 */
const resolveScope = (req, res) => {
  // Set anti-cache headers strictly on all cart responses
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0",
  });

  if (req.customer && req.customer.id) {
    return { customerId: req.customer.id };
  }

  let guestId =
    req.cookies?.medikart_guest_id ||
    req.headers["x-guest-id"] ||
    null;

  if (!guestId || typeof guestId !== "string" || guestId.trim().length === 0) {
    guestId = crypto.randomUUID();
    res.cookie("medikart_guest_id", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });
  }

  res.setHeader("X-Guest-Id", guestId);
  return { guestId };
};

const getCart = async (req, res, next) => {
  try {
    const scope = resolveScope(req, res);
    const cart = await cartService.getCart(scope);
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const scope = resolveScope(req, res);
    const { productId, quantity } = req.body;
    const cart = await cartService.addItem(scope, { productId, quantity });
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuantity = async (req, res, next) => {
  try {
    const scope = resolveScope(req, res);
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateQuantity(scope, productId, quantity);
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const scope = resolveScope(req, res);
    const { productId } = req.params;
    const cart = await cartService.removeItem(scope, productId);
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const scope = resolveScope(req, res);
    const cart = await cartService.clearCart(scope);
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const mergeCart = async (req, res, next) => {
  try {
    if (!req.customer || !req.customer.id) {
      throw new UnauthorizedError("Authentication required to merge cart");
    }

    const guestId =
      req.body.guestId ||
      req.cookies?.medikart_guest_id ||
      req.headers["x-guest-id"] ||
      null;

    const cart = await cartService.mergeGuestCart({
      customerId: req.customer.id,
      guestId,
    });

    // Clear guest cookie after merge
    res.clearCookie("medikart_guest_id", { path: "/" });

    res.status(200).json({
      status: "success",
      message: "Cart merged successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeCart,
};
