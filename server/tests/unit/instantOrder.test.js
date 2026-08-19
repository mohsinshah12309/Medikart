/**
 * Phase 14 Test — Instant Order Workflow (FR-CW-12 / FR-AD-19).
 *
 * Test cases:
 *   1. Submit instant order with prescription + no items → items [] + awaiting-pharmacist-pricing
 *   2. Admin adds 2 medicines + total → correct update + pending status
 *   3. Submit instant order without prescription → rejected
 *   4. (Fix 2) THE SNAPSHOT — a product flagged narcotics AFTER submission does
 *      NOT change the order's requiresVerification or route it into
 *      pending_verification (FR-AD-16).
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
const otpService = require("../../src/modules/otp/otp.service");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let authToken;
let product1, product2;
let city;

// Minimal valid JPEG header — real magic bytes (FF D8 FF) so the Fix 4
// content validation accepts the test prescription file.
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

/** Helper: write a valid-JPEG prescription file into the tests dir. */
const makePrescriptionFile = async (name) => {
  const filePath = path.join(__dirname, name);
  await fs.writeFile(filePath, VALID_JPEG_BUFFER);
  return filePath;
};

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

  // Create test city
  city = await City.create({
    name: "Test City",
    slug: "test-city",
    deliveryCharge: 100,
    active: true,
  });

  // Create test category
  const category = await Category.create({
    name: "Test Category",
    slug: "test-category",
    active: true,
  });

  // Create test products (non-narcotics initially)
  product1 = await Product.create({
    name: "Test Medicine 1",
    sku: "TEST-MED-001",
    categoryIds: [category._id],
    price: 500,
    stockStatus: "in_stock",
    active: true,
    isNarcotic: false,
  });

  product2 = await Product.create({
    name: "Test Medicine 2",
    sku: "TEST-MED-002",
    categoryIds: [category._id],
    price: 750,
    stockStatus: "in_stock",
    active: true,
    isNarcotic: false,
  });

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
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});
  await Otp.deleteMany({});
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

// Fix 5 — the per-IP OTP limiter is shared across the whole jest process.
// Reset it before each test so test OTP requests are never blocked.
beforeEach(() => {
  otpService._resetIpRequestLog();
});

/**
 * Helper: Request OTP and return the test code
 */
const requestTestOtp = async (email) => {
  const response = await request(app)
    .post("/api/v1/otp/request")
    .send({ email })
    .expect(200);

  return response.body._testCode;
};

describe("Phase 14 — Instant Order Workflow", () => {
  test("Test 1: Submit instant order with prescription → items=[] + awaiting-pharmacist-pricing", async () => {
    const email = "customer1@test.com";
    const otpCode = await requestTestOtp(email);

    // Create a valid JPEG prescription file
    const prescriptionPath = await makePrescriptionFile(
      "test-prescription.jpg",
    );

    const response = await request(app)
      .post("/api/v1/orders/instant")
      .field(
        "customer",
        JSON.stringify({
          name: "John Doe",
          email,
          phone: "03001234567",
          address: "123 Test Street",
          city: city.name,
        }),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      .field("branchDescription", "Main branch location")
      .attach("prescription", prescriptionPath)
      .expect(201);

    expect(response.body.status).toBe("success");
    expect(response.body.data.order).toMatchObject({
      type: "instant",
      items: [],
      status: "awaiting-pharmacist-pricing",
      paymentMethod: "cod",
      customer: {
        name: "John Doe",
        email,
      },
    });
    // Fix 1 — prescription URLs now point at the authenticated admin route.
    expect(response.body.data.order.prescriptionUrl).toMatch(
      /\/api\/v1\/admin\/prescriptions\/.+/,
    );
    expect(response.body.data.order.totals.subtotal).toBe(0);
    expect(response.body.data.order.totals.deliveryCharge).toBe(100);
    expect(response.body.data.order.totals.total).toBe(100);

    // Clean up test file
    await fs.unlink(prescriptionPath);
  }, 15000);

  test("Test 2: Admin adds 2 medicines + total → correct update + pending status", async () => {
    const email = "customer2@test.com";
    const otpCode = await requestTestOtp(email);

    // Create valid JPEG prescription file
    const prescriptionPath = await makePrescriptionFile(
      "test-prescription2.jpg",
    );

    // Submit instant order
    const orderResponse = await request(app)
      .post("/api/v1/orders/instant")
      .field(
        "customer",
        JSON.stringify({
          name: "Jane Smith",
          email,
          phone: "03009876543",
          address: "456 Test Avenue",
          city: city.name,
        }),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      .attach("prescription", prescriptionPath)
      .expect(201);

    const orderId = orderResponse.body.data.order._id;

    // Admin prices the order
    const pricingResponse = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/items`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        items: [
          { productId: product1._id.toString(), quantity: 2 },
          { productId: product2._id.toString(), quantity: 1 },
        ],
      })
      .expect(200);

    expect(pricingResponse.body.status).toBe("success");
    expect(pricingResponse.body.data.order).toMatchObject({
      type: "instant",
      status: "pending",
      items: [
        {
          productId: product1._id.toString(),
          name: "Test Medicine 1",
          quantity: 2,
        },
        {
          productId: product2._id.toString(),
          name: "Test Medicine 2",
          quantity: 1,
        },
      ],
    });

    // Verify items array has 2 items and prices are server-computed
    expect(pricingResponse.body.data.order.items).toHaveLength(2);
    expect(pricingResponse.body.data.order.items[0].price).toBeGreaterThan(0);
    expect(pricingResponse.body.data.order.items[1].price).toBeGreaterThan(0);

    // Verify totals are computed correctly (subtotal + delivery)
    const subtotal = pricingResponse.body.data.order.totals.subtotal;
    const deliveryCharge =
      pricingResponse.body.data.order.totals.deliveryCharge;
    const total = pricingResponse.body.data.order.totals.total;

    expect(deliveryCharge).toBe(100);
    expect(total).toBe(subtotal + deliveryCharge);
    expect(subtotal).toBeGreaterThan(0);

    // Clean up test file
    await fs.unlink(prescriptionPath);
  }, 15000);

  test("Test 3: Submit instant order without prescription → rejected", async () => {
    const email = "customer3@test.com";
    const otpCode = await requestTestOtp(email);

    const response = await request(app)
      .post("/api/v1/orders/instant")
      .field(
        "customer",
        JSON.stringify({
          name: "Bob Johnson",
          email,
          phone: "03001112222",
          address: "789 Test Road",
          city: city.name,
        }),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      .field("branchDescription", "Branch location")
      // No .attach('prescription', ...) — prescription missing
      .expect(400);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toMatch(/prescription/i);
  }, 15000);

  test("Test 4: THE SNAPSHOT — product flagged narcotics AFTER submission does NOT change requiresVerification (FR-AD-16)", async () => {
    const email = "customer4@test.com";
    const otpCode = await requestTestOtp(email);

    // Create valid JPEG prescription file
    const prescriptionPath = await makePrescriptionFile(
      "test-prescription3.jpg",
    );

    // Submit an instant order (no product selection — snapshot false)
    const orderResponse = await request(app)
      .post("/api/v1/orders/instant")
      .field(
        "customer",
        JSON.stringify({
          name: "Snapshot Customer",
          email,
          phone: "03005556666",
          address: "Snapshot Street",
          city: city.name,
        }),
      )
      .field("paymentMethod", "cod")
      .field("otp", JSON.stringify({ email, code: otpCode }))
      .attach("prescription", prescriptionPath)
      .expect(201);

    const orderId = orderResponse.body.data.order._id;
    expect(orderResponse.body.data.order.requiresVerification).toBe(false);

    // Flag product1 as narcotics AFTER the instant order was submitted.
    await Product.findByIdAndUpdate(product1._id, { isNarcotic: true });

    // Admin prices the order with the now-narcotic product1.
    const pricingResponse = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/items`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        items: [{ productId: product1._id.toString(), quantity: 1 }],
      })
      .expect(200);

    // The snapshot must be unchanged — the later flag change must NOT
    // retroactively require verification or route into pending_verification.
    expect(pricingResponse.body.data.order.requiresVerification).toBe(false);
    expect(pricingResponse.body.data.order.status).toBe("pending");

    // Restore product1 for other tests.
    await Product.findByIdAndUpdate(product1._id, { isNarcotic: false });

    await fs.unlink(prescriptionPath);
  }, 15000);
});
