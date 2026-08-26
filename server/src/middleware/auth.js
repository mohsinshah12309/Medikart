/**
 * auth middleware — Phase 5.
 *
 * Verifies the JWT on every request that passes through it.
 * Applied in app.js before ALL /api/v1/admin/* routes so that the
 * default posture is "deny unless token is valid" — never the other way.
 *
 * Public routes (e.g., POST /api/v1/auth/admin/login) are mounted BEFORE
 * this middleware so they are never accidentally blocked.
 *
 * Security contract:
 *   - Expects the token in the Authorization header: "Bearer <token>"
 *   - Returns a generic 401 for any failure (missing, malformed, expired,
 *     wrong signature) — no detail that would help an attacker.
 *   - Attaches `req.admin` with { id, role, email } for downstream
 *     middleware (e.g., requireSuperAdmin) and controllers.
 *   - Never logs the token itself.
 */

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../utils/errors");
const AdminUser = require("../modules/admin-users/adminUser.model");

const auth = async (req, res, next) => {
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

    // jwt.verify throws on any problem (expired, bad signature, malformed)
    const decoded = jwt.verify(token, secret);

    // Fetch the admin user from DB to check current account state (especially 'active')
    const adminUser = await AdminUser.findById(decoded.sub);
    if (!adminUser || !adminUser.active) {
      throw new UnauthorizedError("Authentication required");
    }

    // Attach minimal identity info — downstream code reads req.admin
    req.admin = {
      id: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email,
    };

    next();
  } catch (error) {
    // Catch jwt.verify errors (JsonWebTokenError, TokenExpiredError, etc.)
    // and surface them all as a generic 401 — never leak verification detail
    if (error.isOperational) {
      return next(error); // already a typed AppError (e.g., UnauthorizedError)
    }
    // JWT library error — normalise to 401
    return next(new UnauthorizedError("Authentication required"));
  }
};

module.exports = auth;
