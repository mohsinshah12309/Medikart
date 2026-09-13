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
    const result = await passwordResetService.forgotPassword(req.body.email);

    res.status(200).json({
      status: "success",
      message:
        "If that email is associated with an admin account, a verification code has been sent.",
      ...(process.env.NODE_ENV === "test" && result?.code && { _testCode: result.code }),
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
