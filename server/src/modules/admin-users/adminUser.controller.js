/**
 * AdminUser controller — Phase 5.
 *
 * Thin layer: reads request, calls service, shapes response (rules.md §2).
 * No business logic here — all auth rules live in adminUser.service.js.
 */

const adminUserService = require("./adminUser.service");

/**
 * POST /api/v1/auth/admin/login
 */
const login = async (req, res, next) => {
  try {
    const result = await adminUserService.login(req.body);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
