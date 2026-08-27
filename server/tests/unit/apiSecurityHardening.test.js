/**
 * apiSecurityHardening.test.js — API Security, Rate Limiting & Abuse Protection tests.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");
const PasswordReset = require("../../src/modules/admin-users/passwordReset.model");
const Otp = require("../../src/modules/otp/otp.model");
const City = require("../../src/modules/cities/city.model");
const { resetRateLimiters } = require("../../src/middleware/rateLimiter");

// Mock SMTP sendEmail so it doesn't try to connect to a real SMTP server
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mock-id" }),
}));

// Mock Google Sheets Sync queue
jest.mock("../../src/modules/integrations/sheetsSyncQueue", () => ({
  enqueueSheetSync: jest.fn().mockResolvedValue(true),
}));

const smtpMock = require("../../src/integrations/smtp");
const otpService = require("../../src/modules/otp/otp.service");

let superAdminUser;
let regularAdminUser;
let superAdminToken;
let regularAdminToken;
let jwtSecret;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  // Clear collections
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await PasswordReset.deleteMany({});
  await Otp.deleteMany({});
  await City.deleteMany({});
  
  // Seed active city
  await City.create({
    name: "Lahore",
    slug: "lahore",
    deliveryCharge: 100,
    active: true,
  });
  
  // Reset custom rate limiters
  resetRateLimiters();
  otpService._resetIpRequestLog();

  jwtSecret = process.env.JWT_SECRET || "test-secret";

  // Create testing users
  superAdminUser = await AdminUser.create({
    name: "Super Admin",
    email: "super@test.com",
    role: "super_admin",
    permissions: ["products", "orders", "narcotics_approval", "reports", "settings"],
    passwordHash: "$2a$12$dummyhashformanytests",
    active: true,
  });

  regularAdminUser = await AdminUser.create({
    name: "Regular Admin",
    email: "admin@test.com",
    role: "admin",
    permissions: ["products"],
    passwordHash: "$2a$12$dummyhashformanytests",
    active: true,
  });

  superAdminToken = jwt.sign(
    { sub: superAdminUser._id.toString(), role: "super_admin", email: superAdminUser.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  regularAdminToken = jwt.sign(
    { sub: regularAdminUser._id.toString(), role: "admin", email: regularAdminUser.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  smtpMock.sendEmail.mockClear();
});

afterAll(async () => {
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await PasswordReset.deleteMany({});
  await Otp.deleteMany({});
  await City.deleteMany({});
  await mongoose.connection.close();
});

describe("API Security Hardening, Rate Limiting & Abuse Protection", () => {
  
  // ── RATE LIMITING TESTS ───────────────────────────────────────────────────
  describe("Rate Limiting", () => {
    
    test("1. authentication endpoint rate limit: blocks excess requests", async () => {
      // Limit is 5 requests per 15 minutes.
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/v1/auth/admin/login")
          .send({ email: "test@test.com", password: "password123" });
        expect(res.status).not.toBe(429);
      }

      // 6th request must be rate limited
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "test@test.com", password: "password123" });
      expect(res.status).toBe(429);
    });

    test("2. repeated login attempts are throttled", async () => {
      // Ensure rate limiter works specifically for login path
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/v1/auth/admin/login")
          .send({ email: "nonexistent@test.com", password: "wrong" });
        expect(res.status).not.toBe(429);
      }
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "nonexistent@test.com", password: "wrong" });
      expect(res.status).toBe(429);
      expect(res.body.message).toMatch(/Too many attempts/i);
    });

    test("3. OTP request rate limit: blocks requests after limit", async () => {
      // HTTP OTP limit is 5 requests per 15 minutes.
      // Note: service has limit 3, so we verify HTTP level throttling triggers at 5.
      // In order to not trigger the email level limit of 3, we request for different emails
      // from the same IP to target the IP rate limiters.
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/v1/otp/request")
          .send({ email: `user${i}@test.com` });
        expect(res.status).not.toBe(429);
      }

      const res = await request(app)
        .post("/api/v1/otp/request")
        .send({ email: "another@test.com" });
      expect(res.status).toBe(429);
    });

    test("4. OTP verification attempt protection: invalidates after 4 wrong attempts", async () => {
      // Request an OTP code
      const otpRes = await otpService.requestOtp("customer@test.com", "192.168.1.1");
      const code = otpRes._testCode;
      expect(code).toBeDefined();

      // Submit 4 incorrect verification codes
      for (let i = 0; i < 3; i++) {
        await expect(otpService.verifyOtp("customer@test.com", "000000")).rejects.toThrow("Invalid verification code");
      }
      
      // 4th incorrect verification invalidates OTP and throws attempt exceeded
      await expect(otpService.verifyOtp("customer@test.com", "000000")).rejects.toThrow("Maximum verification attempts exceeded");

      // Validating with correct code now fails
      await expect(otpService.verifyOtp("customer@test.com", code)).rejects.toThrow("OTP expired or invalid");
    });

    test("5. password reset request rate limit", async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/v1/auth/admin/forgot-password")
          .send({ email: "super@test.com" });
        expect(res.status).not.toBe(429);
      }

      const res = await request(app)
        .post("/api/v1/auth/admin/forgot-password")
        .send({ email: "super@test.com" });
      expect(res.status).toBe(429);
    });

    test("6. legitimate request remains possible within allowed limits", async () => {
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "super@test.com", password: "password123" });
      expect(res.status).not.toBe(429);
    });

    test("7. rate-limit response is safe and does not expose internals", async () => {
      // Trigger rate limit
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/v1/auth/admin/login").send({});
      }
      const res = await request(app).post("/api/v1/auth/admin/login").send({});
      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        status: "error",
        message: "Too many attempts. Please try again in 15 minutes."
      });
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    test("8. two different admins from the same IP get independent counters", async () => {
      const superAdminUser2 = await AdminUser.create({
        name: "Second Super Admin",
        email: "super2@test.com",
        role: "super_admin",
        permissions: ["products", "orders", "narcotics_approval", "reports", "settings"],
        passwordHash: "$2a$12$dummyhashformanytests",
        active: true,
      });

      const superAdminToken2 = jwt.sign(
        { sub: superAdminUser2._id.toString(), role: "super_admin", email: superAdminUser2.email },
        jwtSecret,
        { expiresIn: "1h" }
      );

      // Admin 1 (superAdminToken) from IP 1.1.1.1 hits /api/v1/admin/users 20 times (adminLimiter limit is 20)
      for (let i = 0; i < 20; i++) {
        const res = await request(app)
          .get("/api/v1/admin/users")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .set("x-forwarded-for", "1.1.1.1");
        expect(res.status).not.toBe(429);
      }

      // 21st request for Admin 1 gets 429
      const res1Blocked = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .set("x-forwarded-for", "1.1.1.1");
      expect(res1Blocked.status).toBe(429);

      // Admin 2 (superAdminToken2) from the same IP 1.1.1.1 hits /api/v1/admin/users
      // Since they have a different admin ID, their counter should be independent and they succeed (200)
      const res2Succeed = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken2}`)
        .set("x-forwarded-for", "1.1.1.1");
      expect(res2Succeed.status).toBe(200);
    });

    test("9. the same admin from two different IPs shares one counter", async () => {
      // Using superAdminToken (fresh counter due to beforeEach)
      // Limit is 20. Make 10 requests from IP 2.2.2.2 and 10 requests from IP 3.3.3.3
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get("/api/v1/admin/users")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .set("x-forwarded-for", "2.2.2.2");
        expect(res.status).not.toBe(429);
      }

      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get("/api/v1/admin/users")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .set("x-forwarded-for", "3.3.3.3");
        expect(res.status).not.toBe(429);
      }

      // 21st request from either IP should get 429
      const resBlocked = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .set("x-forwarded-for", "3.3.3.3");
      expect(resBlocked.status).toBe(429);
    });

    test("10. rate-limited request sets a reasonable Retry-After header", async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/v1/auth/admin/login").send({});
      }

      const res = await request(app).post("/api/v1/auth/admin/login").send({});
      expect(res.status).toBe(429);
      expect(res.headers["retry-after"]).toBeDefined();
      
      const retryAfter = parseInt(res.headers["retry-after"], 10);
      expect(Number.isInteger(retryAfter)).toBe(true);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(15 * 60);
    });
  });

  // ── REQUEST HARDENING TESTS ────────────────────────────────────────────────
  describe("Request Hardening", () => {
    
    test("8. oversized JSON request rejected with 413", async () => {
      // Create an oversized body > 2MB
      const largeData = "x".repeat(2.1 * 1024 * 1024);
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .set("Content-Type", "application/json")
        .send(`{"data":"${largeData}"}`);
      
      expect(res.status).toBe(413);
      expect(res.body.status).toBe("error");
    });

    test("9. invalid request body rejected safely with 400", async () => {
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .set("Content-Type", "application/json")
        .send("{invalidJson}");
      
      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });

    test("10. invalid pagination values rejected/normalized", async () => {
      const res = await request(app)
        .get("/api/v1/admin/products?page=-1&limit=abc")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/Validation failed/i);
    });

    test("11. excessive page size capped/rejected", async () => {
      const res = await request(app)
        .get("/api/v1/admin/products?limit=150")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/Validation failed/i);
    });
  });

  // ── CORS TESTS ────────────────────────────────────────────────────────────
  describe("CORS Security", () => {
    
    test("12. allowed origin succeeds", async () => {
      // Setup dynamic ALLOWED_ORIGINS
      process.env.ALLOWED_ORIGINS = "http://localhost:3000,https://app.medikart.pk";
      const res = await request(app)
        .get("/health")
        .set("Origin", "https://app.medikart.pk");

      expect(res.headers["access-control-allow-origin"]).toBe("https://app.medikart.pk");
    });

    test("13. unauthorized origin is rejected according to configuration in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://app.medikart.pk";

      const res = await request(app)
        .get("/health")
        .set("Origin", "https://malicious.com");

      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
      process.env.NODE_ENV = originalEnv;
    });

    test("14. credentials are not allowed with wildcard origin", async () => {
      process.env.ALLOWED_ORIGINS = "https://app.medikart.pk";
      const res = await request(app)
        .get("/health")
        .set("Origin", "https://app.medikart.pk");

      expect(res.headers["access-control-allow-credentials"]).toBe("true");
      expect(res.headers["access-control-allow-origin"]).not.toBe("*");
    });
  });

  // ── HTTP HEADERS TESTS ────────────────────────────────────────────────────
  describe("HTTP Headers", () => {
    
    test("15. expected security headers are present", async () => {
      const res = await request(app).get("/health");
      
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(res.headers["content-security-policy"]).toBeDefined();
    });
  });

  // ── ERROR SECURITY TESTS ──────────────────────────────────────────────────
  describe("Error Security", () => {
    
    test("16. malformed request does not expose stack trace", async () => {
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .set("Content-Type", "application/json")
        .send("{invalidJson}");

      expect(res.body.stack).toBeUndefined();
      expect(res.body.message).not.toMatch(/node_modules/i);
    });

    test("17. database-style internal error does not leak sensitive details", async () => {
      const err = new mongoose.Error.CastError("ObjectId", "invalid-id", "id");
      const req = { id: "test-req-id" };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const errorHandler = require("../../src/middleware/errorHandler");
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Invalid id: invalid-id",
        })
      );
    });

    test("18. authentication error does not leak account information", async () => {
      const res = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "nonexistent@test.com", password: "password" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });

  // ── ADMIN SECURITY TESTS ──────────────────────────────────────────────────
  describe("Admin Security", () => {
    
    test("19. regular admin is unable to perform Super Admin operations", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(403);
    });

    test("20. admin endpoint rate limiting/abuse protection works", async () => {
      // Max limit for admin users endpoint is 20 requests
      for (let i = 0; i < 20; i++) {
        const res = await request(app)
          .get("/api/v1/admin/users")
          .set("Authorization", `Bearer ${superAdminToken}`);
        expect(res.status).not.toBe(429);
      }

      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(res.status).toBe(429);
    });

    test("21. Activity Logging still occurs for successful admin mutations", async () => {
      // Super Admin creates a new admin user
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Admin",
          email: "newadmin@test.com",
          role: "admin",
          permissions: ["products"],
        });

      expect(res.status).toBe(201);
      
      // Verify activity log is created
      const logs = await ActivityLog.find({ action: "admin_user_created" });
      expect(logs.length).toBe(1);
      expect(logs[0].actor.email).toBe("super@test.com");
    });
  });

  // ── UPLOAD SECURITY TESTS ─────────────────────────────────────────────────
  describe("Upload Security", () => {
    
    test("22. oversized upload is rejected", async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const res = await request(app)
        .post("/api/v1/orders/instant")
        .attach("prescription", largeBuffer, "prescription.jpg");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/File too large/i);
    });

    test("23. invalid file type rejected", async () => {
      const dummyFile = Buffer.from("console.log('malicious script')", "utf-8");
      
      const res = await request(app)
        .post("/api/v1/orders/instant")
        .attach("prescription", dummyFile, "malicious.js");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Prescription must be a JPEG, PNG, or PDF/i);
    });

    test("24. spoofed file (renamed .exe) rejected via content magic bytes", async () => {
      const spoofedExe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"); // MZ header for exe
      const email = "customer24@test.com";
      const otpRes = await otpService.requestOtp(email, "192.168.1.99");
      const otpCode = otpRes._testCode;

      const res = await request(app)
        .post("/api/v1/orders/instant")
        .field("customer", JSON.stringify({
          name: "John Doe",
          email,
          phone: "03001234567",
          address: "123 Test Street",
          city: "Lahore",
        }))
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email, code: otpCode }))
        .attach("prescription", spoofedExe, {
          filename: "spoofed.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Prescription file content is not a valid/i);
    });

    test("25. path traversal filename is rejected/safely handled", async () => {
      const realImage = Buffer.from("\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C", "binary");
      const email = "customer25@test.com";
      const otpRes = await otpService.requestOtp(email, "192.168.1.98");
      const otpCode = otpRes._testCode;

      const res = await request(app)
        .post("/api/v1/orders/instant")
        .field("customer", JSON.stringify({
          name: "John Doe",
          email,
          phone: "03001234567",
          address: "123 Test Street",
          city: "Lahore",
        }))
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email, code: otpCode }))
        .attach("prescription", realImage, "../../../traversal.jpg");

      expect(res.status).toBe(201); // Safe filename is generated, traversal is prevented
      const order = res.body.data.order;
      expect(order.prescriptionUrl).not.toContain("traversal");
    });
  });

  // ── REGRESSION TESTS ──────────────────────────────────────────────────────
  describe("Regressions", () => {
    
    test("26. existing OTP security behavior remains intact", async () => {
      process.env.ENABLE_OTP_LIMITS_IN_TESTS = "true";
      try {
        // request OTP limit: same email > 3 requests in 15 mins is blocked at service level
        // We use different IPs for the first 3 requests so we hit the email limit instead of the IP limit
        await otpService.requestOtp("client@test.com", "192.168.1.10");
        await otpService.requestOtp("client@test.com", "192.168.1.11");
        await otpService.requestOtp("client@test.com", "192.168.1.12");

        await expect(otpService.requestOtp("client@test.com", "192.168.1.13")).rejects.toThrow(
          "Too many OTP requests for this email. Please wait 15 minutes before trying again."
        );
      } finally {
        delete process.env.ENABLE_OTP_LIMITS_IN_TESTS;
      }
    });

    test("27. existing authentication tests remain intact (JWT signature verification works)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).not.toBe(401);
    });

    test("28. existing Admin User Management tests remain intact (demote last super admin safeguard)", async () => {
      // Demoting the last remaining active Super Admin is rejected
      const res = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ role: "admin" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/(cannot deactivate or demote|cannot demote or deactivate|demote or deactivate)/i);
    });

    test("29. existing Admin Auth tests remain intact (JWT secret check on start)", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const res = await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(500); // JWT_SECRET misconfigured is a 500 error
      
      process.env.JWT_SECRET = originalSecret;
    });
  });
});
