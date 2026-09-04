/**
 * productionReadiness.test.js
 *
 * Unit tests covering production config audit, safe error handling, health checks,
 * graceful shutdown lifecycle, and core security/business regressions.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");
const Order = require("../../src/modules/orders/order.model");
const { validateEnv } = require("../../src/config/env");

// Mock sheetsSyncQueue to avoid Sheets API calls and timers
jest.mock("../../src/modules/integrations/sheetsSyncQueue", () => {
  const original = jest.requireActual("../../src/modules/integrations/sheetsSyncQueue");
  return {
    ...original,
    enqueueSheetSync: jest.fn(),
  };
});

let superAdminUser;
let regularAdminUser;
let superAdminToken;
let regularAdminToken;
let jwtSecret;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

beforeEach(async () => {
  await AdminUser.deleteMany({ email: /@test-ready\.com$/ });
  await ActivityLog.deleteMany({ "actor.email": /@test-ready\.com$/ });
  await Order.deleteMany({ "customer.email": /@test-ready\.com$/ });

  jwtSecret = process.env.JWT_SECRET || "test-secret";

  superAdminUser = await AdminUser.create({
    name: "Super Admin Ready",
    email: "super@test-ready.com",
    role: "super_admin",
    permissions: ["products", "orders", "narcotics_approval", "reports", "settings"],
    passwordHash: "$2a$12$dummyhashformanytests",
    active: true,
  });

  regularAdminUser = await AdminUser.create({
    name: "Regular Admin Ready",
    email: "admin@test-ready.com",
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
});

afterAll(async () => {
  await AdminUser.deleteMany({ email: /@test-ready\.com$/ });
  await ActivityLog.deleteMany({ "actor.email": /@test-ready\.com$/ });
  await Order.deleteMany({ "customer.email": /@test-ready\.com$/ });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe("Production Readiness & Hardening", () => {

  describe("1. Environment & Config Validation", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    test("validateEnv rejects missing critical environment variables in production mode", () => {
      process.env.NODE_ENV = "production";
      delete process.env.MONGODB_URI;
      expect(() => validateEnv()).toThrow(/Missing critical production environment variables/i);
    });

    test("validateEnv rejects weak or default fallback JWT_SECRET", () => {
      process.env.NODE_ENV = "development"; // validates JWT_SECRET in non-test mode
      process.env.JWT_SECRET = "secret";
      expect(() => validateEnv()).toThrow(/JWT_SECRET is insecure/i);

      process.env.JWT_SECRET = "changeme";
      expect(() => validateEnv()).toThrow(/JWT_SECRET is insecure/i);

      process.env.JWT_SECRET = "development-secret";
      expect(() => validateEnv()).toThrow(/JWT_SECRET is insecure/i);

      process.env.JWT_SECRET = "short";
      expect(() => validateEnv()).toThrow(/JWT_SECRET is insecure/i);
    });

    test("validateEnv accepts strong, non-fallback JWT_SECRET", () => {
      process.env.NODE_ENV = "development";
      process.env.JWT_SECRET = "a_very_long_and_extremely_strong_secret_key_12345";
      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("2. Error Security & Stack Trace Protection", () => {
    test("unexpected errors do not leak stack traces or internals to client", async () => {
      // Accessing a malformed route / parameter triggers cast or validation error
      const res = await request(app)
        .put("/api/v1/admin/users/invalid-id-format")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.stack).toBeUndefined();
      expect(res.body.message).toMatch(/Validation failed/i);
    });
  });

  describe("3 & 4. Health Check Endpoint", () => {
    test("GET /health endpoint works and reports status safely without leaking credentials/mongo string", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.database).toBeDefined();
      
      const responseStr = JSON.stringify(res.body);
      expect(responseStr).not.toMatch(/mongodb/i);
      expect(responseStr).not.toMatch(/localhost/i);
      expect(responseStr).not.toMatch(/usr|pwd|secret/i);
    });
  });

  describe("5. Sensitive Configuration Exposure", () => {
    test("admin listings do not return password hashes or twoFactorSecrets", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);
      
      expect(res.status).toBe(200);
      res.body.data.forEach((user) => {
        expect(user.passwordHash).toBeUndefined();
        expect(user.twoFactorSecret).toBeUndefined();
      });
    });
  });

  describe("6. Graceful Shutdown & Resource Close", () => {
    test("graceful shutdown routines exist and can execute safely", async () => {
      const { waitForActiveJobs, _resetStatus } = require("../../src/modules/integrations/sheetsSyncQueue");
      const { stopWeeklyReport } = require("../../src/jobs/weeklyReport.job");

      _resetStatus();

      // Ensure active jobs waiting drains safely
      await expect(waitForActiveJobs(100)).resolves.not.toThrow();

      // Ensure cron stop doesn't crash
      expect(() => stopWeeklyReport()).not.toThrow();
    });
  });

  describe("7. Static File & Directory Security", () => {
    test("access to sensitive folders like prescriptions is blocked statically", async () => {
      const res = await request(app).get("/uploads/prescriptions/sensitive-prescription.jpg");
      expect(res.status).toBe(404);
    });
  });

  describe("8 & 9. Authentication & Super Admin Authorization", () => {
    test("admin authentication verifies credentials, and Super Admin authorization limits regular admin actions", async () => {
      // Super Admin listing works
      const superRes = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(superRes.status).toBe(200);

      // Regular Admin gets forbidden on management route
      const regRes = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${regularAdminToken}`);
      expect(regRes.status).toBe(403);
    });
  });

  describe("10. Rate Limiting", () => {
    test("rate limiter blocks excess requests with 429", async () => {
      const { resetRateLimiters } = require("../../src/middleware/rateLimiter");
      resetRateLimiters();

      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/v1/auth/admin/login")
          .send({ email: "nonexistent@test-ready.com", password: "password" });
        expect(res.status).toBe(401);
      }

      const resBlocked = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "nonexistent@test-ready.com", password: "password" });

      expect(resBlocked.status).toBe(429);
      expect(resBlocked.body.message).toMatch(/too many attempts/i);
    });
  });

  describe("11. Database Connection Failure Safety", () => {
    test("connectDB connection failure logs error and returns false without crashing", async () => {
      const { connectDB } = require("../../src/config/db");
      const originalUri = process.env.MONGODB_URI;
      
      // Close active connection first
      await mongoose.connection.close();

      // Temporarily overwrite MONGODB_URI to invalid string
      process.env.MONGODB_URI = "mongodb://invalid-cluster:27017/nonexistent";
      const result = await connectDB();
      expect(result).toBe(false);
      
      // Re-establish connection for subsequent tests
      process.env.MONGODB_URI = originalUri;
      await mongoose.connect(originalUri);
    });
  });

  describe("12. Activity Logging Integrity", () => {
    test("Activity Logging creates logs upon admin mutations", async () => {
      const payload = {
        name: "Logged Mutation Admin",
        email: "mutation@test-ready.com",
        role: "admin",
        permissions: [],
      };

      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send(payload);
      
      expect(res.status).toBe(201);

      const log = await ActivityLog.findOne({ 
        action: "admin_user_created", 
        entityId: res.body.data._id 
      });
      expect(log).toBeTruthy();
      expect(log.actor.id).toBe(superAdminUser._id.toString());
    });
  });

  describe("13 & 14. Core Order & Payment Regression Flow", () => {
    test("standard order placement works cleanly", async () => {
      const otpService = require("../../src/modules/otp/otp.service");
      const Otp = require("../../src/modules/otp/otp.model");
      const Product = require("../../src/modules/products/product.model");
      const Category = require("../../src/modules/categories/category.model");
      const City = require("../../src/modules/cities/city.model");

      const email = "customer@gmail.com";
      await Otp.deleteMany({ email });

      const otpResult = await otpService.requestOtp(email, "1.2.3.4");
      const rawOtp = otpResult._testCode;

      const testCity = await City.create({
        name: "Karachi",
        slug: "ready-city",
        deliveryCharge: 250,
        active: true,
      });

      const category = await Category.create({
        name: "General Ready",
        slug: "ready-cat",
        active: true,
      });

      const testProduct = await Product.create({
        name: "Paracetamol Ready",
        genericName: "Paracetamol",
        sku: "READY-SKU",
        categoryIds: [category._id],
        price: 15,
        isNarcotic: false,
        active: true,
        requiresPrescription: false,
      });

      const orderPayload = {
        type: "standard",
        customer: {
          name: "Ready Test Customer",
          email,
          phone: "+923009876543",
          address: "Medikart HQ",
          city: "Karachi",
        },
        items: [
          {
            productId: testProduct._id.toString(),
            quantity: 3,
          },
        ],
        totals: { subtotal: 45, deliveryCharge: 250, total: 295 },
        paymentMethod: "cod",
        otp: {
          email,
          code: rawOtp,
        },
      };

      const res = await request(app)
        .post("/api/v1/orders/standard")
        .send(orderPayload);
      
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.order._id).toBeDefined();

      // cleanup
      await Product.deleteOne({ _id: testProduct._id });
      await Category.deleteOne({ _id: category._id });
      await City.deleteOne({ _id: testCity._id });
    });
  });

});
