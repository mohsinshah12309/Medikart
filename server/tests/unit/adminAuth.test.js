/**
 * adminAuth.test.js — Audit Fix / Verification (PART B - Item 6).
 *
 * Tests admin authentication & authorization:
 *   1. 401 Unauthorized when requesting an admin route with no token.
 *   2. 401 Unauthorized when requesting with an invalid/malformed token.
 *   3. 403 Forbidden when a regular admin ("admin" role) attempts to access
 *      a route protected by requireSuperAdmin middleware.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const app = require("../../src/app");
const auth = require("../../src/middleware/auth");
const requireSuperAdmin = require("../../src/middleware/requireSuperAdmin");
const errorHandler = require("../../src/middleware/errorHandler");

const AdminUser = require("../../src/modules/admin-users/adminUser.model");

// Dummy Express app mounting requireSuperAdmin middleware for role test
const testApp = express();
testApp.use(express.json());
testApp.use("/admin", auth);
testApp.post("/admin/super-only", requireSuperAdmin, (req, res) => {
  res.status(200).json({ status: "success", message: "Allowed" });
});
testApp.use(errorHandler);

let regularAdminToken;
let superAdminToken;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);

  await AdminUser.deleteMany({ email: { $in: ["admin@test.com", "super@test.com"] } });

  const superAdminId = new mongoose.Types.ObjectId();
  const regularAdminId = new mongoose.Types.ObjectId();

  await AdminUser.create({
    _id: superAdminId,
    name: "Super Admin",
    email: "super@test.com",
    role: "super_admin",
    passwordHash: "dummy",
    active: true,
  });

  await AdminUser.create({
    _id: regularAdminId,
    name: "Regular Admin",
    email: "admin@test.com",
    role: "admin",
    passwordHash: "dummy",
    active: true,
  });

  const secret = process.env.JWT_SECRET || "test-secret";

  regularAdminToken = jwt.sign(
    { sub: regularAdminId.toString(), role: "admin", email: "admin@test.com" },
    secret,
    { expiresIn: "1h" },
  );

  superAdminToken = jwt.sign(
    { sub: superAdminId.toString(), role: "super_admin", email: "super@test.com" },
    secret,
    { expiresIn: "1h" },
  );
}, 90000);

afterAll(async () => {
  await AdminUser.deleteMany({ email: { $in: ["admin@test.com", "super@test.com"] } });
  await mongoose.connection.close();
}, 90000);

describe("Admin Authentication & Role Authorization (Phase 5 / Fix 6)", () => {
  describe("Authentication Middleware (auth.js)", () => {
    test("1. Returns 401 Unauthorized when Authorization header is missing", async () => {
      const res = await request(app).get("/api/v1/admin/orders");
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });

    test("2. Returns 401 Unauthorized when token is invalid or malformed", async () => {
      const res = await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });
  });

  describe("Super Admin Authorization Middleware (requireSuperAdmin.js)", () => {
    test("3. Returns 403 Forbidden when a regular admin attempts super-admin action", async () => {
      const res = await request(testApp)
        .post("/admin/super-only")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/Super Admin/i);
    });

    test("4. Allows access (200) when user has super_admin role", async () => {
      const res = await request(testApp)
        .post("/admin/super-only")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });
  });
});
