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

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const AdminUser = require("./adminUser.model");
const { forgotPassword } = require("./passwordReset.service");
const activityLogService = require("../activity-logs/activityLog.service");
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../../utils/errors");

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
  // Must explicitly opt-in to passwordHash and twoFactorSecret (select: false on the schema)
  const user = await AdminUser.findOne({ email }).select("+passwordHash +twoFactorSecret");

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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // This is a server misconfiguration, not a user error — throw loudly
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  // If 2FA is enabled (i.e. user has a configured twoFactorSecret)
  if (user.twoFactorSecret) {
    // Generate a temporary verification token with short expiry (5m)
    const tempToken = jwt.sign(
      { sub: user._id.toString(), requires2FA: true },
      secret,
      { expiresIn: "5m" }
    );
    return {
      requires2FA: true,
      tempToken,
    };
  }

  // Build JWT payload — only the minimum needed for auth middleware
  const payload = {
    sub: user._id.toString(),   // subject: admin user id
    role: user.role,            // needed by requireSuperAdmin middleware
    email: user.email,          // useful for audit logs in later phases
  };

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

const sanitizeUser = (user) => {
  if (!user) return user;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  return obj;
};

/**
 * Get all admin users (select: -passwordHash by default anyway).
 */
const getAdminUsers = async () => {
  const users = await AdminUser.find({});
  return users.map(sanitizeUser);
};

/**
 * Create a new admin user.
 * Assigns role/permissions, sets a random password, and fires the password reset email flow.
 */
const createAdminUser = async (data, actor) => {
  const { name, email, role, permissions } = data;

  // Generate a random temporary password
  const tempPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await hashPassword(tempPassword);

  const user = await AdminUser.create({
    name,
    email,
    role,
    permissions,
    passwordHash,
    active: true,
  });

  // Re-use the forgot-password service to trigger the reset token email pattern
  await forgotPassword(email);

  const sanitized = sanitizeUser(user);

  // Write to Activity Logs
  await activityLogService.logActivity({
    actor,
    action: "admin_user_created",
    entityType: "admin_user",
    entityId: user._id,
    before: null,
    after: sanitized,
  });

  return sanitized;
};

/**
 * Update an admin user's role, permissions, active status.
 * Rejects if deactivating/demoting the last active super_admin.
 */
const updateAdminUser = async (id, data, actor) => {
  const user = await AdminUser.findById(id).select("+passwordHash");
  if (!user) {
    throw new NotFoundError("Admin user not found");
  }

  // Safeguard: Cannot demote or deactivate the last active super admin
  const isTargetActiveSuperAdmin = user.role === "super_admin" && user.active;
  const willBeInactiveOrDemoted = (data.active === false) || (data.role && data.role !== "super_admin");

  if (isTargetActiveSuperAdmin && willBeInactiveOrDemoted) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Lock all active super admins by updating their updatedAt timestamp.
      // This serializes concurrent demotions / deletions of super admins.
      await AdminUser.updateMany(
        { role: "super_admin", active: true },
        { $set: { updatedAt: new Date() } }
      ).session(session);

      const activeSuperAdminCount = await AdminUser.countDocuments({
        role: "super_admin",
        active: true,
      }).session(session);

      if (activeSuperAdminCount <= 1) {
        throw new BadRequestError("Cannot demote or deactivate the last remaining active Super Admin");
      }

      const before = sanitizeUser(user);

      // Apply updates
      if (data.name !== undefined) user.name = data.name;
      if (data.email !== undefined) user.email = data.email;
      if (data.role !== undefined) user.role = data.role;
      if (data.permissions !== undefined) user.permissions = data.permissions;
      if (data.active !== undefined) user.active = data.active;

      await user.save({ session });

      const after = sanitizeUser(user);

      await session.commitTransaction();

      await activityLogService.logActivity({
        actor,
        action: "admin_user_updated",
        entityType: "admin_user",
        entityId: user._id,
        before,
        after,
      });

      return after;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  const before = sanitizeUser(user);

  // Apply updates
  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.role !== undefined) user.role = data.role;
  if (data.permissions !== undefined) user.permissions = data.permissions;
  if (data.active !== undefined) user.active = data.active;

  await user.save();

  const after = sanitizeUser(user);

  // Log to Activity Logs
  await activityLogService.logActivity({
    actor,
    action: "admin_user_updated",
    entityType: "admin_user",
    entityId: user._id,
    before,
    after,
  });

  return after;
};

/**
 * Delete an admin user.
 * Rejects if deleting the last active super_admin.
 */
const deleteAdminUser = async (id, actor) => {
  const user = await AdminUser.findById(id);
  if (!user) {
    throw new NotFoundError("Admin user not found");
  }

  // Safeguard: Cannot delete the last active super admin
  if (user.role === "super_admin" && user.active) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await AdminUser.updateMany(
        { role: "super_admin", active: true },
        { $set: { updatedAt: new Date() } }
      ).session(session);

      const activeSuperAdminCount = await AdminUser.countDocuments({
        role: "super_admin",
        active: true,
      }).session(session);

      if (activeSuperAdminCount <= 1) {
        throw new BadRequestError("Cannot delete the last remaining active Super Admin");
      }

      const before = sanitizeUser(user);

      await AdminUser.findByIdAndDelete(id).session(session);

      await session.commitTransaction();

      await activityLogService.logActivity({
        actor,
        action: "admin_user_deleted",
        entityType: "admin_user",
        entityId: user._id,
        before,
        after: null,
      });

      return before;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  const before = sanitizeUser(user);

  await AdminUser.findByIdAndDelete(id);

  // Log to Activity Logs
  await activityLogService.logActivity({
    actor,
    action: "admin_user_deleted",
    entityType: "admin_user",
    entityId: user._id,
    before,
    after: null,
  });

  return before;
};

const verify2FA = async ({ code, tempToken }) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, secret);
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired 2FA session");
  }

  if (!decoded.requires2FA) {
    throw new BadRequestError("Invalid 2FA session");
  }

  const user = await AdminUser.findById(decoded.sub).select("+twoFactorSecret");
  if (!user || !user.active || !user.twoFactorSecret) {
    throw new UnauthorizedError("Invalid or expired 2FA session");
  }

  // Verify TOTP code using speakeasy
  const speakeasy = require("speakeasy");
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    throw new UnauthorizedError("Invalid 2FA code");
  }

  // Standard login JWT generation
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  };

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

const setup2FA = async (userId) => {
  const user = await AdminUser.findById(userId);
  if (!user) {
    throw new NotFoundError("Admin user not found");
  }

  const speakeasy = require("speakeasy");
  const QRCode = require("qrcode");

  // Generate TOTP secret
  const tempSecret = speakeasy.generateSecret({ name: `Medikart:${user.email}` });
  const secretBase32 = tempSecret.base32;
  const otpauth = tempSecret.otpauth_url;
  
  // Generate QR code data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  // Sign a setup token with tempSecret so it's stateless and secure
  const secret = process.env.JWT_SECRET;
  const setupToken = jwt.sign(
    { sub: userId, tempSecret: secretBase32 },
    secret,
    { expiresIn: "15m" }
  );

  return {
    qrCodeUrl,
    secret: secretBase32,
    setupToken,
  };
};

const confirm2FA = async (userId, { code, setupToken }) => {
  const secret = process.env.JWT_SECRET;
  let decoded;
  try {
    decoded = jwt.verify(setupToken, secret);
  } catch (err) {
    throw new BadRequestError("Invalid or expired 2FA setup session");
  }

  if (decoded.sub !== userId) {
    throw new BadRequestError("Invalid 2FA setup session");
  }

  const speakeasy = require("speakeasy");
  const isValid = speakeasy.totp.verify({
    secret: decoded.tempSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    throw new BadRequestError("Invalid 2FA code. Setup verification failed.");
  }

  // Update user with the validated secret
  const user = await AdminUser.findById(userId);
  user.twoFactorSecret = decoded.tempSecret;
  await user.save();

  // Write to Activity Logs
  const sanitized = sanitizeUser(user);
  await activityLogService.logActivity({
    actor: { id: userId, email: user.email, role: user.role },
    action: "admin_2fa_enabled",
    entityType: "admin_user",
    entityId: userId,
    before: null,
    after: sanitized,
  });

  return {
    success: true,
    message: "Two-factor authentication enabled successfully",
  };
};

const disable2FA = async (userId, { code }) => {
  const user = await AdminUser.findById(userId).select("+twoFactorSecret");
  if (!user || !user.twoFactorSecret) {
    throw new BadRequestError("2FA is not enabled on this account");
  }

  const speakeasy = require("speakeasy");
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    throw new BadRequestError("Invalid 2FA code. Verification failed.");
  }

  user.twoFactorSecret = undefined;
  await user.save();

  // Write to Activity Logs
  const sanitized = sanitizeUser(user);
  await activityLogService.logActivity({
    actor: { id: userId, email: user.email, role: user.role },
    action: "admin_2fa_disabled",
    entityType: "admin_user",
    entityId: userId,
    before: null,
    after: sanitized,
  });

  return {
    success: true,
    message: "Two-factor authentication disabled successfully",
  };
};

const reset2FA = async (targetId, actor) => {
  const user = await AdminUser.findById(targetId).select("+twoFactorSecret");
  if (!user) {
    throw new NotFoundError("Admin user not found");
  }

  if (!user.twoFactorSecret) {
    throw new BadRequestError("2FA is not enabled on this account");
  }

  const before = sanitizeUser(user);
  user.twoFactorSecret = undefined;
  await user.save();

  const after = sanitizeUser(user);

  // Write to Activity Logs
  await activityLogService.logActivity({
    actor,
    action: "admin_2fa_reset",
    entityType: "admin_user",
    entityId: targetId,
    before,
    after,
  });

  return after;
};

module.exports = {
  login,
  verify2FA,
  setup2FA,
  confirm2FA,
  disable2FA,
  reset2FA,
  hashPassword,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};
