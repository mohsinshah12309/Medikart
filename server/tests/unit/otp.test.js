/**
 * otp.test.js — Phase 12 unit tests (Fix 6 / NFR-TEST-01).
 *
 * Tests otp.service.js:
 *   1. OTP generation — code is 6 digits, stored hashed (never plaintext).
 *   2. Expiry — 10-minute hard expiry (NFR-SEC-03).
 *   3. Single-use — a verified OTP cannot be re-used.
 *   4. Wrong-code attempt cap — 4 wrong attempts invalidates the OTP.
 *   5. Rate limiting — per-email (3 per 15 min) AND per-IP (Fix 5).
 */

jest.setTimeout(60000);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Otp = require("../../src/modules/otp/otp.model");
const otpService = require("../../src/modules/otp/otp.service");
const { BadRequestError } = require("../../src/utils/errors");

let testEmailId = 0;
const nextEmail = () => `otp-test-${++testEmailId}@test.com`;

// Short-circuits the SMTP send so tests never touch a real mail server.
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mock-id" }),
}));

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);
  await Otp.deleteMany({});
}, 90000);

afterEach(async () => {
  await Otp.deleteMany({});
  otpService._resetIpRequestLog();
});

afterAll(async () => {
  await Otp.deleteMany({});
  await mongoose.connection.close();
}, 90000);

/** Request an OTP and return the raw code from the test-mode payload. */
const requestOtpRaw = async (email, ip = "1.2.3.4") => {
  const result = await otpService.requestOtp(email, ip);
  return result._testCode;
};

describe("OTP — generation & hashing", () => {
  test("generates a 6-digit numeric code", async () => {
    const email = nextEmail();
    const rawCode = await requestOtpRaw(email);
    expect(rawCode).toMatch(/^\d{6}$/);
  });

  test("stores only a bcrypt hash — raw code is never persisted", async () => {
    const email = nextEmail();
    const rawCode = await requestOtpRaw(email);

    const doc = await Otp.findOne({ email });
    expect(doc).toBeTruthy();
    // The stored value must NOT equal the raw code.
    expect(doc.codeHash).not.toBe(rawCode);
    // And it must verify against bcrypt.
    expect(await bcrypt.compare(rawCode, doc.codeHash)).toBe(true);
  });

  test("new request for same email invalidates the previous unverified OTP", async () => {
    const email = nextEmail();
    await requestOtpRaw(email);
    await new Promise((r) => setTimeout(r, 100));
    await requestOtpRaw(email);

    const docs = await Otp.find({ email }).sort({ createdAt: 1 });
    expect(docs).toHaveLength(2);
    expect(docs[0].invalidated).toBe(true);
    expect(docs[1].invalidated).toBe(false);
  });
});

describe("OTP — verification & expiry", () => {
  test("correct code verifies successfully", async () => {
    const email = nextEmail();
    const rawCode = await requestOtpRaw(email);
    const result = await otpService.verifyOtp(email, rawCode);
    expect(result.verified).toBe(true);
  });

  test("single-use: a verified OTP cannot be re-used", async () => {
    const email = nextEmail();
    const rawCode = await requestOtpRaw(email);
    await otpService.verifyOtp(email, rawCode);

    await expect(otpService.verifyOtp(email, rawCode)).rejects.toThrow(
      /already been verified/i,
    );
  });

  test("wrong code is rejected", async () => {
    const email = nextEmail();
    await requestOtpRaw(email);

    await expect(otpService.verifyOtp(email, "000000")).rejects.toThrow(
      /invalid verification code/i,
    );
  });

  test("expired OTP is rejected (hard 10-minute expiry)", async () => {
    const email = nextEmail();
    await requestOtpRaw(email);

    // Force the expiry into the past.
    await Otp.updateOne(
      { email },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    await expect(otpService.verifyOtp(email, "000000")).rejects.toThrow(
      /expired/i,
    );
  });
});

describe("OTP — attempt cap & rate limiting", () => {
  test("4 wrong attempts permanently invalidates the OTP", async () => {
    const email = nextEmail();
    await requestOtpRaw(email);

    for (let i = 0; i < 4; i++) {
      await expect(otpService.verifyOtp(email, "000000")).rejects.toThrow();
    }

    // The OTP is now invalidated — even a correct code would be rejected.
    const doc = await Otp.findOne({ email });
    expect(doc.invalidated).toBe(true);

    await expect(otpService.verifyOtp(email, "000000")).rejects.toThrow(
      /max|invalid|expired/i,
    );
  });

  test("per-email rate limit: >3 requests in 15 min is blocked", async () => {
    const email = nextEmail();
    await requestOtpRaw(email);
    await requestOtpRaw(email);
    await requestOtpRaw(email);

    await expect(otpService.requestOtp(email, "1.2.3.4")).rejects.toThrow(
      /too many otp requests/i,
    );
  });

  test("per-IP rate limit: rotating emails from one IP is blocked (Fix 5)", async () => {
    // 3 different emails, same IP.
    await requestOtpRaw(nextEmail(), "9.9.9.9");
    await requestOtpRaw(nextEmail(), "9.9.9.9");
    await requestOtpRaw(nextEmail(), "9.9.9.9");

    // 4th request from the same IP is blocked even for a fresh email.
    await expect(otpService.requestOtp(nextEmail(), "9.9.9.9")).rejects.toThrow(
      /too many otp requests/i,
    );
  });

  test("per-IP limit does not block a different IP", async () => {
    await requestOtpRaw(nextEmail(), "5.5.5.5");
    await requestOtpRaw(nextEmail(), "5.5.5.5");
    await requestOtpRaw(nextEmail(), "5.5.5.5");

    // A different IP is not blocked.
    const result = await otpService.requestOtp(nextEmail(), "6.6.6.6");
    expect(result.success).toBe(true);
  });
});
