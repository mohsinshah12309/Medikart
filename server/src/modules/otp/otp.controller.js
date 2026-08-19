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
    // Fix 5 — pass the client IP for per-IP rate limiting (NFR-SEC-03).
    // Express sets req.ip from the socket; behind a proxy the app should
    // trust the X-Forwarded-For header via 'trust proxy' at deploy time.
    const result = await otpService.requestOtp(req.body.email, req.ip);
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
