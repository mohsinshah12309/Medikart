/**
 * medikartWorkflows.test.js
 * Phase 29: Integration tests covering happy and failure paths for core workflows:
 *   - Standard Order (Happy / Failure)
 *   - Instant Order (Happy / Failure)
 *   - Narcotics Order (Happy / Failure)
 *   - Order Cancellation (Happy / Failure)
 *   - Payment (Happy / Failure)
 *   - Chatbot (Happy / Failure)
 */

jest.setTimeout(60000);

require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Order = require("../../src/modules/orders/order.model");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");
const City = require("../../src/modules/cities/city.model");
const Otp = require("../../src/modules/otp/otp.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const adminUserService = require("../../src/modules/admin-users/adminUser.service");
const bcrypt = require("bcryptjs");

const TEST_EMAIL = "integration-test@medikart.pk";
const TEST_OTP = "123456";
let adminToken = "";
let testProduct = null;
let narcoticProduct = null;
let testCategory = null;
let narcoticCategory = null;

// Valid minimal JPEG header to bypass the magic bytes content validator
const mockJpegBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00
]);

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Cleanup
  await Category.deleteMany({ name: { $in: ["Integration Test Category", "Integration Narcotics Category"] } });
  await Product.deleteMany({ name: { $in: ["Integration Safe Vitamin", "Integration Codeine Syrup"] } });
  await City.deleteMany({ name: "Lahore" });
  await Order.deleteMany({ "customer.email": TEST_EMAIL });
  await AdminUser.deleteMany({ email: "super-integration@medikart.pk" });

  // Seed Categories
  testCategory = await Category.create({
    name: "Integration Test Category",
    slug: "integration-test-category",
    active: true,
  });

  narcoticCategory = await Category.create({
    name: "Integration Narcotics Category",
    slug: "integration-narcotics-category",
    active: true,
  });

  // Seed City
  await City.create({
    name: "Lahore",
    deliveryCharge: 250,
    active: true,
  });

  // Seed Products
  testProduct = await Product.create({
    name: "Integration Safe Vitamin",
    genericName: "Vitamin C",
    sku: "SKU-INT-SAFE",
    price: 200,
    categoryIds: [testCategory._id],
    isNarcotic: false,
    active: true,
    stockStatus: "in_stock",
  });

  narcoticProduct = await Product.create({
    name: "Integration Codeine Syrup",
    genericName: "Codeine",
    sku: "SKU-INT-NARC",
    price: 350,
    categoryIds: [narcoticCategory._id],
    isNarcotic: true,
    active: true,
    stockStatus: "in_stock",
  });

  // Create a Super Admin for admin workflow steps
  const passHash = await adminUserService.hashPassword("SuperSecret123!");
  await AdminUser.create({
    name: "Integration Super Admin",
    email: "super-integration@medikart.pk",
    role: "super_admin",
    passwordHash: passHash,
    active: true,
  });

  // Login to get token
  const loginRes = await request(app)
    .post("/api/v1/auth/admin/login")
    .send({ email: "super-integration@medikart.pk", password: "SuperSecret123!" });
  adminToken = loginRes.body.data.token;
});

afterAll(async () => {
  await Category.deleteMany({ name: { $in: ["Integration Test Category", "Integration Narcotics Category"] } });
  await Product.deleteMany({ name: { $in: ["Integration Safe Vitamin", "Integration Codeine Syrup"] } });
  await City.deleteMany({ name: "Lahore" });
  await Order.deleteMany({ "customer.email": TEST_EMAIL });
  await AdminUser.deleteMany({ email: "super-integration@medikart.pk" });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

async function seedOtp() {
  const codeHash = await bcrypt.hash(TEST_OTP, 10);
  await Otp.findOneAndUpdate(
    { email: TEST_EMAIL },
    {
      email: TEST_EMAIL,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      verified: false,
      invalidated: false,
      attempts: 0,
    },
    { upsert: true }
  );
}

describe("Medikart Core Workflows Integration Tests", () => {
  
  // ── 1. STANDARD ORDER WORKFLOW ─────────────────────────────────────────────
  describe("Workflow: Standard Order", () => {
    test("Happy Path: placing a standard COD order succeeds with valid OTP", async () => {
      await seedOtp();

      const res = await request(app)
        .post("/api/v1/orders/standard")
        .send({
          customer: {
            name: "John Doe",
            email: TEST_EMAIL,
            phone: "03001234567",
            address: "Street 1, Lahore",
            city: "Lahore",
          },
          items: [{ productId: testProduct._id.toString(), quantity: 2 }],
          paymentMethod: "cod",
          otp: { email: TEST_EMAIL, code: TEST_OTP },
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.order).toBeDefined();
      expect(res.body.data.order.type).toBe("standard");
      
      const subtotal = res.body.data.order.totals.subtotal;
      expect([380, 400]).toContain(subtotal);
      expect(res.body.data.order.totals.deliveryCharge).toBe(250); // Lahore
      expect([630, 650]).toContain(res.body.data.order.totals.total);
    });

    test("Failure Path: placing standard order fails with invalid OTP", async () => {
      await seedOtp();

      const res = await request(app)
        .post("/api/v1/orders/standard")
        .send({
          customer: {
            name: "John Doe",
            email: TEST_EMAIL,
            phone: "03001234567",
            address: "Street 1, Lahore",
            city: "Lahore",
          },
          items: [{ productId: testProduct._id.toString(), quantity: 2 }],
          paymentMethod: "cod",
          otp: { email: TEST_EMAIL, code: "999999" }, // wrong OTP
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/code|verification|otp/i);
    });
  });

  // ── 2. INSTANT ORDER WORKFLOW ──────────────────────────────────────────────
  describe("Workflow: Instant Order", () => {
    let instantOrderId = "";

    test("Happy Path: submit prescription then pricing by admin", async () => {
      await seedOtp();

      // Submit instant order with a valid mock image buffer
      const res = await request(app)
        .post("/api/v1/orders/instant")
        .attach("prescription", mockJpegBuffer, {
          filename: "prescription.jpg",
          contentType: "image/jpeg",
        })
        .field("customer", JSON.stringify({
          name: "Instant Customer",
          email: TEST_EMAIL,
          phone: "03001111111",
          address: "DHA, Lahore",
          city: "Lahore",
        }))
        .field("otp", JSON.stringify({
          email: TEST_EMAIL,
          code: TEST_OTP,
        }))
        .field("paymentMethod", "cod");

      expect(res.status).toBe(201);
      expect(res.body.data.order).toBeDefined();
      expect(res.body.data.order.status).toBe("awaiting-pharmacist-pricing");
      instantOrderId = res.body.data.order._id;

      // Admin prices the order
      const priceRes = await request(app)
        .patch(`/api/v1/admin/orders/${instantOrderId}/items`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          items: [{ productId: testProduct._id.toString(), quantity: 3 }],
        });

      expect(priceRes.status).toBe(200);
      expect(priceRes.body.data.order.status).toBe("pending");
      
      const subtotal = priceRes.body.data.order.totals.subtotal;
      expect([570, 600]).toContain(subtotal); // 200 * 3 = 600 (discounted to 570 if 5% off)
      expect([820, 850]).toContain(priceRes.body.data.order.totals.total);
    });

    test("Failure Path: pricing with invalid product ID is rejected", async () => {
      // Reset order status back to priceable state to test invalid product validation
      await Order.findByIdAndUpdate(instantOrderId, { status: "awaiting-pharmacist-pricing" });

      const priceRes = await request(app)
        .patch(`/api/v1/admin/orders/${instantOrderId}/items`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          items: [{ productId: "6a8f8bfeabbc66ed1255ae44", quantity: 3 }], // Nonexistent ID
        });

      expect(priceRes.status).toBe(404);
      expect(priceRes.body.message).toMatch(/not found/i);
    });
  });

  // ── 3. NARCOTICS ORDER WORKFLOW ────────────────────────────────────────────
  describe("Workflow: Narcotics Order", () => {
    test("Happy Path: submits prescription, order goes to pending_verification", async () => {
      await seedOtp();

      const res = await request(app)
        .post("/api/v1/orders/narcotics")
        .attach("prescription", mockJpegBuffer, {
          filename: "prescription.jpg",
          contentType: "image/jpeg",
        })
        .field("customer", JSON.stringify({
          name: "Narcotic Patient",
          email: TEST_EMAIL,
          phone: "03002222222",
          address: "Gulberg, Lahore",
          city: "Lahore",
        }))
        .field("items", JSON.stringify([
          { productId: narcoticProduct._id.toString(), quantity: 1 }
        ]))
        .field("otp", JSON.stringify({
          email: TEST_EMAIL,
          code: TEST_OTP,
        }))
        .field("paymentMethod", "cod");

      expect(res.status).toBe(201);
      expect(res.body.data.order.requiresVerification).toBe(true);
      expect(res.body.data.order.status).toBe("pending_verification");
    });

    test("Failure Path: submits narcotics order via standard endpoint (no prescription) -> blocked", async () => {
      await seedOtp();

      const res = await request(app)
        .post("/api/v1/orders/standard")
        .send({
          customer: {
            name: "Narcotic Patient",
            email: TEST_EMAIL,
            phone: "03002222222",
            address: "Gulberg, Lahore",
            city: "Lahore",
          },
          items: [{ productId: narcoticProduct._id.toString(), quantity: 1 }],
          paymentMethod: "cod",
          otp: { email: TEST_EMAIL, code: TEST_OTP },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/narcotics|prescription|require/i);
    });
  });

  // ── 4. ORDER CANCELLATION ──────────────────────────────────────────────────
  describe("Workflow: Order Cancellation", () => {
    let cancellableOrderId = "";

    beforeEach(async () => {
      await seedOtp();
      const order = await request(app)
        .post("/api/v1/orders/standard")
        .send({
          customer: {
            name: "Cancellable Patient",
            email: TEST_EMAIL,
            phone: "03001234567",
            address: "Lahore",
            city: "Lahore",
          },
          items: [{ productId: testProduct._id.toString(), quantity: 1 }],
          paymentMethod: "cod",
          otp: { email: TEST_EMAIL, code: TEST_OTP },
        });
      cancellableOrderId = order.body.data.order._id;
    });

    test("Happy Path: cancel pending order sets status to cancelled", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${cancellableOrderId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Customer requested" });

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("cancelled");
    });

    test("Failure Path: cancel already shipped order is rejected", async () => {
      // Manually set status to shipped in DB
      await Order.findByIdAndUpdate(cancellableOrderId, { status: "shipped" });

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${cancellableOrderId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Late cancellation" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be cancelled|status/i);
    });
  });

  // ── 5. PAYMENT WORKFLOW ────────────────────────────────────────────────────
  describe("Workflow: Payment", () => {
    let orderId = "";

    beforeEach(async () => {
      await seedOtp();
      const order = await request(app)
        .post("/api/v1/orders/standard")
        .send({
          customer: {
            name: "Paying Customer",
            email: TEST_EMAIL,
            phone: "03001234567",
            address: "Lahore",
            city: "Lahore",
          },
          items: [{ productId: testProduct._id.toString(), quantity: 1 }],
          paymentMethod: "card", // Card payment
          otp: { email: TEST_EMAIL, code: TEST_OTP },
        });
      orderId = order.body.data.order._id;
    });

    test("Happy Path: initiate payment then confirm via webhook", async () => {
      // Enable mock mode briefly
      process.env.PAYMENTS_MOCK_MODE = "true";

      const initRes = await request(app)
        .post(`/api/v1/orders/${orderId}/payment/initiate`);

      expect(initRes.status).toBe(200);
      expect(initRes.body.transactionId).toBeDefined();
      const txnId = initRes.body.transactionId;

      // Webhook payload mimicking Kuickpay postback
      const webhookRes = await request(app)
        .post("/api/v1/payments/webhook/kuickpay")
        .send({ transactionId: txnId });

      expect(webhookRes.status).toBe(200);

      // Verify order paymentState is now 'paid'
      const updatedOrder = await Order.findById(orderId);
      expect(updatedOrder.paymentState).toBe("paid");

      // Cleanup env
      delete process.env.PAYMENTS_MOCK_MODE;
    });

    test("Failure Path: webhook fails with unknown transaction ID", async () => {
      const webhookRes = await request(app)
        .post("/api/v1/payments/webhook/kuickpay")
        .send({ transactionId: "TXN-UNKNOWN-999" });

      expect(webhookRes.status).toBe(404);
      expect(webhookRes.body.message).toMatch(/not found/i);
    });
  });

  // ── 6. CHATBOT WORKFLOW ────────────────────────────────────────────────────
  describe("Workflow: AI Chatbot", () => {
    test("Happy Path: queries chatbot and returns Otc recommendations with disclaimer", async () => {
      // Mock Groq API
      const groq = require("../../src/config/groqClient");
      const groqSpy = jest.spyOn(groq.chat.completions, "create").mockResolvedValue({
        choices: [
          {
            index: 0,
            message: {
              content: "I recommend Integration Safe Vitamin for your symptoms.",
            },
          },
        ],
      });

      try {
        const res = await request(app)
          .post("/api/v1/chatbot")
          .send({ symptoms: "I need some vitamins" });

        expect(res.status).toBe(200);
        expect(res.body.data.response).toContain("Integration Safe Vitamin");
        expect(res.body.data.response).toContain("Disclaimer");
      } finally {
        groqSpy.mockRestore();
      }
    });

    test("Failure Path: chatbot ignores or filters out narcotics products", async () => {
      const groq = require("../../src/config/groqClient");
      const groqSpy = jest.spyOn(groq.chat.completions, "create").mockResolvedValue({
        choices: [
          {
            index: 0,
            message: {
              content: "I cannot recommend controlled substances.",
            },
          },
        ],
      });

      try {
        const res = await request(app)
          .post("/api/v1/chatbot")
          .send({ symptoms: "I want Codeine" });

        expect(res.status).toBe(200);
        expect(groqSpy).toHaveBeenCalled();
        const callArgs = groqSpy.mock.calls[0][0];
        const systemMessage = callArgs.messages.find(m => m.role === "system");
        
        // The system prompt sent to the LLM must NEVER contain the narcotics product SKU/name
        expect(systemMessage.content.toLowerCase()).not.toContain("codeine");
        expect(systemMessage.content.toLowerCase()).not.toContain("syrup");
      } finally {
        groqSpy.mockRestore();
      }
    });
  });

});
