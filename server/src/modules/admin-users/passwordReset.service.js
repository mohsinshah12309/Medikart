/**
 * PasswordReset service — Phase 6.
 *
 * Security contract:
 *
 * TOKEN HANDLING
 *   - Raw token = 32 random bytes (crypto.randomBytes) expressed as hex (64 chars).
 *     This is cryptographically random and unpredictable.
 *   - Stored value = SHA-256 hash of the raw token.
 *     SHA-256 is appropriate here (unlike bcrypt for passwords) because the token
 *     is already high-entropy random data — the threat model is DB compromise, not
 *     a dictionary attack.
 *   - The raw token is NEVER written to the database, log files, or console output.
 *
 * ENUMERATION PROTECTION
 *   - forgotPassword() always resolves successfully, whether or not the email
 *     exists. The email is only sent internally when a real account is found.
 *     Callers (controller) always respond 200 with the same message.
 *
 * GENERIC RESET FAILURES
 *   - Any reset failure (token not found, expired, already used) throws a single
 *     generic error. The caller never learns which condition triggered it.
 *
 * TOKEN LIFECYCLE
 *   - Expiry: 30 minutes from creation.
 *   - Single-use: marked `used: true` on first successful consumption.
 *   - Old unused tokens for the same user are invalidated when a new request
 *     is issued (prevents multiple valid reset links floating in inboxes).
 *   - MongoDB TTL index on passwordResets collection auto-deletes expired docs
 *     1 hour after expiry (cleanup without a cron job).
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const AdminUser = require("./adminUser.model");
const PasswordReset = require("./passwordReset.model");
const { sendEmail } = require("../../utils/email");
const { BadRequestError } = require("../../utils/errors");

const TOKEN_EXPIRY_MINUTES = 30;
const BCRYPT_ROUNDS = 12;
const GENERIC_RESET_ERROR = "This reset link is no longer valid";

/** SHA-256 hash of a raw token string — used for storage and lookup */
const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

/**
 * POST /forgot-password
 *
 * Generates a reset token and emails the link if the account exists.
 * Always resolves — never reveals whether the email is registered.
 */
const forgotPassword = async (email) => {
  try {
    const user = await AdminUser.findOne({ email, active: true });

    if (!user) {
      // Return silently — same response path as success (enumeration prevention)
      return;
    }

    // Invalidate any existing unused tokens for this user before issuing a new one.
    // Prevents multiple valid links floating in the inbox simultaneously.
    await PasswordReset.deleteMany({ adminUserId: user._id, used: false });

    // Generate cryptographically random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await PasswordReset.create({
      tokenHash,
      adminUserId: user._id,
      expiresAt,
      used: false,
    });

    // Build reset URL — ADMIN_URL from env, falls back to localhost for dev
    const adminBaseUrl =
      process.env.ADMIN_URL || "http://localhost:3000";
    const resetLink = `${adminBaseUrl}/reset-password?token=${rawToken}`;

    // Send email — contains the LINK with the raw token, never the password itself
    await sendEmail({
      to: user.email,
      subject: "Medikart Admin — Password Reset",
      html: `
        <p>Hello ${user.name},</p>
        <p>A password reset was requested for your Medikart Admin account.</p>
        <p>
          <a href="${resetLink}" style="
            display:inline-block;
            padding:10px 20px;
            background:#1a73e8;
            color:#fff;
            text-decoration:none;
            border-radius:4px;
          ">Reset Password</a>
        </p>
        <p>Or copy this link:<br/><code>${resetLink}</code></p>
        <p>This link expires in <strong>${TOKEN_EXPIRY_MINUTES} minutes</strong> and can only be used once.</p>
        <p>If you did not request this, ignore this email — your password has not been changed.</p>
        <p>— Medikart Team</p>
      `,
      text: `Reset your Medikart Admin password:\n\n${resetLink}\n\nExpires in ${TOKEN_EXPIRY_MINUTES} minutes. Single use only.`,
    });
  } catch (err) {
    // Log server-side for debugging, but never propagate to the caller —
    // the endpoint must always return 200 (enumeration protection).
    // SMTP failures are non-fatal here; the admin can request again.
    console.error("[PasswordReset] forgotPassword error (not surfaced to client):", err.message);
  }
};

/**
 * POST /reset-password
 *
 * Validates the token, updates the password, invalidates the token.
 * Any failure → same generic error (no leak of why it failed).
 */
const resetPassword = async (rawToken, newPassword) => {
  const tokenHash = hashToken(rawToken);

  const resetRecord = await PasswordReset.findOne({ tokenHash });

  // Single failure branch covers: token not found, expired, already used.
  // Do NOT vary the error message or throw different errors for each case.
  const now = new Date();
  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < now) {
    throw new BadRequestError(GENERIC_RESET_ERROR);
  }

  // Hash the new password before touching the DB
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update user's password
  await AdminUser.findByIdAndUpdate(resetRecord.adminUserId, { passwordHash });

  // Immediately mark token as used — prevents replay
  await PasswordReset.findByIdAndUpdate(resetRecord._id, { used: true });
};

module.exports = { forgotPassword, resetPassword };
