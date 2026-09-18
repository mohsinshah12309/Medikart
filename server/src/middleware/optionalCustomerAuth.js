const jwt = require("jsonwebtoken");
const Customer = require("../modules/customers/customer.model");

/**
 * Optional Customer Auth Middleware.
 * Decodes Bearer token if provided and valid, attaching `req.customer`.
 * Does NOT throw if no token or token is invalid — falls through as guest.
 */
const optionalCustomerAuth = async (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, secret);

    if (decoded && decoded.role === "customer") {
      const customer = await Customer.findById(decoded.sub);
      if (customer && customer.emailVerified && !customer.isBlocked) {
        req.customer = {
          id: customer._id.toString(),
          email: customer.email,
          name: customer.name,
        };
      }
    }
    next();
  } catch (err) {
    // Silently continue as guest
    next();
  }
};

module.exports = optionalCustomerAuth;
