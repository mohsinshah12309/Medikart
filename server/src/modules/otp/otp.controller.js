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
    // Pass client IP and precheck options (overrideSuggestion)
    const options = {
      overrideSuggestion: req.body.overrideSuggestion === true,
    };
    const result = await otpService.requestOtp(req.body.email, req.ip, options);
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
    const result = await otpService.verifyOtp(req.body.email, req.body.code, { consume: false });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
