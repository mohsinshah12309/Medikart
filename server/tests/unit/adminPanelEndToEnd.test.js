/**
 * adminPanelEndToEnd.test.js
 *
 * End-to-end integration and unit tests for Medikart Admin Panel workflows:
 *   1. Standard, Instant, and Narcotics order placement & status transitions.
 *   2. Pharmacy assignment and branch-scoped admin access control.
 *   3. Dashboard overview calculations vs Orders queue calculation parity.
 *   4. Granular RBAC, activity logging, and terminal state security.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");

const Order = require("../../src/modules/orders/order.model");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");
const Pharmacy = require("../../src/modules/pharmacies/pharmacy.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");
const CommissionPayment = require("../../src/modules/commissions/commissionPayment.model");

// Mock background email and sheets sync queues
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../src/modules/integrations/sheetsSyncQueue", () => ({
  enqueueSheetSync: jest.fn(),
}));

describe("Admin Panel End-to-End Workflows & Calculation Parity", () => {
  let superAdminToken;
  let superAdminUser;
  let branchAdminToken;
  let branchAdminUser;
  let unauthorizedAdminToken;
  let testPharmacy1;
  let testPharmacy2;
  let testCategory;
  let testStandardProduct;
  let testNarcoticProduct;

  const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-at-least-32-chars-long";

  const createToken = (user) => {
    return jwt.sign(
      { sub: user._id.toString(), role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
  };

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not set");
    await mongoose.connect(mongoUri);

    // Clean up test data
    await AdminUser.deleteMany({ email: /@test-admin-e2e\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-admin-e2e\.com$/ });
    await Pharmacy.deleteMany({ email: /@test-admin-e2e\.com$/ });
    await Product.deleteMany({ sku: /^(SKU-E2E-STD|SKU-E2E-NARC)$/ });
    await Category.deleteMany({ slug: "cat-e2e-test" });
    await CommissionPayment.deleteMany({ notes: "E2E Test Commission Payment" });

    // 1. Create Test Category
    testCategory = await Category.create({
      name: "E2E Test Category",
      slug: "cat-e2e-test",
      active: true,
      discount: 0,
    });

    // 2. Create Standard & Narcotic Products
    testStandardProduct = await Product.create({
      name: "Paracetamol 500mg E2E",
      slug: "paracetamol-500mg-e2e",
      sku: "SKU-E2E-STD",
      price: 150,
      active: true,
      stockStatus: "in_stock",
      isNarcotic: false,
      requiresPrescription: false,
      categoryIds: [testCategory._id],
    });

    testNarcoticProduct = await Product.create({
      name: "Controlled Sedative 10mg E2E",
      slug: "controlled-sedative-10mg-e2e",
      sku: "SKU-E2E-NARC",
      price: 500,
      active: true,
      stockStatus: "in_stock",
      isNarcotic: true,
      requiresPrescription: true,
      categoryIds: [testCategory._id],
    });

    // 3. Create Test Pharmacies
    testPharmacy1 = await Pharmacy.create({
      name: "Lahore Central Pharmacy E2E",
      code: "LHR-01",
      city: "Lahore",
      address: "Main Gulberg, Lahore",
      phone: "+923001112233",
      email: "pharmacy1@test-admin-e2e.com",
      medikartPercentage: 10,
      active: true,
    });

    testPharmacy2 = await Pharmacy.create({
      name: "Karachi South Pharmacy E2E",
      code: "KHI-01",
      city: "Karachi",
      address: "Clifton, Karachi",
      phone: "+923002223344",
      email: "pharmacy2@test-admin-e2e.com",
      medikartPercentage: 12,
      active: true,
    });

    // 4. Create Admin Users
    superAdminUser = await AdminUser.create({
      name: "Super Admin E2E",
      email: "super@test-admin-e2e.com",
      role: "super_admin",
      passwordHash: "hash",
      active: true,
    });
    superAdminToken = createToken(superAdminUser);

    branchAdminUser = await AdminUser.create({
      name: "Branch Staff LHR",
      email: "staff.lhr@test-admin-e2e.com",
      role: "admin",
      permissions: ["view_orders", "manage_orders", "view_pharmacies"],
      assignedPharmacyId: testPharmacy1._id,
      passwordHash: "hash",
      active: true,
    });
    branchAdminToken = createToken(branchAdminUser);

    const unauthorizedUser = await AdminUser.create({
      name: "Restricted Staff",
      email: "restricted@test-admin-e2e.com",
      role: "admin",
      permissions: ["view_blogs"], // no order permissions
      passwordHash: "hash",
      active: true,
    });
    unauthorizedAdminToken = createToken(unauthorizedUser);
  });

  afterAll(async () => {
    await AdminUser.deleteMany({ email: /@test-admin-e2e\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-admin-e2e\.com$/ });
    await Pharmacy.deleteMany({ email: /@test-admin-e2e\.com$/ });
    await Product.deleteMany({ sku: /^(SKU-E2E-STD|SKU-E2E-NARC)$/ });
    await Category.deleteMany({ slug: "cat-e2e-test" });
    await CommissionPayment.deleteMany({ notes: "E2E Test Commission Payment" });
    await mongoose.connection.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. STANDARD ORDER LIFECYCLE & STATUS CHANGES
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Standard Order Status Lifecycle Transitions", () => {
    let standardOrder;

    beforeEach(async () => {
      standardOrder = await Order.create({
        type: "standard",
        customer: {
          name: "Ali Standard",
          email: "ali@test-admin-e2e.com",
          phone: "+923001234567",
          address: "House 12, St 4",
          city: "Lahore",
        },
        items: [
          {
            productId: testStandardProduct._id,
            name: testStandardProduct.name,
            price: 150,
            quantity: 2,
          },
        ],
        totals: {
          subtotal: 300,
          deliveryCharge: 100,
          platformFee: 10,
          total: 410,
        },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "pending",
      });
    });

    test("1.1 Admin changes newly arrived standard order: pending -> packed -> shipped -> delivered", async () => {
      // Step 1: pending -> packed
      const packRes = await request(app)
        .patch(`/api/v1/admin/orders/${standardOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "packed" })
        .expect(200);

      expect(packRes.body.data.order.status).toBe("packed");

      // Step 2: packed -> shipped
      const shipRes = await request(app)
        .patch(`/api/v1/admin/orders/${standardOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "shipped" })
        .expect(200);

      expect(shipRes.body.data.order.status).toBe("shipped");

      // Step 3: shipped -> delivered (COD paymentState automatically marked paid)
      const deliverRes = await request(app)
        .patch(`/api/v1/admin/orders/${standardOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "delivered" })
        .expect(200);

      expect(deliverRes.body.data.order.status).toBe("delivered");
      expect(deliverRes.body.data.order.paymentState).toBe("paid");

      // Verify in DB
      const dbOrder = await Order.findById(standardOrder._id);
      expect(dbOrder.status).toBe("delivered");
      expect(dbOrder.paymentState).toBe("paid");
    });

    test("1.2 Admin cancels pending standard order with reason note", async () => {
      const cancelRes = await request(app)
        .patch(`/api/v1/admin/orders/${standardOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "cancelled", reason: "Customer requested cancellation via phone call." })
        .expect(200);

      expect(cancelRes.body.data.order.status).toBe("cancelled");

      const dbOrder = await Order.findById(standardOrder._id);
      expect(dbOrder.status).toBe("cancelled");
      expect(dbOrder.cancellation.reason).toBe("Customer requested cancellation via phone call.");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INSTANT ORDER (RX UPLOAD) PRICING & FULFILLMENT
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Instant Order Pricing & Fulfillment Lifecycle", () => {
    let instantOrder;

    beforeEach(async () => {
      instantOrder = await Order.create({
        type: "instant",
        customer: {
          name: "Sara Instant",
          email: "sara@test-admin-e2e.com",
          phone: "+923009876543",
          address: "Apartment 4B",
          city: "Lahore",
        },
        items: [],
        totals: { subtotal: 0, deliveryCharge: 0, platformFee: 0, total: 0 },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "awaiting-pharmacist-pricing",
        prescriptionUrl: "/uploads/prescriptions/mock-rx.jpg",
      });
    });

    test("2.1 Changing status of unpriced instant order to packed/shipped/delivered is strictly blocked", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${instantOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "packed" })
        .expect(400);

      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/must be priced before updating fulfillment status/i);
    });

    test("2.2 Pharmacist prices instant order with catalog items and proceeds to fulfill", async () => {
      // Step 1: Price order
      const priceRes = await request(app)
        .patch(`/api/v1/admin/orders/${instantOrder._id}/items`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          items: [{ productId: testStandardProduct._id.toString(), quantity: 3 }],
        })
        .expect(200);

      expect(priceRes.body.data.order.status).toBe("pending");
      expect(priceRes.body.data.order.items.length).toBe(1);
      expect(priceRes.body.data.order.totals.subtotal).toBe(450); // 150 * 3
      expect(priceRes.body.data.order.totals.total).toBeGreaterThan(450);

      // Step 2: Now fulfill order (pending -> packed -> delivered)
      const packRes = await request(app)
        .patch(`/api/v1/admin/orders/${instantOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "packed" })
        .expect(200);

      expect(packRes.body.data.order.status).toBe("packed");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. NARCOTICS PRESCRIPTION REVIEW & REGULATORY GATING
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Narcotics Prescription Review Workflow", () => {
    let narcoticsOrder;

    beforeEach(async () => {
      narcoticsOrder = await Order.create({
        type: "narcotics",
        customer: {
          name: "Hamza Narcotics",
          email: "hamza@test-admin-e2e.com",
          phone: "+923005556677",
          address: "Sector F-7/2",
          city: "Lahore",
        },
        items: [
          {
            productId: testNarcoticProduct._id,
            name: testNarcoticProduct.name,
            price: 500,
            quantity: 1,
          },
        ],
        totals: {
          subtotal: 500,
          deliveryCharge: 100,
          platformFee: 10,
          total: 610,
        },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "pending_verification",
        requiresVerification: true,
        prescriptionUrl: "/uploads/prescriptions/mock-narcotic-rx.jpg",
      });
    });

    test("3.1 Fulfilling unverified narcotics order before Rx approval is rejected", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${narcoticsOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "packed" })
        .expect(400);

      expect(res.body.message).toMatch(/prescription must be reviewed and approved/i);
    });

    test("3.2 Pharmacist approves narcotics Rx -> transitions to pending -> can fulfill", async () => {
      // Step 1: Approve Rx
      const verifyRes = await request(app)
        .patch(`/api/v1/admin/orders/${narcoticsOrder._id}/verification`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ decision: "approved" })
        .expect(200);

      expect(verifyRes.body.data.order.status).toBe("pending");
      expect(verifyRes.body.data.order.verification.status).toBe("approved");

      // Step 2: Fulfill
      const packRes = await request(app)
        .patch(`/api/v1/admin/orders/${narcoticsOrder._id}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "packed" })
        .expect(200);

      expect(packRes.body.data.order.status).toBe("packed");
    });

    test("3.3 Pharmacist rejects narcotics Rx -> transitions to rejected -> locked", async () => {
      // Assign to pharmacy 1 so branch admin has access to review
      await Order.findByIdAndUpdate(narcoticsOrder._id, { assignedPharmacyId: testPharmacy1._id });

      const rejectRes = await request(app)
        .patch(`/api/v1/admin/orders/${narcoticsOrder._id}/verification`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ decision: "rejected" })
        .expect(200);

      expect(rejectRes.body.data.order.status).toBe("rejected");
      expect(rejectRes.body.data.order.verification.status).toBe("rejected");

      // Cannot fulfill a rejected order (even by assigned branch admin)
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${narcoticsOrder._id}/status`)
        .set("Authorization", `Bearer ${branchAdminToken}`)
        .send({ status: "packed" })
        .expect(400);

      expect(res.body.message).toMatch(/cannot change status of a rejected/i);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. PHARMACY ASSIGNMENT & BRANCH SCOPING
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Pharmacy Assignment & Branch Scope Enforcement", () => {
    let order1;
    let order2;

    beforeEach(async () => {
      order1 = await Order.create({
        type: "standard",
        customer: { name: "C1", email: "c1@test-admin-e2e.com", phone: "123", address: "St", city: "Lahore" },
        items: [{ productId: testStandardProduct._id, name: "Med", price: 100, quantity: 1 }],
        totals: { subtotal: 100, deliveryCharge: 50, platformFee: 10, total: 160 },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "pending",
        assignedPharmacyId: null,
      });

      order2 = await Order.create({
        type: "standard",
        customer: { name: "C2", email: "c2@test-admin-e2e.com", phone: "456", address: "St", city: "Karachi" },
        items: [{ productId: testStandardProduct._id, name: "Med", price: 200, quantity: 1 }],
        totals: { subtotal: 200, deliveryCharge: 50, platformFee: 10, total: 260 },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "pending",
        assignedPharmacyId: testPharmacy2._id, // Karachi
      });
    });

    test("4.1 Super Admin assigns order to Lahore Central Pharmacy", async () => {
      const assignRes = await request(app)
        .patch(`/api/v1/admin/orders/${order1._id}/pharmacy`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ pharmacyId: testPharmacy1._id.toString() })
        .expect(200);

      expect(assignRes.body.data.order.assignedPharmacyId._id.toString()).toBe(testPharmacy1._id.toString());
      expect(assignRes.body.data.order.assignedPharmacyId.name).toBe(testPharmacy1.name);
    });

    test("4.2 Branch-scoped sub-admin can update assigned order, but is blocked on unassigned/other orders", async () => {
      // Assign order1 to Lahore (branchAdminUser is scoped to Lahore)
      await Order.findByIdAndUpdate(order1._id, { assignedPharmacyId: testPharmacy1._id });

      // Can update assigned order1
      const updateRes = await request(app)
        .patch(`/api/v1/admin/orders/${order1._id}/status`)
        .set("Authorization", `Bearer ${branchAdminToken}`)
        .send({ status: "packed" })
        .expect(200);

      expect(updateRes.body.data.order.status).toBe("packed");

      // BLOCKED from updating order2 (assigned to Karachi)
      const blockedRes = await request(app)
        .patch(`/api/v1/admin/orders/${order2._id}/status`)
        .set("Authorization", `Bearer ${branchAdminToken}`)
        .send({ status: "packed" })
        .expect(403);

      expect(blockedRes.body.message).toMatch(/access denied|assigned to your pharmacy/i);
    });

    test("4.3 Branch-scoped sub-admin is blocked from reassigning pharmacy", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${order1._id}/pharmacy`)
        .set("Authorization", `Bearer ${branchAdminToken}`)
        .send({ pharmacyId: testPharmacy2._id.toString() })
        .expect(403);

      expect(res.body.message).toMatch(/only super admins can assign or reassign/i);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. DASHBOARD OVERVIEW VS ORDERS QUEUE CALCULATION PARITY
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Dashboard Overview vs Orders Queue Parity", () => {
    beforeAll(async () => {
      // Clean previous orders
      await Order.deleteMany({});

      // Create a set of orders:
      // 1. Delivered order today (Revenue = 1000, Subtotal = 900)
      await Order.create({
        type: "standard",
        customer: { name: "User 1", email: "u1@test-admin-e2e.com", phone: "1", address: "A", city: "Lahore" },
        items: [{ productId: testStandardProduct._id, name: "Med", price: 450, quantity: 2 }],
        totals: { subtotal: 900, deliveryCharge: 90, platformFee: 10, total: 1000 },
        paymentMethod: "cod",
        paymentState: "paid",
        status: "delivered",
        assignedPharmacyId: testPharmacy1._id, // 10% commission = 90 + 10 = 100
        createdAt: new Date(),
      });

      // 2. Pending order today (Revenue = 500, Subtotal = 400)
      await Order.create({
        type: "standard",
        customer: { name: "User 2", email: "u2@test-admin-e2e.com", phone: "2", address: "B", city: "Lahore" },
        items: [{ productId: testStandardProduct._id, name: "Med", price: 400, quantity: 1 }],
        totals: { subtotal: 400, deliveryCharge: 90, platformFee: 10, total: 500 },
        paymentMethod: "card",
        paymentState: "paid",
        status: "pending",
        assignedPharmacyId: testPharmacy1._id, // 10% commission = 40 + 10 = 50
        createdAt: new Date(),
      });

      // 3. Cancelled order today (Should be EXCLUDED from revenue & commission)
      await Order.create({
        type: "standard",
        customer: { name: "User 3", email: "u3@test-admin-e2e.com", phone: "3", address: "C", city: "Lahore" },
        items: [{ productId: testStandardProduct._id, name: "Med", price: 500, quantity: 1 }],
        totals: { subtotal: 500, deliveryCharge: 90, platformFee: 10, total: 600 },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "cancelled",
        assignedPharmacyId: testPharmacy1._id,
        createdAt: new Date(),
      });

      // 4. Instant order awaiting pricing
      await Order.create({
        type: "instant",
        customer: { name: "User 4", email: "u4@test-admin-e2e.com", phone: "4", address: "D", city: "Lahore" },
        items: [],
        totals: { subtotal: 0, deliveryCharge: 0, platformFee: 0, total: 0 },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "awaiting-pharmacist-pricing",
        createdAt: new Date(),
      });

      // 5. Narcotics order awaiting review
      await Order.create({
        type: "narcotics",
        customer: { name: "User 5", email: "u5@test-admin-e2e.com", phone: "5", address: "E", city: "Lahore" },
        items: [{ productId: testNarcoticProduct._id, name: "Narc", price: 500, quantity: 1 }],
        totals: { subtotal: 500, deliveryCharge: 90, platformFee: 10, total: 600 },
        paymentMethod: "cod",
        paymentState: "pending",
        status: "pending_verification",
        requiresVerification: true,
        createdAt: new Date(),
      });

      // 6. Commission payment verified
      await CommissionPayment.create({
        pharmacyId: testPharmacy1._id,
        amount: 150,
        screenshotUrl: "/uploads/payments/proof.jpg",
        status: "verified",
        paidOnDate: new Date(),
        periodFrom: new Date(),
        periodTo: new Date(),
        submittedBy: branchAdminUser._id,
        verifiedBy: superAdminUser._id,
        verifiedAt: new Date(),
        notes: "E2E Test Commission Payment",
      });
    });

    test("5.1 Dashboard stats match exact underlying database counts and active orders queue", async () => {
      const statsRes = await request(app)
        .get("/api/v1/admin/orders/stats")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .expect(200);

      const stats = statsRes.body.data;

      // Verify counts
      expect(stats.totalOrders).toBe(5);
      expect(stats.todayOrders).toBe(5);
      expect(stats.narcoticsPending).toBe(1);
      expect(stats.pricingPending).toBe(1);

      // Total sale excludes cancelled order (1000 + 500 + 0 + 600 = 2100)
      expect(stats.totalSale).toBe(2100);
      expect(stats.todaySale).toBe(2100);

      // Commission accrued for Pharmacy 1:
      // Order 1: 900 * 0.10 + 10 = 100
      // Order 2: 400 * 0.10 + 10 = 50
      // Order 5: Unassigned pharmacy, platform fee = 10
      // Total = 100 + 50 + 10 = 160
      expect(stats.medikartCommission).toBe(160);
      expect(stats.totalCommissionPaid).toBe(150);

      // Verify Orders Queue returns exact 5 records
      const ordersRes = await request(app)
        .get("/api/v1/admin/orders?limit=50")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .expect(200);

      expect(ordersRes.body.data.total).toBe(5);
      expect(ordersRes.body.data.orders.length).toBe(5);
    });

    test("5.2 Scoped Branch Admin stats strictly reflect only their branch orders", async () => {
      const statsRes = await request(app)
        .get("/api/v1/admin/orders/stats")
        .set("Authorization", `Bearer ${branchAdminToken}`)
        .expect(200);

      const stats = statsRes.body.data;

      // Pharmacy 1 has 3 orders assigned (Order 1 delivered, Order 2 pending, Order 3 cancelled)
      expect(stats.totalOrders).toBe(3);
      expect(stats.todayOrders).toBe(3);
      // Non-cancelled sales = 1000 + 500 = 1500
      expect(stats.totalSale).toBe(1500);
      expect(stats.medikartCommission).toBe(150);
      expect(stats.totalCommissionPaid).toBe(150);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. RBAC & PERMISSION BOUNDARIES
  // ─────────────────────────────────────────────────────────────────────────────
  describe("RBAC & Unauthorized Access Protection", () => {
    test("6.1 Admin without view_orders / manage_orders cannot access order endpoints", async () => {
      await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", `Bearer ${unauthorizedAdminToken}`)
        .expect(403);

      await request(app)
        .get("/api/v1/admin/orders/stats")
        .set("Authorization", `Bearer ${unauthorizedAdminToken}`)
        .expect(403);
    });
  });
});
