/**
 * prescriptionAccess.test.js — Audit Fix / Verification (PART A - Item 1).
 *
 * Tests prescription access control:
 *   1. Direct public request GET /uploads/prescriptions/:filename -> 404 (not served statically).
 *   2. Unauthenticated GET /api/v1/admin/prescriptions/:filename -> 401 (auth middleware blocks).
 *   3. Authenticated admin GET /api/v1/admin/prescriptions/:filename tied to a real order -> 200 (succeeds).
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Order = require("../../src/modules/orders/order.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");

const TEST_FILENAME = "test-access-prescription.jpg";
const PRESCRIPTIONS_DIR = path.join(
  __dirname,
  "../../uploads/prescriptions",
);
const TEST_FILE_PATH = path.join(PRESCRIPTIONS_DIR, TEST_FILENAME);

let adminToken;
let testOrder;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);

  // Clean up existing test order with this filename
  await Order.deleteMany({
    prescriptionUrl: { $regex: new RegExp(`${TEST_FILENAME}$`) },
  });

  // Clean up existing admin users in test DB
  await AdminUser.deleteMany({ email: "admin@medikart.pk" });

  const adminId = new mongoose.Types.ObjectId();

  await AdminUser.create({
    _id: adminId,
    name: "Test Admin",
    email: "admin@medikart.pk",
    role: "admin",
    passwordHash: "dummy",
    active: true,
  });

  // Create real prescription file on disk
  const validJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  await fs.mkdir(PRESCRIPTIONS_DIR, { recursive: true });
  await fs.writeFile(TEST_FILE_PATH, validJpeg);

  // Generate valid admin token
  const secret = process.env.JWT_SECRET || "test-secret";
  adminToken = jwt.sign(
    { sub: adminId.toString(), role: "admin", email: "admin@medikart.pk" },
    secret,
    { expiresIn: "1h" },
  );

  // Create real order in DB pointing to the prescription file
  testOrder = await Order.create({
    type: "instant",
    status: "awaiting-pharmacist-pricing",
    customer: {
      name: "Test Customer",
      email: "test-presc@example.com",
      phone: "+923001234567",
      address: "123 Test St",
      city: "Lahore",
    },
    paymentMethod: "cod",
    prescriptionUrl: `/uploads/prescriptions/${TEST_FILENAME}`,
    totals: { subtotal: 0, deliveryCharge: 250, total: 250 },
  });
}, 90000);

afterAll(async () => {
  if (testOrder) {
    await Order.deleteOne({ _id: testOrder._id });
  }
  await AdminUser.deleteMany({ email: "admin@medikart.pk" });
  try {
    await fs.unlink(TEST_FILE_PATH);
  } catch (err) {
    // Ignore if file doesn't exist
  }
  await mongoose.connection.close();
}, 90000);

describe("Prescription Access Control (Fix 1 / FR-SYS-02)", () => {
  test("1. Direct public static fetch returns 404 (not 200)", async () => {
    const res = await request(app).get(`/uploads/prescriptions/${TEST_FILENAME}`);
    expect(res.status).toBe(404);
  });

  test("2. Unauthenticated admin endpoint fetch returns 401", async () => {
    const res = await request(app).get(`/api/v1/admin/prescriptions/${TEST_FILENAME}`);
    expect(res.status).toBe(401);
  });

  test("3. Authenticated admin fetch with real order & file succeeds (200)", async () => {
    const res = await request(app)
      .get(`/api/v1/admin/prescriptions/${TEST_FILENAME}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/jpeg");
  });
});
