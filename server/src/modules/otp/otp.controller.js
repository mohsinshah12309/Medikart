/**
 * OTP Controller — Phase 12.
 *
 * Controllers stay thin: read request, call service, shape response.
 */

const otpService = require("./otp.service");
const { logAuthEvent } = require("../../utils/securityLogger");

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
    logAuthEvent({
      action: "OTP_REQUEST",
      status: "SUCCESS",
      identifier: req.body.email,
      role: "customer",
      req,
    });
    res.status(200).json(result);
  } catch (error) {
    logAuthEvent({
      action: "OTP_REQUEST",
      status: "FAILED",
      identifier: req.body.email,
      role: "customer",
      req,
      reason: error.message,
    });
    next(error);
  }
};

/**
 * POST /api/v1/otp/verify
 */
const verifyOtp = async (req, res, next) => {
  try {
    const result = await otpService.verifyOtp(req.body.email, req.body.code, { consume: false });
    logAuthEvent({
      action: "OTP_VERIFY",
      status: "SUCCESS",
      identifier: req.body.email,
      role: "customer",
      req,
    });
    res.status(200).json(result);
  } catch (error) {
    logAuthEvent({
      action: "OTP_VERIFY",
      status: "FAILED",
      identifier: req.body.email,
      role: "customer",
      req,
      reason: error.message,
    });
    next(error);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
