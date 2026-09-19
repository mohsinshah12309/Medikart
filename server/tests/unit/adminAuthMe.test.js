jest.setTimeout(60000);
require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const Pharmacy = require("../../src/modules/pharmacies/pharmacy.model");

describe("Admin Session & Profile Synchronization (/api/v1/auth/admin/me)", () => {
  let superAdminUser;
  let subAdminUser;
  let superAdminToken;
  let subAdminToken;
  let testPharmacy;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medikart";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    await AdminUser.deleteMany({ email: { $in: ["test_super@medikart.pk", "test_sub@medikart.pk"] } });
    await Pharmacy.deleteMany({ code: "TEST-PHARM-AUTH" });

    testPharmacy = await Pharmacy.create({
      name: "Test Auth Pharmacy Branch",
      code: "TEST-PHARM-AUTH",
      city: "Lahore",
      address: "123 Main Blvd",
      phone: "03001234567",
      active: true,
    });

    superAdminUser = await AdminUser.create({
      name: "Test Super Admin",
      email: "test_super@medikart.pk",
      passwordHash: "$2b$12$dummyhashforauthmetestxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      role: "super_admin",
      permissions: [],
      active: true,
    });

    subAdminUser = await AdminUser.create({
      name: "Test Sub Admin",
      email: "test_sub@medikart.pk",
      passwordHash: "$2b$12$dummyhashforauthmetestxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      role: "admin",
      permissions: ["view_orders", "manage_orders"],
      assignedPharmacyId: testPharmacy._id,
      active: true,
    });

    const secret = process.env.JWT_SECRET || "test-jwt-secret";
    superAdminToken = jwt.sign(
      { sub: superAdminUser._id.toString(), role: "super_admin", email: superAdminUser.email },
      secret,
      { expiresIn: "1h" }
    );
    subAdminToken = jwt.sign(
      { sub: subAdminUser._id.toString(), role: "admin", email: subAdminUser.email },
      secret,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await AdminUser.deleteMany({ email: { $in: ["test_super@medikart.pk", "test_sub@medikart.pk"] } });
    await Pharmacy.deleteMany({ code: "TEST-PHARM-AUTH" });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test("1. Superadmin GET /auth/admin/me returns role=super_admin with full identity", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin/me")
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.admin.id).toBe(superAdminUser._id.toString());
    expect(res.body.data.admin.role).toBe("super_admin");
    expect(res.body.data.admin.email).toBe("test_super@medikart.pk");
    expect(res.body.data.admin.name).toBe("Test Super Admin");
  });

  test("2. Subadmin GET /auth/admin/me returns role=admin with exact assigned permissions & branch", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin/me")
      .set("Authorization", `Bearer ${subAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.admin.id).toBe(subAdminUser._id.toString());
    expect(res.body.data.admin.role).toBe("admin");
    expect(res.body.data.admin.permissions).toEqual(["view_orders", "manage_orders"]);
    expect(res.body.data.admin.assignedPharmacyId).toBe(testPharmacy._id.toString());
  });

  test("3. Unauthenticated request to /auth/admin/me is rejected with 401", async () => {
    const res = await request(app).get("/api/v1/auth/admin/me");
    expect(res.status).toBe(401);
  });

  test("4. Inactive or deleted admin is immediately rejected with 401 on /auth/admin/me", async () => {
    subAdminUser.active = false;
    await subAdminUser.save();

    const res = await request(app)
      .get("/api/v1/auth/admin/me")
      .set("Authorization", `Bearer ${subAdminToken}`);

    expect(res.status).toBe(401);
  });
});
