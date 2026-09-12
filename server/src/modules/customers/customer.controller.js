/**
 * Customer Auth Controller.
 *
 * Exposes customer authentication endpoints:
 *   - POST /api/v1/auth/customer/signup
 *   - POST /api/v1/auth/customer/verify-email
 *   - POST /api/v1/auth/customer/resend-verification
 *   - POST /api/v1/auth/customer/login
 *   - POST /api/v1/auth/customer/forgot-password
 *   - POST /api/v1/auth/customer/reset-password
 *   - GET  /api/v1/auth/customer/me
 */

const customerService = require("./customer.service");

const signup = async (req, res, next) => {
  try {
    const result = await customerService.signup(req.body);
    res.status(201).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await customerService.verifyEmail(req.body);
    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const result = await customerService.resendVerification(req.body);
    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await customerService.login(req.body);
    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await customerService.forgotPassword(req.body);
    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await customerService.resetPassword(req.body);
    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await customerService.getProfile(req.customer.id);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
};
