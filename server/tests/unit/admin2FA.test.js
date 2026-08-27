/**
 * admin2FA.test.js
 * Integration/Unit tests for Two-Factor Authentication (Phase 28 requirement).
 */

jest.setTimeout(60000);

require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const speakeasy = require("speakeasy");
const app = require("../../src/app");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const adminUserService = require("../../src/modules/admin-users/adminUser.service");

const TEST_EMAIL = "2fa-test@test.com";
const TEST_PASSWORD = "Password123!";
let adminToken = "";
let tempToken = "";
let adminId = "";

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);

  await AdminUser.deleteMany({ email: TEST_EMAIL });

  // Create an active admin user
  const passwordHash = await adminUserService.hashPassword(TEST_PASSWORD);
  const user = await AdminUser.create({
    name: "2FA Test Admin",
    email: TEST_EMAIL,
    role: "admin",
    passwordHash,
    active: true,
  });
  adminId = user._id.toString();
});

afterAll(async () => {
  await AdminUser.deleteMany({ email: TEST_EMAIL });
  await mongoose.connection.close();
});

describe("Admin Two-Factor Authentication (2FA) API Flow", () => {
  test("1. Login succeeds without 2FA initially", async () => {
    const res = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.requires2FA).toBeUndefined();
    adminToken = res.body.data.token;
  });

  test("2. GET /2fa/setup returns QR code and setupToken", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin/2fa/setup")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.qrCodeUrl).toBeDefined();
    expect(res.body.data.secret).toBeDefined();
    expect(res.body.data.setupToken).toBeDefined();
  });

  test("3. POST /2fa/confirm fails with invalid code", async () => {
    // Get setup credentials
    const setupRes = await request(app)
      .get("/api/v1/auth/admin/2fa/setup")
      .set("Authorization", `Bearer ${adminToken}`);

    const { setupToken } = setupRes.body.data;

    const confirmRes = await request(app)
      .post("/api/v1/auth/admin/2fa/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "000000", setupToken });

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.message).toContain("Setup verification failed");
  });

  test("4. POST /2fa/confirm succeeds with valid TOTP code", async () => {
    const setupRes = await request(app)
      .get("/api/v1/auth/admin/2fa/setup")
      .set("Authorization", `Bearer ${adminToken}`);

    const { secret, setupToken } = setupRes.body.data;
    const validCode = speakeasy.totp({ secret, encoding: "base32" });

    const confirmRes = await request(app)
      .post("/api/v1/auth/admin/2fa/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: validCode, setupToken });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe("success");

    // Verify 2FA secret is saved in database
    const user = await AdminUser.findById(adminId).select("+twoFactorSecret");
    expect(user.twoFactorSecret).toBe(secret);
  });

  test("5. Login now requires 2FA and returns tempToken", async () => {
    const res = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.requires2FA).toBe(true);
    expect(res.body.data.tempToken).toBeDefined();
    expect(res.body.data.token).toBeUndefined();
    tempToken = res.body.data.tempToken;
  });

  test("6. POST /verify-2fa fails with incorrect code", async () => {
    const res = await request(app)
      .post("/api/v1/auth/admin/verify-2fa")
      .send({ code: "999999", tempToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid 2FA code");
  });

  test("7. POST /verify-2fa succeeds with correct TOTP code", async () => {
    const user = await AdminUser.findById(adminId).select("+twoFactorSecret");
    const validCode = speakeasy.totp({ secret: user.twoFactorSecret, encoding: "base32" });

    const res = await request(app)
      .post("/api/v1/auth/admin/verify-2fa")
      .send({ code: validCode, tempToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.admin.email).toBe(TEST_EMAIL);
    adminToken = res.body.data.token;
  });

  test("8. POST /2fa/disable fails with invalid code", async () => {
    const res = await request(app)
      .post("/api/v1/auth/admin/2fa/disable")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Verification failed");
  });

  test("9. POST /2fa/disable succeeds with valid code", async () => {
    const user = await AdminUser.findById(adminId).select("+twoFactorSecret");
    const validCode = speakeasy.totp({ secret: user.twoFactorSecret, encoding: "base32" });

    const res = await request(app)
      .post("/api/v1/auth/admin/2fa/disable")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: validCode });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");

    // Verify twoFactorSecret is cleared
    const userAfter = await AdminUser.findById(adminId).select("+twoFactorSecret");
    expect(userAfter.twoFactorSecret).toBeUndefined();
  });

  test("10. Super Admin can reset another admin's 2FA", async () => {
    // 1. Re-enable 2FA
    const setupRes = await request(app)
      .get("/api/v1/auth/admin/2fa/setup")
      .set("Authorization", `Bearer ${adminToken}`);

    const { secret, setupToken } = setupRes.body.data;
    const validCode = speakeasy.totp({ secret, encoding: "base32" });

    await request(app)
      .post("/api/v1/auth/admin/2fa/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: validCode, setupToken });

    // 2. Perform reset as Super Admin (stubbing req.admin role/middleware via temp Super Admin credentials)
    // Let's create a Super Admin account
    const superPassHash = await adminUserService.hashPassword(TEST_PASSWORD);
    const superAdmin = await AdminUser.create({
      name: "Temp Super Admin",
      email: "super-temp@test.com",
      role: "super_admin",
      passwordHash: superPassHash,
      active: true,
    });

    const superLoginRes = await request(app)
      .post("/api/v1/auth/admin/login")
      .send({ email: "super-temp@test.com", password: TEST_PASSWORD });

    const superToken = superLoginRes.body.data.token;

    // Reset 2FA of the test admin
    const resetRes = await request(app)
      .post(`/api/v1/admin/users/${adminId}/reset-2fa`)
      .set("Authorization", `Bearer ${superToken}`);

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.status).toBe("success");

    // Verify target user has 2FA disabled
    const targetUser = await AdminUser.findById(adminId).select("+twoFactorSecret");
    expect(targetUser.twoFactorSecret).toBeUndefined();

    // Clean up Super Admin
    await AdminUser.deleteOne({ _id: superAdmin._id });
  });
});
