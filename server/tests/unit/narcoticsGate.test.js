/**
 * Phase 15 Test — Narcotics Order Workflow / Verification Gate.
 *
 * This is the single most compliance-critical test in the project
 * (PRD §12, §13.3, FR-CW-13/14, FR-AD-16, FR-AD-20).
 *
 * The four assertions (mirroring phases.md Phase 15 test case):
 *   1. A cart containing a Narcotics-flagged product CANNOT be submitted
 *      without a prescription file attached → rejected.
 *   2. The resulting order (submitted WITH a prescription) has
 *      requiresVerification: true and status pending_verification.
 *   3. Flag the product as non-narcotic AFTER this order exists → the
 *      existing order's requiresVerification value is UNCHANGED.
 *      (THE snapshot-timing test — if this fails, the snapshot is wrong.)
 *   4. Reject the prescription on a pending_verification order → status
 *      becomes rejected, and this order can NEVER reach delivered.
 *
 * Also covered:
 *   - "Every item in the cart is checked, not just the first":
 *     the narcotics item is placed SECOND in the cart for test 1 to prove
 *     the gate does not rely on list position.
 */

const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const app = require("../../src/app");
const Order = require("../../src/modules/orders/order.model");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");
const City = require("../../src/modules/cities/city.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const Otp = require("../../src/modules/otp/otp.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let authToken;
let narcoticsProduct; // isNarcotic: true
let nonNarcoticsProduct; // isNarcotic: false
let city;
let sharedOrderId; // shared between test 2 and test 3

beforeAll(async () => {
  // Connect to test database
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  await mongoose.connect(mongoUri);

  // Clean up
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});
  await Otp.deleteMany({});
  await ActivityLog.deleteMany({});

  // Create test city
  city = await City.create({
    name: "Test City",
    deliveryCharge: 100,
    active: true,
  });

  // Create test category
  const category = await Category.create({
    name: "Test Category",
    slug: "test-category",
    active: true,
  });

  nonNarcoticsProduct = await Product.create({
    name: "Normal Medicine Y",
    sku: "TEST-NORM-001",
    categoryIds: [category._id],
    price: 200,
    stockStatus: "in_stock",
    active: true,
    isNarcotic: false,
  });
  // NOTE: narcoticsProduct is created in beforeEach so each test is isolated.

  // Create admin user for authentication
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await AdminUser.create({
    name: "Test Admin",
    email: "admin@test.com",
    passwordHash: hashedPassword,
    role: "admin",
  });

  // Generate auth token
  authToken = jwt.sign(
    { sub: admin._id.toString(), role: admin.role, email: admin.email },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" },
  );
}, 30000);

afterAll(async () => {
  // Clean up test data
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});
  await Otp.deleteMany({});
  await ActivityLog.deleteMany({});
  await mongoose.connection.close();

  // Clean up test prescription files
  const uploadsDir = path.join(__dirname, "../../uploads/prescriptions");
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(
      files.map((file) => fs.unlink(path.join(uploadsDir, file))),
    );
  } catch (err) {
    // Directory might not exist, that's OK
  }
}, 30000);

/**
 * Helper: Request OTP and return the test code.
 * (Uses the dev-mode code returned by the OTP endpoint, as Phase 14 test does.)
 */
const requestTestOtp = async (email) => {
  const response = await request(app)
    .post("/api/v1/otp/request")
    .send({ email })
    .expect(200);
  return response.body._testCode;
};

/** Helper: build a valid customer object for tests. */
const makeCustomer = (email) => ({
  name: "Narcotics Customer",
  email,
  phone: "0300-1234567",
  address: "123 Test Street",
  city: city.name,
});

/** Helper: write a dummy prescription file into the tests dir. */
const makePrescriptionFile = async (name) => {
  const filePath = path.join(__dirname, name);
  await fs.writeFile(filePath, "fake-prescription-content");
  return filePath;
};

describe("Phase 15 — Narcotics Order Verification Gate", () => {
  beforeEach(() => {
    // Ensure a fresh narcotics-flagged product for each test. Each test is
    // independent — a flag changed in test 3 must not leak into test 4.
    return (async () => {
      await Product.deleteMany({ sku: { $regex: /^TEST-NAR/ } });
      const category = await Category.findOne({ name: "Test Category" });
      narcoticsProduct = await Product.create({
        name: "Controlled Medicine X",
        sku: `TEST-NAR-${Date.now()}`,
        categoryIds: [category._id],
        price: 1000,
        stockStatus: "in_stock",
        active: true,
        isNarcotic: true,
      });
    })();
  });

  test("Test 1: Narcotics cart cannot be submitted WITHOUT a prescription — rejected", async () => {
    const email = "customer1@test.com";
    const otpCode = await requestTestOtp(email);

    // Cart: first item is NON-narcotics, second item IS narcotics — proves
    // the gate checks EVERY item, not just the first one (FR-CW-14).
    const response = await request(app)
      .post("/api/v1/orders/narcotics")
      .field("customer", JSON.stringify(makeCustomer(email)))
      .field(
        "items",
        JSON.stringify([
          { productId: nonNarcoticsProduct._id.toString(), quantity: 1 },
          { productId: narcoticsProduct._id.toString(), quantity: 1 },
        ]),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      // NOTE: no .attach('prescription', ...) — prescription is MISSING
      .expect(400);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toMatch(/prescription/i);

    // Assert NO order was persisted for this failed submission.
    const orders = await Order.find({ "customer.email": email });
    expect(orders.length).toBe(0);
  }, 15000);

  test("Test 2: Narcotics cart WITH prescription → requiresVerification:true + status pending_verification", async () => {
    const email = "customer2@test.com";
    const otpCode = await requestTestOtp(email);

    const prescriptionPath = await makePrescriptionFile(
      "narc-prescription-1.jpg",
    );

    const response = await request(app)
      .post("/api/v1/orders/narcotics")
      .field("customer", JSON.stringify(makeCustomer(email)))
      .field(
        "items",
        JSON.stringify([
          { productId: narcoticsProduct._id.toString(), quantity: 2 },
        ]),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      .attach("prescription", prescriptionPath)
      .expect(201);

    expect(response.body.status).toBe("success");
    const { order } = response.body.data;

    expect(order).toMatchObject({
      type: "narcotics",
      requiresVerification: true,
      status: "pending_verification",
      prescriptionUrl: expect.stringMatching(/\/uploads\/prescriptions\/.+/),
    });
    expect(order.verification).toMatchObject({ status: "pending" });
    expect(order.totals.subtotal).toBeGreaterThan(0);

    // Remember this order for the snapshot test (Test 3).
    sharedOrderId = order._id;

    await fs.unlink(prescriptionPath);
  }, 15000);

  test("Test 3: THE SNAPSHOT — flag changed after order exists does NOT change order.requiresVerification", async () => {
    // Load the order created in test 2 from the database (fresh read).
    const existing = await Order.findById(sharedOrderId);
    expect(existing).toBeTruthy();
    expect(existing.requiresVerification).toBe(true);
    expect(existing.status).toBe("pending_verification");

    // Claim the product is NO LONGER narcotics AFTER the order was placed.
    await Product.findByIdAndUpdate(narcoticsProduct._id, {
      isNarcotic: false,
    });

    // Re-read the SAME order — its snapshot MUST be unchanged (FR-AD-16).
    const after = await Order.findById(sharedOrderId);
    expect(after.requiresVerification).toBe(true);
    expect(after.status).toBe("pending_verification");

    // Sanity: the product itself IS now flagged non-narcotic.
    const productAfter = await Product.findById(narcoticsProduct._id);
    expect(productAfter.isNarcotic).toBe(false);
  }, 15000);

  test("Test 4: Rejected order → status rejected and can NEVER reach delivered", async () => {
    const email = "customer4@test.com";
    const otpCode = await requestTestOtp(email);

    const prescriptionPath = await makePrescriptionFile(
      "narcotics-prescription-2.jpg",
    );

    // Place a narcotics order (product is narcotics again from beforeEach).
    const created = await request(app)
      .post("/api/v1/orders/narcotics")
      .field("customer", JSON.stringify(makeCustomer(email)))
      .field(
        "items",
        JSON.stringify([
          { productId: narcoticsProduct._id.toString(), quantity: 1 },
        ]),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      .attach("prescription", prescriptionPath)
      .expect(201);

    const orderId = created.body.data.order._id;
    await fs.unlink(prescriptionPath);

    // ── Step 1: Reject the prescription ──────────────────────────────────
    const rejectRes = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/verification`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ decision: "rejected" })
      .expect(200);

    expect(rejectRes.body.data.order.status).toBe("rejected");
    expect(rejectRes.body.data.order.verification).toMatchObject({
      status: "rejected",
      reviewedBy: "admin@test.com",
    });
    expect(rejectRes.body.data.order.verification.reviewedAt).toBeTruthy();
    expect(rejectRes.body.data.order.requiresVerification).toBe(true);

    // ── Step 2: Attempt to push it to delivered — MUST be blocked ───────────
    // (a) via document .save()
    const doc = await Order.findById(orderId);
    doc.status = "delivered";
    await expect(doc.save()).rejects.toThrow(/never be delivered/i);

    // (b) via atomic findOneAndUpdate
    await expect(
      Order.findByIdAndUpdate(
        orderId,
        { $set: { status: "delivered" } },
        { new: true },
      ),
    ).rejects.toThrow(/never be delivered/i);

    // ── Step 3: Confirm it is STILL rejected in the DB ──────────────────────
    const final = await Order.findById(orderId);
    expect(final.status).toBe("rejected");
    expect(final.verification.status).toBe("rejected");
  }, 15000);
});
