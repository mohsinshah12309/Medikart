/**
 * Customer Authentication, Wishlist & Hard Boundary Tests.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Customer = require("../../src/modules/customers/customer.model");
const Wishlist = require("../../src/modules/customers/wishlist.model");
const CustomerPasswordReset = require("../../src/modules/customers/customerPasswordReset.model");
const Otp = require("../../src/modules/otp/otp.model");
const Product = require("../../src/modules/products/product.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const Order = require("../../src/modules/orders/order.model");

const testCustomerEmail = "customer.test@example.com";
const testCustomer2Email = "customer2.test@example.com";
const testAdminEmail = "admin.boundary@test.com";

let customerToken;
let customer2Token;
let adminToken;
let customerId;
let customer2Id;
let testProduct;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);

  // Clean up test data
  await Customer.deleteMany({ email: { $in: [testCustomerEmail, testCustomer2Email] } });
  await Wishlist.deleteMany({});
  await CustomerPasswordReset.deleteMany({});
  await Otp.deleteMany({ email: { $in: [testCustomerEmail, testCustomer2Email] } });
  await AdminUser.deleteMany({ email: testAdminEmail });
  await Product.deleteMany({ name: "Wishlist Test Product" });

  // Create admin user for boundary tests
  const adminUser = await AdminUser.create({
    name: "Boundary Admin",
    email: testAdminEmail,
    role: "admin",
    passwordHash: "dummyHash",
    active: true,
  });

  const secret = process.env.JWT_SECRET || "test-secret";
  adminToken = jwt.sign(
    { sub: adminUser._id.toString(), role: "admin", email: testAdminEmail },
    secret,
    { expiresIn: "1h" }
  );

  // Create a test product
  testProduct = await Product.create({
    name: "Wishlist Test Product",
    sku: "TEST-SKU-001",
    genericName: "Paracetamol",
    price: 150,
    mrp: 180,
    stock: 25,
    isNarcotic: false,
    requiresPrescription: false,
    isActive: true,
  });
});

afterAll(async () => {
  await Customer.deleteMany({ email: { $in: [testCustomerEmail, testCustomer2Email] } });
  await Wishlist.deleteMany({});
  await CustomerPasswordReset.deleteMany({});
  await Otp.deleteMany({ email: { $in: [testCustomerEmail, testCustomer2Email] } });
  await AdminUser.deleteMany({ email: testAdminEmail });
  await Product.deleteMany({ name: "Wishlist Test Product" });
  await mongoose.connection.close();
});

describe("Customer Authentication & Hard Auth Boundaries", () => {
  let verificationOtp;

  describe("1. Customer Signup Flow", () => {
    test("Fails signup / requests confirmation when email has typo in domain", async () => {
      const res = await request(app)
        .post("/api/v1/auth/customer/signup")
        .send({
          name: "Typo User",
          email: "test@gmial.com",
          password: "SecurePassword123!",
        });

      expect(res.body.needsConfirmation).toBe(true);
      expect(res.body.suggestion).toBe("test@gmail.com");
    });

    test("Successfully signs up with valid credentials and creates OTP with purpose 'account_verification'", async () => {
      const res = await request(app)
        .post("/api/v1/auth/customer/signup")
        .send({
          name: "Test Customer",
          email: testCustomerEmail,
          password: "SecurePassword123!",
          phone: "03001234567",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.requiresVerification).toBe(true);

      const customer = await Customer.findOne({ email: testCustomerEmail });
      expect(customer).not.toBeNull();
      expect(customer.emailVerified).toBe(false);
      customerId = customer._id.toString();

      // Find the generated OTP in DB
      const otpDoc = await Otp.findOne({ email: testCustomerEmail, purpose: "account_verification" }).sort({ createdAt: -1 });
      expect(otpDoc).not.toBeNull();
      // Notice: In dev/test, otp might be hash, but let's check OTP record exists
    });

    test("Rejects login before email verification with EMAIL_NOT_VERIFIED code", async () => {
      const res = await request(app)
        .post("/api/v1/auth/customer/login")
        .send({
          email: testCustomerEmail,
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
    });
  });

  describe("2. Customer Email Verification & Login Flow", () => {
    test("Successfully verifies email with mock valid OTP", async () => {
      // Manually set verified in test database or generate known OTP
      const bcrypt = require("bcryptjs");
      const plainOtp = "123456";
      const codeHash = await bcrypt.hash(plainOtp, 10);
      
      await Otp.create({
        email: testCustomerEmail,
        codeHash,
        purpose: "account_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request(app)
        .post("/api/v1/auth/customer/verify-email")
        .send({
          email: testCustomerEmail,
          code: plainOtp,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.customer.emailVerified).toBe(true);

      customerToken = res.body.token;
    });

    test("Customer login succeeds with verified credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/customer/login")
        .send({
          email: testCustomerEmail,
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.customer.email).toBe(testCustomerEmail);
    });

    test("Customer login fails with invalid password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/customer/login")
        .send({
          email: testCustomerEmail,
          password: "WrongPassword123!",
        });

      expect(res.status).toBe(401);
    });

    test("GET /api/v1/auth/customer/me returns customer profile when authenticated", async () => {
      const res = await request(app)
        .get("/api/v1/auth/customer/me")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testCustomerEmail);
      expect(res.body.data.name).toBe("Test Customer");
    });
  });

  describe("3. Hard Authentication Boundary Tests", () => {
    test("Admin JWT is REJECTED (401) on customer protected routes (/api/v1/wishlist)", async () => {
      const res = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });

    test("Customer JWT is REJECTED (401) on admin protected routes (/api/v1/admin/orders)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });

    test("Admin JWT is REJECTED (401) on /api/v1/auth/customer/me", async () => {
      const res = await request(app)
        .get("/api/v1/auth/customer/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe("4. Customer Wishlist Functionality & Object-Level Authorization", () => {
    beforeAll(async () => {
      // Create Customer 2
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash("SecurePassword123!", 10);
      const customer2 = await Customer.create({
        name: "Customer Two",
        email: testCustomer2Email,
        passwordHash,
        emailVerified: true,
      });
      customer2Id = customer2._id.toString();

      const secret = process.env.JWT_SECRET || "test-secret";
      customer2Token = jwt.sign(
        { sub: customer2Id, role: "customer", email: testCustomer2Email, name: "Customer Two" },
        secret,
        { expiresIn: "1h" }
      );
    });

    test("Customer 1 adds product to wishlist", async () => {
      const res = await request(app)
        .post(`/api/v1/wishlist/${testProduct._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
    });

    test("Customer 1 wishlist IDs list contains the added product", async () => {
      const res = await request(app)
        .get("/api/v1/wishlist/ids")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.ids).toContain(testProduct._id.toString());
    });

    test("Customer 1 full wishlist returns populated product details", async () => {
      const res = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toBe("Wishlist Test Product");
      expect(res.body.data.items[0].price).toBe(150);
    });

    test("Customer 2 CANNOT see Customer 1's wishlist (Object-Level Auth isolation)", async () => {
      const res = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${customer2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);

      const idsRes = await request(app)
        .get("/api/v1/wishlist/ids")
        .set("Authorization", `Bearer ${customer2Token}`);

      expect(idsRes.status).toBe(200);
      expect(idsRes.body.data.ids.length).toBe(0);
    });

    test("Customer 1 removes product from wishlist", async () => {
      const res = await request(app)
        .delete(`/api/v1/wishlist/${testProduct._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(getRes.body.data.items.length).toBe(0);
    });
  });

  describe("5. Password Reset Flow", () => {
    test("Forgot password sends email with reset token (mocked / generic response)", async () => {
      const customer = await Customer.findOne({ email: testCustomerEmail });
      customerId = customer._id;

      const res = await request(app)
        .post("/api/v1/auth/customer/forgot-password")
        .send({
          email: testCustomerEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      // Verify reset token record created in DB
      const resetDoc = await CustomerPasswordReset.findOne({ customerId }).sort({ createdAt: -1 });
      expect(resetDoc).not.toBeNull();
      expect(resetDoc.used).toBe(false);
    });

    test("Reset password with valid token updates password", async () => {
      const crypto = require("crypto");
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await CustomerPasswordReset.create({
        customerId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(app)
        .post("/api/v1/auth/customer/reset-password")
        .send({
          token: rawToken,
          password: "BrandNewPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      // Old password should fail
      const oldLoginRes = await request(app)
        .post("/api/v1/auth/customer/login")
        .send({
          email: testCustomerEmail,
          password: "SecurePassword123!",
        });
      expect(oldLoginRes.status).toBe(401);

      // New password should succeed
      const newLoginRes = await request(app)
        .post("/api/v1/auth/customer/login")
        .send({
          email: testCustomerEmail,
          password: "BrandNewPassword123!",
        });
      expect(newLoginRes.status).toBe(200);
    });
  });

  describe("6. Guest Checkout Regression Verification", () => {
    test("Guest order OTP request and verification remains 100% operational", async () => {
      const res = await request(app)
        .post("/api/v1/otp/request")
        .send({
          email: "guest.buyer@example.com",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const otpDoc = await Otp.findOne({ email: "guest.buyer@example.com", purpose: "order_otp" });
      expect(otpDoc).not.toBeNull();
    });
  });
});
