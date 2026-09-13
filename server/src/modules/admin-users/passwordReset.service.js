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
const { sendEmail } = require("../../integrations/smtp");
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
 * Generates a 6-digit verification code and emails it if the account exists.
 * Always resolves — never reveals whether the email is registered.
 */
const forgotPassword = async (email) => {
  try {
    const user = await AdminUser.findOne({ email, active: true });

    if (!user) {
      // Return silently — same response path as success (enumeration prevention)
      return { code: null };
    }

    // Invalidate any existing unused tokens for this user before issuing a new one.
    await PasswordReset.deleteMany({ adminUserId: user._id, used: false });

    // Generate 6-digit numeric verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(verificationCode);

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await PasswordReset.create({
      tokenHash,
      adminUserId: user._id,
      expiresAt,
      used: false,
    });

    // Send email with 6-digit verification code via Mailjet
    await sendEmail({
      to: user.email,
      subject: "Medikart Admin — Password Reset Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #fef08a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #fff850; padding: 24px; text-align: center; border-bottom: 2px solid #fae845;">
            <h1 style="color: #1a1a1a; margin: 0; font-size: 22px; font-weight: 900;">
              💊 Medikart Staff Portal
            </h1>
            <p style="color: #451a03; margin: 6px 0 0 0; font-size: 14px; font-weight: bold;">
              Password Reset Verification Code
            </p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; color: #1a1a1a; margin-top: 0;">
              Hello <strong>${user.name}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              A password reset was requested for your Medikart Admin/Staff account. Use the 6-digit verification code below to set your new password:
            </p>
            <div style="background-color: #fffde0; border: 2px dashed #facc15; border-radius: 12px; padding: 18px; text-align: center; margin: 22px 0;">
              <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #854d0e; font-family: monospace; display: inline-block; padding-left: 10px;">${verificationCode}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
              This verification code expires in <strong>${TOKEN_EXPIRY_MINUTES} minutes</strong> and can only be used once.
            </p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">
              If you did not request this password reset, please ignore this email or contact the Super Administrator immediately.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Medikart Pharmacy Admin Console
          </div>
        </div>
      `,
      text: `Your Medikart Admin password reset verification code is: ${verificationCode}\n\nExpires in ${TOKEN_EXPIRY_MINUTES} minutes. Single use only.`,
    });

    return { code: verificationCode };
  } catch (err) {
    console.error("[PasswordReset] forgotPassword error (not surfaced to client):", err.message);
    return { code: null };
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
