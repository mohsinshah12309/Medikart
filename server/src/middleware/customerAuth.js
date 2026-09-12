/**
 * Customer Auth Middleware.
 *
 * Enforces strict authentication for customer routes (e.g., Wishlist, Profile).
 *
 * Security & Boundary guarantees:
 *   1. Strictly validates JWTs with `role: "customer"`.
 *   2. Rejects any token where `role` is "admin" or "super_admin" (hard auth boundary).
 *   3. Verifies account status in database: must exist, emailVerified === true, isBlocked === false.
 *   4. Attaches `req.customer` = { id, email, name }.
 */

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../utils/errors");
const Customer = require("../modules/customers/customer.model");

const customerAuth = async (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error("JWT_SECRET is not configured on the server"));
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication required");
    }

    const token = authHeader.slice(7); // strip "Bearer "

    const decoded = jwt.verify(token, secret);

    // Hard boundary: role MUST be "customer"
    if (!decoded || decoded.role !== "customer") {
      throw new UnauthorizedError("Authentication required");
    }

    // Verify customer exists and is active/verified
    const customer = await Customer.findById(decoded.sub);
    if (!customer || !customer.emailVerified || customer.isBlocked) {
      throw new UnauthorizedError("Authentication required");
    }

    req.customer = {
      id: customer._id.toString(),
      email: customer.email,
      name: customer.name,
    };

    next();
  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    return next(new UnauthorizedError("Authentication required"));
  }
};

module.exports = customerAuth;
