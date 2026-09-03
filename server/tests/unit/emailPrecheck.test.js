/**
 * emailPrecheck.test.js — Unit & Integration tests for Email Pre-Check Gate.
 *
 * Verifies:
 * 1. Syntax and domain typo suggestions (e.g. gmial.com -> gmail.com, yaho.com -> yahoo.com).
 * 2. DNS MX record validation (catches non-existent domains and domains without MX records).
 * 3. Safe DNS fail-open posture on timeout/transient network errors (never blocks legitimate users).
 * 4. Rate limiting protection: pre-check catches do NOT count against rate limits.
 * 5. Full OTP request flow integration via otpService.
 */

jest.setTimeout(60000);

require("dotenv").config();

const dns = require("dns").promises;
const mongoose = require("mongoose");
const Otp = require("../../src/modules/otp/otp.model");
const otpService = require("../../src/modules/otp/otp.service");
const emailPrecheck = require("../../src/utils/emailPrecheck");
const { BadRequestError } = require("../../src/utils/errors");

// Mock SMTP delivery so tests never send actual emails
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "mock-smtp-message-id" }),
}));

beforeAll(async () => {
  process.env.ENABLE_OTP_LIMITS_IN_TESTS = "true";
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
  jest.restoreAllMocks();
});

afterAll(async () => {
  await Otp.deleteMany({});
  await mongoose.connection.close();
}, 90000);

describe("Email Pre-check: Typo Detection", () => {
  test("detects common Gmail typos and suggests correct domain", () => {
    const cases = [
      { input: "john.doe@gmial.com", expected: "john.doe@gmail.com" },
      { input: "user@gamil.com", expected: "user@gmail.com" },
      { input: "patient@gmaill.com", expected: "patient@gmail.com" },
      { input: "customer@gmai.com", expected: "customer@gmail.com" },
      { input: "test@gmail.con", expected: "test@gmail.com" },
    ];

    for (const { input, expected } of cases) {
      const result = emailPrecheck.checkDomainTypo(input);
      expect(result).not.toBeNull();
      expect(result.hasTypo).toBe(true);
      expect(result.suggestedEmail).toBe(expected);
      expect(result.suggestedDomain).toBe("gmail.com");
      expect(result.message).toBe(`Did you mean ${expected}?`);
    }
  });

  test("detects Yahoo, Hotmail, and Outlook typos", () => {
    const cases = [
      { input: "user@yaho.com", expected: "user@yahoo.com" },
      { input: "user@yhaoo.com", expected: "user@yahoo.com" },
      { input: "user@hotmial.com", expected: "user@hotmail.com" },
      { input: "user@outlok.com", expected: "user@outlook.com" },
      { input: "user@outloo.com", expected: "user@outlook.com" },
    ];

    for (const { input, expected } of cases) {
      const result = emailPrecheck.checkDomainTypo(input);
      expect(result).not.toBeNull();
      expect(result.hasTypo).toBe(true);
      expect(result.suggestedEmail).toBe(expected);
    }
  });

  test("returns null for correctly spelled popular domains", () => {
    expect(emailPrecheck.checkDomainTypo("test@gmail.com")).toBeNull();
    expect(emailPrecheck.checkDomainTypo("test@yahoo.com")).toBeNull();
    expect(emailPrecheck.checkDomainTypo("test@hotmail.com")).toBeNull();
    expect(emailPrecheck.checkDomainTypo("test@outlook.com")).toBeNull();
  });

  test("returns null for custom corporate/organization domains", () => {
    expect(emailPrecheck.checkDomainTypo("admin@hospital.org.pk")).toBeNull();
    expect(emailPrecheck.checkDomainTypo("doctor@shaukatkhanum.org.pk")).toBeNull();
  });
});

describe("Email Pre-check: DNS MX Record Validation", () => {
  test("accepts valid domains with genuine MX records (e.g. gmail.com)", async () => {
    const result = await emailPrecheck.checkMxRecord("gmail.com");
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.records)).toBe(true);
    expect(result.records.length).toBeGreaterThan(0);
  });

  test("accepts a less common but valid domain with genuine MX records (e.g. protonmail.com)", async () => {
    const result = await emailPrecheck.checkMxRecord("protonmail.com");
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.records)).toBe(true);
  });

  test("rejects non-existent domain without MX records (ENOTFOUND)", async () => {
    const fakeDomain = "thisdomaindefinitelydoesnotexist999888777xyz.com";
    const result = await emailPrecheck.checkMxRecord(fakeDomain);
    expect(result.valid).toBe(false);
    expect(["ENOTFOUND", "ENODATA", "NO_MX_RECORDS"]).toContain(result.reason);
  });

  test("rejects domain with Null MX record (RFC 7505)", async () => {
    jest.spyOn(dns, "resolveMx").mockResolvedValueOnce([{ exchange: "", priority: 0 }]);
    const result = await emailPrecheck.checkMxRecord("nullmxdomain.com");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("NULL_MX_RECORD");
  });

  test("fails open on DNS timeout / transient network errors (does not block user)", async () => {
    // Simulate DNS timeout
    jest.spyOn(dns, "resolveMx").mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        const err = new Error("queryMx ESERVFAIL");
        err.code = "ESERVFAIL";
        setTimeout(() => reject(err), 50);
      });
    });

    const result = await emailPrecheck.checkMxRecord("flaky-dns-domain.com", 200);
    expect(result.valid).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("DNS_LOOKUP_TRANSIENT_ERROR");
  });
});

describe("OTP Service Integration with Pre-check Gate", () => {
  test("common Gmail typo returns suggestion response WITHOUT generating or sending OTP", async () => {
    const typoEmail = "alex.smith@gmial.com";
    const result = await otpService.requestOtp(typoEmail, "192.168.1.100");

    expect(result.success).toBe(false);
    expect(result.needsConfirmation).toBe(true);
    expect(result.suggestion).toBe("alex.smith@gmail.com");
    expect(result.message).toBe("Did you mean alex.smith@gmail.com?");

    // Verify NO OTP document was created in MongoDB
    const otpDoc = await Otp.findOne({ email: typoEmail });
    expect(otpDoc).toBeNull();
  });

  test("user can override typo suggestion and proceed with overrideSuggestion flag", async () => {
    const typoEmail = "alex.smith@gmial.com";
    // Mock MX check to return valid records so the override flag proceeds through OTP generation
    jest.spyOn(dns, "resolveMx").mockResolvedValueOnce([
      { exchange: "mail.gmial.com", priority: 10 },
    ]);

    const result = await otpService.requestOtp(typoEmail, "192.168.1.101", {
      overrideSuggestion: true,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Verification code sent to email");

    // OTP document is created
    const otpDoc = await Otp.findOne({ email: typoEmail });
    expect(otpDoc).not.toBeNull();
  });

  test("domain with no MX record is rejected with BadRequestError WITHOUT generating OTP", async () => {
    const badEmail = "fakeuser@thisdomaindefinitelydoesnotexist999888777xyz.com";

    await expect(otpService.requestOtp(badEmail, "192.168.1.102")).rejects.toThrow(
      BadRequestError
    );

    // Verify NO OTP document was created in MongoDB
    const otpDoc = await Otp.findOne({ email: badEmail });
    expect(otpDoc).toBeNull();
  });

  test("rate limit is NOT burned when a request is caught by typo or invalid domain pre-check", async () => {
    const testIp = "203.0.113.42";
    const typoEmail = "typo.user@gmial.com";
    const invalidDomainEmail = "user@invalid-no-mx-domain.org";

    // 1. Send 5 typo requests from testIp (over the 3 attempt IP limit if it were counted)
    for (let i = 0; i < 5; i++) {
      const res = await otpService.requestOtp(typoEmail, testIp);
      expect(res.needsConfirmation).toBe(true);
    }

    // Mock resolveMx to fail with ENOTFOUND for the invalid domain test loop
    jest.spyOn(dns, "resolveMx").mockRejectedValue({ code: "ENOTFOUND", message: "queryMx ENOTFOUND" });

    // 2. Send 5 invalid domain requests from testIp
    for (let i = 0; i < 5; i++) {
      await expect(otpService.requestOtp(invalidDomainEmail, testIp)).rejects.toThrow(
        BadRequestError
      );
    }

    jest.restoreAllMocks();

    // 3. Now send 3 legitimate requests for valid test emails from the same testIp
    // Because the pre-checks bypassed rate limiter counting, the user still has all 3 attempts!
    const valid1 = await otpService.requestOtp("legit-1@test.com", testIp);
    expect(valid1.success).toBe(true);

    const valid2 = await otpService.requestOtp("legit-2@test.com", testIp);
    expect(valid2.success).toBe(true);

    const valid3 = await otpService.requestOtp("legit-3@test.com", testIp);
    expect(valid3.success).toBe(true);

    // 4. The 4th legitimate request should now hit the rate limit as expected
    await expect(otpService.requestOtp("legit-4@test.com", testIp)).rejects.toThrow(
      /Too many OTP requests/i
    );
  });

  test("genuine valid emails proceed through existing OTP flow end-to-end unaffected", async () => {
    const validEmail = "realuser@test.com";
    const ip = "192.168.1.105";

    const requestRes = await otpService.requestOtp(validEmail, ip);
    expect(requestRes.success).toBe(true);
    expect(requestRes._testCode).toMatch(/^\d{6}$/);

    // Verify OTP document exists
    const doc = await Otp.findOne({ email: validEmail });
    expect(doc).not.toBeNull();

    // Verify OTP code successfully verifies
    const verifyRes = await otpService.verifyOtp(validEmail, requestRes._testCode);
    expect(verifyRes.verified).toBe(true);
  });
});
