/**
 * OTP Controller — Phase 12.
 *
 * Controllers stay thin: read request, call service, shape response.
 */

const otpService = require("./otp.service");

/**
 * POST /api/v1/otp/request
 */
const requestOtp = async (req, res, next) => {
  try {
    const result = await otpService.requestOtp(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/otp/verify
 */
const verifyOtp = async (req, res, next) => {
  try {
    const result = await otpService.verifyOtp(req.body.email, req.body.code);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
