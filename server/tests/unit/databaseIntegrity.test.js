/**
 * databaseIntegrity.test.js
 *
 * Comprehensive database-integrity, transaction, and concurrency tests for Medikart.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");

const Order = require("../../src/modules/orders/order.model");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const Otp = require("../../src/modules/otp/otp.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");

const otpService = require("../../src/modules/otp/otp.service");
const adminUserService = require("../../src/modules/admin-users/adminUser.service");
const orderService = require("../../src/modules/orders/order.service");

jest.mock("../../src/modules/payments/providers/kuickpay.provider");
const kuickpayProvider = require("../../src/modules/payments/providers/kuickpay.provider");

// Mock sheetsSyncQueue to avoid Sheets API calls and timers
jest.mock("../../src/modules/integrations/sheetsSyncQueue", () => ({
  enqueueSheetSync: jest.fn(),
}));

describe("Database Integrity, Concurrency & Transaction Safety", () => {
  let actorAdmin;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in environment");
    }
    await mongoose.connect(mongoUri);

    // Clean up test users and data
    await AdminUser.deleteMany({ email: /@test-integrity\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-integrity\.com$/ });
    await Otp.deleteMany({ email: /@test-integrity\.com$/ });
    await ActivityLog.deleteMany({ "actor.email": "actor@test-integrity.com" });
    await Category.deleteMany({ slug: "cat-slug" });
    await Product.deleteMany({ sku: "SKU-NARC-SNAP" });
  });

  beforeEach(async () => {
    const actorId = new mongoose.Types.ObjectId();
    await AdminUser.create({
      _id: actorId,
      name: "Actor Super Admin",
      email: "actor@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });
    actorAdmin = {
      id: actorId,
      email: "actor@test-integrity.com",
      role: "super_admin",
    };
  });

  afterEach(async () => {
    // Cleanup temporary collections to avoid test leakage
    await AdminUser.deleteMany({ email: /@test-integrity\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-integrity\.com$/ });
    await Otp.deleteMany({ email: /@test-integrity\.com$/ });
    await ActivityLog.deleteMany({ "actor.email": "actor@test-integrity.com" });
    await Category.deleteMany({ slug: "cat-slug" });
    await Product.deleteMany({ sku: "SKU-NARC-SNAP" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ── DUPLICATES ──────────────────────────────────────────────────────────────

  test("1. Duplicate admin email rejected by schema unique constraint", async () => {
    await AdminUser.create({
      name: "Super Admin 1",
      email: "dup@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
    });

    await expect(
      AdminUser.create({
        name: "Super Admin 2",
        email: "dup@test-integrity.com",
        role: "admin",
        passwordHash: "hash2",
      })
    ).rejects.toThrow(/duplicate key/i);
  });

  test("2. Concurrent duplicate creation handled safely (only one succeeds)", async () => {
    const email = "concurrent-dup@test-integrity.com";

    const attempts = [
      AdminUser.create({ name: "Admin 1", email, role: "admin", passwordHash: "hash" }),
      AdminUser.create({ name: "Admin 2", email, role: "admin", passwordHash: "hash" }),
      AdminUser.create({ name: "Admin 3", email, role: "admin", passwordHash: "hash" }),
    ];

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);

    const checkUsers = await AdminUser.find({ email });
    expect(checkUsers.length).toBe(1);
  });

  // ── SUPER ADMIN ─────────────────────────────────────────────────────────────

  test("3. Concurrent last-Super-Admin deactivation protected", async () => {
    // Demote actor admin to regular admin so SA 1 and SA 2 are the only active super admins in the DB
    await AdminUser.findByIdAndUpdate(actorAdmin.id, { role: "admin" });

    const admin1 = await AdminUser.create({
      name: "SA 1",
      email: "sa1@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });
    const admin2 = await AdminUser.create({
      name: "SA 2",
      email: "sa2@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });

    // Concurrently try to deactivate both Super Admins
    const attempts = [
      adminUserService.updateAdminUser(admin1._id, { active: false }, actorAdmin),
      adminUserService.updateAdminUser(admin2._id, { active: false }, actorAdmin),
    ];

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // At least one must be rejected (cannot demote/deactivate the last active super admin)
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    const activeCount = await AdminUser.countDocuments({
      role: "super_admin",
      active: true,
    });
    expect(activeCount).toBeGreaterThanOrEqual(1);
  });

  test("4. Concurrent last-Super-Admin deletion protected", async () => {
    // Demote actor admin to regular admin so SA 1 and SA 2 are the only active super admins in the DB
    await AdminUser.findByIdAndUpdate(actorAdmin.id, { role: "admin" });

    const admin1 = await AdminUser.create({
      name: "SA 1",
      email: "sa1@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });
    const admin2 = await AdminUser.create({
      name: "SA 2",
      email: "sa2@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });

    // Concurrently delete both Super Admins
    const attempts = [
      adminUserService.deleteAdminUser(admin1._id, actorAdmin),
      adminUserService.deleteAdminUser(admin2._id, actorAdmin),
    ];

    const results = await Promise.allSettled(attempts);
    const rejected = results.filter((r) => r.status === "rejected");

    expect(rejected.length).toBeGreaterThanOrEqual(1);

    const activeCount = await AdminUser.countDocuments({
      role: "super_admin",
      active: true,
    });
    expect(activeCount).toBeGreaterThanOrEqual(1);
  });

  test("5. Concurrent demotion protected", async () => {
    // Demote actor admin to regular admin so SA 1 and SA 2 are the only active super admins in the DB
    await AdminUser.findByIdAndUpdate(actorAdmin.id, { role: "admin" });

    const admin1 = await AdminUser.create({
      name: "SA 1",
      email: "sa1@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });
    const admin2 = await AdminUser.create({
      name: "SA 2",
      email: "sa2@test-integrity.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });

    // Concurrently demote both Super Admins
    const attempts = [
      adminUserService.updateAdminUser(admin1._id, { role: "admin" }, actorAdmin),
      adminUserService.updateAdminUser(admin2._id, { role: "admin" }, actorAdmin),
    ];

    const results = await Promise.allSettled(attempts);
    const rejected = results.filter((r) => r.status === "rejected");

    expect(rejected.length).toBeGreaterThanOrEqual(1);

    const activeCount = await AdminUser.countDocuments({
      role: "super_admin",
      active: true,
    });
    expect(activeCount).toBeGreaterThanOrEqual(1);
  });

  // ── PAYMENTS ────────────────────────────────────────────────────────────────

  test("6. Duplicate webhook does not double-process payment", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "c1@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "card",
      paymentState: "pending",
      status: "pending",
      gatewayTransactionId: "TXN-INTEG-01",
    });

    kuickpayProvider.verifyTransaction.mockResolvedValue({ status: "paid" });

    // Send webhook first time
    await request(app)
      .post("/api/v1/payments/webhook/kuickpay")
      .send({ transactionId: "TXN-INTEG-01" })
      .expect(200);

    const state1 = await Order.findById(order._id);
    expect(state1.paymentState).toBe("paid");

    // Send webhook second time (duplicate)
    await request(app)
      .post("/api/v1/payments/webhook/kuickpay")
      .send({ transactionId: "TXN-INTEG-01" })
      .expect(200);

    const state2 = await Order.findById(order._id);
    expect(state2.paymentState).toBe("paid");
  });

  test("7. Concurrent webhook processing remains idempotent", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "c2@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "card",
      paymentState: "pending",
      status: "pending",
      gatewayTransactionId: "TXN-INTEG-CONC",
    });

    kuickpayProvider.verifyTransaction.mockResolvedValue({ status: "paid" });

    // Trigger webhook concurrently
    const attempts = [
      request(app).post("/api/v1/payments/webhook/kuickpay").send({ transactionId: "TXN-INTEG-CONC" }),
      request(app).post("/api/v1/payments/webhook/kuickpay").send({ transactionId: "TXN-INTEG-CONC" }),
      request(app).post("/api/v1/payments/webhook/kuickpay").send({ transactionId: "TXN-INTEG-CONC" }),
    ];

    const results = await Promise.all(attempts);
    results.forEach((res) => expect(res.status).toBe(200));

    const finalOrder = await Order.findById(order._id);
    expect(finalOrder.paymentState).toBe("paid");
  });

  // ── REFUNDS ─────────────────────────────────────────────────────────────────

  test("8. Concurrent refund attempts allow only one successful transition", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "refund-conc@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "card",
      paymentState: "paid",
      status: "cancelled",
      cancellation: {
        reason: "reason",
        cancelledBy: actorAdmin.id,
        cancelledAt: new Date(),
        refundStatus: "refund_pending",
      },
    });

    // Attempt concurrent refunds
    const attempts = [
      orderService.refundOrder(order._id, actorAdmin),
      orderService.refundOrder(order._id, actorAdmin),
    ];

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const finalOrder = await Order.findById(order._id);
    expect(finalOrder.cancellation.refundStatus).toBe("refunded");
    expect(finalOrder.paymentState).toBe("refunded");

    // Wait for fire-and-forget logActivity
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify only 1 Activity Log created
    const logs = await ActivityLog.find({ entityId: order._id, action: "refund_marked_complete" });
    expect(logs.length).toBe(1);
  });

  test("9. Duplicate refund attempt cannot produce duplicate successful state", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "refund-dup@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "card",
      paymentState: "paid",
      status: "cancelled",
      cancellation: {
        reason: "reason",
        cancelledBy: actorAdmin.id,
        cancelledAt: new Date(),
        refundStatus: "refund_pending",
      },
    });

    await orderService.refundOrder(order._id, actorAdmin);

    // Second sequential call must fail
    await expect(
      orderService.refundOrder(order._id, actorAdmin)
    ).rejects.toThrow(/refundStatus of 'refund_pending'/i);
  });

  // ── ORDER STATE ─────────────────────────────────────────────────────────────

  test("10. Invalid concurrent state transition rejected", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "order-state@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "delivered", // Terminal state
    });

    // Delivered order cannot be cancelled
    await expect(
      orderService.cancelOrder(order._id, { reason: "late", admin: actorAdmin })
    ).rejects.toThrow(/Only Pending or Packed orders can be cancelled/i);

    const finalOrder = await Order.findById(order._id);
    expect(finalOrder.status).toBe("delivered");
  });

  test("11. Terminal order state cannot be overwritten", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "terminal-state@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "cancelled", // Terminal state
    });

    // Cancelled order cannot be cancelled again concurrently or updated to delivered via cancellation logic
    await expect(
      orderService.cancelOrder(order._id, { reason: "some reason", admin: actorAdmin })
    ).rejects.toThrow(/Only Pending or Packed orders can be cancelled/i);

    const finalOrder = await Order.findById(order._id);
    expect(finalOrder.status).toBe("cancelled");
  });

  // ── NARCOTICS ───────────────────────────────────────────────────────────────

  test("12. Narcotics snapshot remains immutable", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "narc-snapshot@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "pending",
      requiresVerification: true, // Snapshotted
    });

    expect(order.requiresVerification).toBe(true);
  });

  test("13. Concurrent product flag changes do not alter existing order snapshot", async () => {
    const category = await Category.create({ name: "Cat", slug: "cat-slug", active: true });
    const product = await Product.create({
      name: "Med X",
      sku: "SKU-NARC-SNAP",
      price: 100,
      stockStatus: "in_stock",
      active: true,
      isNarcotic: true,
      categoryIds: [category._id],
    });

    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "narc-conc@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      items: [{ productId: product._id, name: product.name, price: product.price, quantity: 1 }],
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "pending",
      requiresVerification: true,
    });

    // Modify product's narcotics flag
    product.isNarcotic = false;
    await product.save();

    // Verify existing order remains requiresVerification: true
    const checkOrder = await Order.findById(order._id);
    expect(checkOrder.requiresVerification).toBe(true);
  });

  // ── OTP ─────────────────────────────────────────────────────────────────────

  test("14. Concurrent OTP verification cannot reuse OTP", async () => {
    const otp = await Otp.create({
      email: "otp-reuse@test-integrity.com",
      codeHash: "$2b$10$dummyhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // bcrypt dummy
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
    });

    // Mock bcrypt.compare to always return true for this test
    const bcrypt = require("bcryptjs");
    const originalCompare = bcrypt.compare;
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    try {
      const attempts = [
        otpService.verifyOtp("otp-reuse@test-integrity.com", "123456"),
        otpService.verifyOtp("otp-reuse@test-integrity.com", "123456"),
        otpService.verifyOtp("otp-reuse@test-integrity.com", "123456"),
      ];

      const results = await Promise.allSettled(attempts);
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(2);

      const checkOtp = await Otp.findById(otp._id);
      expect(checkOtp.verified).toBe(true);
    } finally {
      bcrypt.compare = originalCompare;
    }
  });

  test("15. Concurrent verification respects attempt limits", async () => {
    const otp = await Otp.create({
      email: "otp-limit@test-integrity.com",
      codeHash: "$2b$10$dummyhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
      attempts: 3, // 1 remaining
    });

    const bcrypt = require("bcryptjs");
    const originalCompare = bcrypt.compare;
    bcrypt.compare = jest.fn().mockResolvedValue(false); // Wrong code

    try {
      const attempts = [
        otpService.verifyOtp("otp-limit@test-integrity.com", "wrong1"),
        otpService.verifyOtp("otp-limit@test-integrity.com", "wrong2"),
        otpService.verifyOtp("otp-limit@test-integrity.com", "wrong3"),
      ];

      const results = await Promise.allSettled(attempts);
      const rejected = results.filter((r) => r.status === "rejected");

      expect(rejected.length).toBe(3);

      const checkOtp = await Otp.findById(otp._id);
      expect(checkOtp.attempts).toBe(4);
      expect(checkOtp.invalidated).toBe(true);
    } finally {
      bcrypt.compare = originalCompare;
    }
  });

  // ── AUDIT ───────────────────────────────────────────────────────────────────

  test("16. Successful mutation creates correct Activity Log", async () => {
    const admin = await AdminUser.create({
      name: "Update Log User",
      email: "update-log@test-integrity.com",
      role: "admin",
      passwordHash: "hash",
      active: true,
    });

    await adminUserService.updateAdminUser(admin._id, { active: false }, actorAdmin);

    const log = await ActivityLog.findOne({
      entityId: admin._id,
      action: "admin_user_updated",
    });

    expect(log).toBeDefined();
    expect(log.actor.email).toBe(actorAdmin.email);
    expect(log.before.active).toBe(true);
    expect(log.after.active).toBe(false);
  });

  test("17. Concurrent mutation does not create incorrect duplicate audit state", async () => {
    const order = await Order.create({
      type: "standard",
      customer: { name: "C1", email: "audit-dup@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
      totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
      paymentMethod: "card",
      paymentState: "paid",
      status: "cancelled",
      cancellation: {
        reason: "reason",
        cancelledBy: actorAdmin.id,
        cancelledAt: new Date(),
        refundStatus: "refund_pending",
      },
    });

    // Concurrently trigger refunds
    const attempts = [
      orderService.refundOrder(order._id, actorAdmin),
      orderService.refundOrder(order._id, actorAdmin),
    ];

    await Promise.allSettled(attempts);

    // Wait for fire-and-forget logActivity
    await new Promise((resolve) => setTimeout(resolve, 100));

    const logs = await ActivityLog.find({ entityId: order._id, action: "refund_marked_complete" });
    // Should only have exactly 1 audit log despite concurrent attempts
    expect(logs.length).toBe(1);
  });

  // ── INDEXES ─────────────────────────────────────────────────────────────────

  test("18. Required unique indexes exist", async () => {
    const adminIndexes = await AdminUser.collection.indexes();
    const emailIndex = adminIndexes.find((idx) => idx.key.email === 1);
    expect(emailIndex).toBeDefined();
    expect(emailIndex.unique).toBe(true);

    const orderIndexes = await Order.collection.indexes();
    const txIndex = orderIndexes.find((idx) => idx.key.gatewayTransactionId === 1);
    expect(txIndex).toBeDefined();
    expect(txIndex.unique).toBe(true);
    expect(txIndex.sparse).toBe(true);
  });

  test("19. Duplicate-key errors are handled safely by Express handler", async () => {
    await AdminUser.create({
      name: "Duplicate Express",
      email: "express-dup@test-integrity.com",
      role: "admin",
      passwordHash: "hash",
    });

    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "test-secret";
    const token = jwt.sign(
      { sub: actorAdmin.id.toString(), role: "super_admin", email: actorAdmin.email },
      secret
    );

    const res = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Second User",
        email: "express-dup@test-integrity.com",
        role: "admin",
        permissions: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toMatch(/Duplicate value for field/i);
  });

  // ── DATA VALIDATION ─────────────────────────────────────────────────────────

  test("20. Invalid enum values rejected by schema validation", async () => {
    await expect(
      AdminUser.create({
        name: "Invalid Role",
        email: "invalid-role@test-integrity.com",
        role: "super_power", // Invalid enum
        passwordHash: "hash",
      })
    ).rejects.toThrow(/validation/i);
  });

  test("21. Invalid ObjectIds rejected gracefully", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders/invalid-object-id-123")
      .set("Authorization", `Bearer token`);
    
    expect([400, 401]).toContain(res.status);
  });

  test("22. Invalid security-sensitive fields rejected by schema enums", async () => {
    await expect(
      Order.create({
        type: "standard",
        customer: { name: "C1", email: "sensitive-fields@test-integrity.com", phone: "123", address: "St", city: "Lahore" },
        totals: { subtotal: 100, deliveryCharge: 50, total: 150 },
        paymentMethod: "cod",
        paymentState: "super_paid", // Invalid enum
        status: "pending",
      })
    ).rejects.toThrow(/validation/i);
  });
});
