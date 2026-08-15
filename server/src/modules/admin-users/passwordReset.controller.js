/**
 * PasswordReset controller — Phase 6.
 *
 * Thin layer — reads request, calls service, shapes response (rules.md §2).
 * No business logic here.
 *
 * IMPORTANT: forgotPassword always responds 200 with the same message
 * regardless of whether the email matched a real account. This is intentional
 * enumeration protection — the controller must NOT branch on the service result.
 */

const passwordResetService = require("./passwordReset.service");

/**
 * POST /api/v1/auth/admin/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    // Fire-and-forget — service handles enumeration protection internally.
    // We await so SMTP errors are logged, but response is always the same.
    await passwordResetService.forgotPassword(req.body.email);

    // Always 200, always the same message — no information about whether
    // the email exists in the system.
    res.status(200).json({
      status: "success",
      message:
        "If that email is associated with an admin account, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/admin/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await passwordResetService.resetPassword(token, newPassword);

    res.status(200).json({
      status: "success",
      message: "Password has been reset successfully. You may now log in.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { forgotPassword, resetPassword };
