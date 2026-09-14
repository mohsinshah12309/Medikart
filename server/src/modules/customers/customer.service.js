/**
 * Customer Service — Authentication & Account Lifecycle.
 *
 * Implements:
 *   1. Signup with email pre-check and real 6-digit OTP verification.
 *   2. Constant-time login and timing-attack resistant password verification.
 *   3. Scoped customer JWT issuance (role: "customer").
 *   4. Single-use, short-lived password reset tokens.
 *   5. Enumeration protection across signup and password reset endpoints.
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Customer = require("./customer.model");
const CustomerPasswordReset = require("./customerPasswordReset.model");
const otpService = require("../otp/otp.service");
const emailPrecheck = require("../../utils/emailPrecheck");
const { generatePasswordResetTemplate } = require("../../utils/emailTemplates");
const smtp = require("../../integrations/smtp");
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} = require("../../utils/errors");

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = "7d";
const TOKEN_EXPIRY_MINUTES = 30;
const DUMMY_HASH = "$2a$12$invalidhashfortimingattackpreventiononlyxxxxxxxxxxxxxxx";

const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

/**
 * Customer Registration / Signup
 */
const signup = async ({ name, email, password, phone = "", overrideSuggestion = false }, ip) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Email Pre-check (Typo suggestion & DNS MX validation)
  const precheck = await emailPrecheck.validateEmailPrecheck(normalizedEmail, { overrideSuggestion });
  if (precheck.needsConfirmation) {
    return {
      success: false,
      needsConfirmation: true,
      suggestion: precheck.suggestion,
      suggestedDomain: precheck.suggestedDomain,
      originalEmail: precheck.originalEmail,
      message: precheck.message,
    };
  }

  if (!precheck.valid) {
    throw new BadRequestError(precheck.message || "Invalid email address or unroutable domain.");
  }

  // 2. Check existing account
  const existingCustomer = await Customer.findOne({ email: normalizedEmail });

  if (existingCustomer) {
    if (existingCustomer.emailVerified) {
      // Send security alert email silently to prevent user enumeration
      try {
        await smtp.sendEmail({
          to: normalizedEmail,
          subject: "Medikart — Registration Attempt Notification",
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Account Notice</h2>
            <p>Hello ${existingCustomer.name},</p>
            <p>An attempt was made to create a new Medikart account with this email address. If you already have an account, please <a href="${process.env.STOREFRONT_URL || 'http://localhost:3000'}/login">log in here</a> or reset your password.</p>
            <p>If you did not make this request, you can safely ignore this email.</p>
          </div>`,
          text: `An attempt was made to register with your email on Medikart. If this was you, please log in or reset your password.`,
        });
      } catch (err) {
        console.error("[CustomerService] Security notice email failed:", err.message);
      }

      return {
        success: true,
        message: "If your email is valid, a verification code has been sent.",
      };
    } else {
      // Account exists but was never verified — update password/name and issue new verification code
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      existingCustomer.name = name;
      existingCustomer.passwordHash = passwordHash;
      if (phone) existingCustomer.phone = phone;
      await existingCustomer.save();

      const otpRes = await otpService.requestOtp(normalizedEmail, ip, {
        purpose: "account_verification",
        overrideSuggestion: true,
      });

      const response = {
        success: true,
        message: "A verification code has been sent to your email.",
      };
      if (process.env.NODE_ENV === "test" && otpRes._testCode) {
        response._testCode = otpRes._testCode;
      }
      return response;
    }
  }

  // 3. New Customer Registration
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await Customer.create({
    name,
    email: normalizedEmail,
    passwordHash,
    phone,
    emailVerified: false,
  });

  // 4. Send 6-digit verification code
  const otpRes = await otpService.requestOtp(normalizedEmail, ip, {
    purpose: "account_verification",
    overrideSuggestion: true,
  });

  const response = {
    success: true,
    requiresVerification: true,
    message: "A verification code has been sent to your email.",
  };
  if (process.env.NODE_ENV === "test" && otpRes._testCode) {
    response._testCode = otpRes._testCode;
  }
  return response;
};

/**
 * Verify Customer Email with 6-digit Code
 */
const verifyEmail = async ({ email, code }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Consume the account_verification OTP code
  await otpService.verifyOtp(normalizedEmail, code, {
    purpose: "account_verification",
  });

  // 2. Find customer
  const customer = await Customer.findOne({ email: normalizedEmail });
  if (!customer) {
    throw new NotFoundError("Customer account not found.");
  }

  customer.emailVerified = true;
  await customer.save();

  // 3. Generate customer JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }

  const token = jwt.sign(
    {
      sub: customer._id.toString(),
      role: "customer",
      email: customer.email,
      name: customer.name,
    },
    secret,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    success: true,
    message: "Email verified successfully.",
    token,
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      emailVerified: customer.emailVerified,
    },
  };
};

/**
 * Resend Account Verification Code
 */
const resendVerification = async ({ email, overrideSuggestion = false }, ip) => {
  const normalizedEmail = email.trim().toLowerCase();

  const customer = await Customer.findOne({ email: normalizedEmail });
  if (!customer || customer.emailVerified) {
    // Generic response to prevent enumeration
    return {
      success: true,
      message: "If your email is valid, a verification code has been sent.",
    };
  }

  const otpRes = await otpService.requestOtp(normalizedEmail, ip, {
    purpose: "account_verification",
    overrideSuggestion,
  });

  const response = {
    success: true,
    message: "Verification code sent to your email.",
  };
  if (process.env.NODE_ENV === "test" && otpRes._testCode) {
    response._testCode = otpRes._testCode;
  }
  return response;
};

/**
 * Customer Login
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const customer = await Customer.findOne({ email: normalizedEmail }).select("+passwordHash");

  const hashToCompare = customer ? customer.passwordHash : DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!customer || !passwordMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (customer.isBlocked) {
    throw new ForbiddenError("Your account has been locked. Please contact customer support.");
  }

  if (!customer.emailVerified) {
    const error = new ForbiddenError("Please verify your email address before logging in.");
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }

  const token = jwt.sign(
    {
      sub: customer._id.toString(),
      role: "customer",
      email: customer.email,
      name: customer.name,
    },
    secret,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    success: true,
    token,
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      emailVerified: customer.emailVerified,
    },
  };
};

/**
 * Customer Forgot Password
 */
const forgotPassword = async (payload) => {
  const email = typeof payload === "string" ? payload : (payload && payload.email ? payload.email : "");
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const customer = await Customer.findOne({ email: normalizedEmail, isBlocked: false });
    if (!customer) {
      return {
        success: true,
        message: "If that email address is in our database, we will send you a password reset link.",
      };
    }

    // Invalidate prior unused tokens
    await CustomerPasswordReset.deleteMany({ customerId: customer._id, used: false });

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await CustomerPasswordReset.create({
      tokenHash,
      customerId: customer._id,
      expiresAt,
      used: false,
    });

    const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
    const resetLink = `${storefrontUrl}/reset-password?token=${rawToken}`;
    const template = generatePasswordResetTemplate({
      recipientName: customer.name,
      resetLink,
      expiryMinutes: TOKEN_EXPIRY_MINUTES,
    });

    await smtp.sendEmail({
      to: customer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      fromName: "Medikart Security",
    });

    return {
      success: true,
      message: "If that email address is in our database, we will send you a password reset link.",
      ...(process.env.NODE_ENV === "test" ? { _testToken: rawToken } : {}),
    };
  } catch (err) {
    console.error("[CustomerService] Forgot password error:", err.message);
    return {
      success: true,
      message: "If that email address is in our database, we will send you a password reset link.",
    };
  }
};

/**
 * Customer Reset Password
 */
const resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);

  const resetDoc = await CustomerPasswordReset.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetDoc) {
    throw new BadRequestError("This password reset link is invalid or has expired.");
  }

  const customer = await Customer.findById(resetDoc.customerId);
  if (!customer) {
    throw new BadRequestError("Customer account no longer exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  customer.passwordHash = passwordHash;
  await customer.save();

  resetDoc.used = true;
  await resetDoc.save();

  // Invalidate any other open reset requests for this customer
  await CustomerPasswordReset.updateMany(
    { customerId: customer._id, used: false },
    { $set: { used: true } }
  );

  return {
    success: true,
    message: "Your password has been successfully reset. You may now log in.",
  };
};

/**
 * Get Customer Profile
 */
const getProfile = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new NotFoundError("Customer not found");

  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    emailVerified: customer.emailVerified,
    createdAt: customer.createdAt,
  };
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
