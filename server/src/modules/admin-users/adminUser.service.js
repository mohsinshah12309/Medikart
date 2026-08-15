/**
 * AdminUser service — Phase 5.
 *
 * Business rules live here (rules.md §2). The controller only shapes
 * request/response; all auth logic is in this service.
 *
 * Security contract (Phase 5 spec):
 *   - Passwords are hashed with bcrypt (cost factor 12) before storage.
 *     Plaintext passwords are NEVER stored, logged, or returned — not even
 *     during local development.
 *   - Failed login ALWAYS returns the same generic error regardless of whether
 *     the failure was "email not found" or "wrong password". This prevents
 *     email enumeration attacks.
 *   - JWT is signed with JWT_SECRET from .env; it carries a short expiry
 *     (8 hours default) — never a non-expiring token.
 *   - Inactive accounts are treated identically to "not found" — no leakage.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminUser = require("./adminUser.model");
const { UnauthorizedError } = require("../../utils/errors");

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = "8h"; // sensible session window
const GENERIC_AUTH_ERROR = "Invalid credentials"; // never vary this message

/**
 * Hash a plaintext password.
 * Called from the seed script and (Phase 20) from the create-admin service.
 */
const hashPassword = async (plaintext) => {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
};

/**
 * Login — verifies email + password, returns a signed JWT on success.
 *
 * Always throws the same UnauthorizedError for any failure (email not found,
 * wrong password, inactive account) to prevent enumeration.
 */
const login = async ({ email, password }) => {
  // Must explicitly opt-in to passwordHash (select: false on the schema)
  const user = await AdminUser.findOne({ email }).select("+passwordHash");

  // Constant-time failure path: even when the user doesn't exist we run
  // bcrypt.compare against a dummy hash so the response time is the same.
  // This makes timing-based enumeration much harder.
  const DUMMY_HASH = "$2b$12$invalidhashfortimingattackpreventiononlyxxxxxxxxxxxxxxx";
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;

  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  // Single failure branch — never distinguish "no user" from "wrong password"
  if (!user || !passwordMatch || !user.active) {
    throw new UnauthorizedError(GENERIC_AUTH_ERROR);
  }

  // Build JWT payload — only the minimum needed for auth middleware
  const payload = {
    sub: user._id.toString(),   // subject: admin user id
    role: user.role,            // needed by requireSuperAdmin middleware
    email: user.email,          // useful for audit logs in later phases
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // This is a server misconfiguration, not a user error — throw loudly
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });

  return {
    token,
    expiresIn: JWT_EXPIRY,
    admin: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { login, hashPassword };
