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

/**
 * GET /api/v1/admin/users
 */
const getAdminUsers = async (req, res, next) => {
  try {
    const users = await adminUserService.getAdminUsers();
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/users
 */
const createAdminUser = async (req, res, next) => {
  try {
    const user = await adminUserService.createAdminUser(req.body, req.admin);
    res.status(201).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id
 */
const updateAdminUser = async (req, res, next) => {
  try {
    const user = await adminUserService.updateAdminUser(req.params.id, req.body, req.admin);
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 */
const deleteAdminUser = async (req, res, next) => {
  try {
    const user = await adminUserService.deleteAdminUser(req.params.id, req.admin);
    res.status(200).json({
      status: "success",
      message: "Admin user deleted successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const result = await adminUserService.verify2FA(req.body);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const setup2FA = async (req, res, next) => {
  try {
    const result = await adminUserService.setup2FA(req.admin.id);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const confirm2FA = async (req, res, next) => {
  try {
    const result = await adminUserService.confirm2FA(req.admin.id, req.body);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const result = await adminUserService.disable2FA(req.admin.id, req.body);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const reset2FA = async (req, res, next) => {
  try {
    const user = await adminUserService.reset2FA(req.params.id, req.admin);
    res.status(200).json({
      status: "success",
      message: "2FA has been successfully reset",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  verify2FA,
  setup2FA,
  confirm2FA,
  disable2FA,
  reset2FA,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};
