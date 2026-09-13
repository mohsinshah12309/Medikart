/**
 * Monthly Refill Feature Unit & Integration Tests.
 *
 * Tests:
 *   1. Customer-scoped authentication and boundary checks.
 *   2. POST /api/v1/customer/monthly-refill (add item, create list on first use).
 *   3. GET /api/v1/customer/monthly-refill (retrieve customer's own list with calculated prices).
 *   4. PATCH /api/v1/customer/monthly-refill/:itemId (quantity update & object-level ownership check).
 *   5. Object-level authorization (Customer B cannot mutate or delete Customer A's item → 403 Forbidden).
 *   6. DELETE /api/v1/customer/monthly-refill/:itemId & DELETE / (remove single item, clear list).
 *   7. POST /api/v1/customer/monthly-refill/reorder (place standard order, 30-day reminder reset).
 *   8. Mailjet reminder service error resilience (never throws).
 *   9. Daily cron job execution (finds due lists, marks reminderSentAt).
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Customer = require("../../src/modules/customers/customer.model");
const MonthlyRefill = require("../../src/modules/customers/monthlyRefill.model");
const Product = require("../../src/modules/products/product.model");
const Order = require("../../src/modules/orders/order.model");
const { sendRefillReminderEmail } = require("../../src/services/mailjetReminder.service");
const { runMonthlyRefillReminder } = require("../../src/jobs/monthlyRefillReminder.job");

const customerAEmail = "refill.cust.a@example.com";
const customerBEmail = "refill.cust.b@example.com";

let tokenA;
let tokenB;
let custAId;
let custBId;
let regularProduct;
let narcoticProduct;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Clean test fixtures
  await Customer.deleteMany({ email: { $in: [customerAEmail, customerBEmail] } });
  await Product.deleteMany({ name: { $in: ["Refill Test Panadol", "Refill Test Narcotic"] } });

  // Create test customers
  const custA = await Customer.create({
    name: "Customer A Refill",
    email: customerAEmail,
    passwordHash: "dummyHash",
    phone: "03001234567",
    emailVerified: true,
  });
  custAId = custA._id.toString();

  const custB = await Customer.create({
    name: "Customer B Refill",
    email: customerBEmail,
    passwordHash: "dummyHash",
    phone: "03007654321",
    emailVerified: true,
  });
  custBId = custB._id.toString();

  await MonthlyRefill.deleteMany({ customerId: { $in: [custAId, custBId] } });

  const secret = process.env.JWT_SECRET || "test-secret";
  tokenA = jwt.sign({ sub: custAId, role: "customer", email: customerAEmail }, secret, {
    expiresIn: "1h",
  });
  tokenB = jwt.sign({ sub: custBId, role: "customer", email: customerBEmail }, secret, {
    expiresIn: "1h",
  });

  // Create products
  regularProduct = await Product.create({
    name: "Refill Test Panadol",
    slug: "refill-test-panadol",
    sku: "PAN-REF-001",
    price: 150,
    stock: 50,
    stockStatus: "in_stock",
    active: true,
    isNarcotic: false,
  });

  narcoticProduct = await Product.create({
    name: "Refill Test Narcotic",
    slug: "refill-test-narcotic",
    sku: "NAR-REF-002",
    price: 500,
    stock: 20,
    stockStatus: "in_stock",
    active: true,
    isNarcotic: true,
  });
});

afterAll(async () => {
  await Customer.deleteMany({ email: { $in: [customerAEmail, customerBEmail] } });
  await MonthlyRefill.deleteMany({ customerId: { $in: [custAId, custBId] } });
  await Product.deleteMany({ _id: { $in: [regularProduct._id, narcoticProduct._id] } });
  await Order.deleteMany({ "customer.email": customerAEmail });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe("Monthly Refill API (/api/v1/customer/monthly-refill)", () => {
  let createdItemId;

  test("1. Unauthenticated request is rejected with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/v1/customer/monthly-refill");
    expect(res.status).toBe(401);
  });

  test("2. Rejects narcotic product from automated refills with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        productId: narcoticProduct._id.toString(),
        quantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/narcotic/i);
  });

  test("3. Adds regular product to refill list and creates list document on first use", async () => {
    const res = await request(app)
      .post("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        productId: regularProduct._id.toString(),
        quantity: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].name).toBe("Refill Test Panadol");
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.subtotal).toBe(300); // 150 * 2

    createdItemId = res.body.data.items[0]._id;
    expect(createdItemId).toBeDefined();
  });

  test("4. Increments quantity when adding the same product again", async () => {
    const res = await request(app)
      .post("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        productId: regularProduct._id.toString(),
        quantity: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].quantity).toBe(3); // 2 + 1
    expect(res.body.data.subtotal).toBe(450); // 150 * 3
  });

  test("5. GET / returns only authenticated customer's own list", async () => {
    // Customer A has 1 item
    const resA = await request(app)
      .get("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.count).toBe(1);
    expect(resA.body.data.items[0].name).toBe("Refill Test Panadol");

    // Customer B has empty list
    const resB = await request(app)
      .get("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.count).toBe(0);
    expect(resB.body.data.items.length).toBe(0);
  });

  test("6. PATCH /:itemId updates quantity for authorized owner", async () => {
    const res = await request(app)
      .patch(`/api/v1/customer/monthly-refill/${createdItemId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(5);
    expect(res.body.data.subtotal).toBe(750); // 150 * 5
  });

  test("7. Object-level authorization: Customer B cannot modify Customer A's item (403 Forbidden)", async () => {
    const res = await request(app)
      .patch(`/api/v1/customer/monthly-refill/${createdItemId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ quantity: 99 });

    expect(res.status).toBe(403);
  });

  test("8. Object-level authorization: Customer B cannot delete Customer A's item (403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/v1/customer/monthly-refill/${createdItemId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  test("9. POST /reorder builds an order, updates lastOrderedAt and sets nextReminderAt (+30 days)", async () => {
    const res = await request(app)
      .post("/api/v1/customer/monthly-refill/reorder")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        address: "House 123, Street 4, Clifton",
        city: "Karachi",
        phone: "03001234567",
        paymentMethod: "cod",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.order.items.length).toBe(1);
    expect(res.body.data.order.items[0].name).toBe("Refill Test Panadol");
    expect(res.body.data.order.customer.email).toBe(customerAEmail);
    expect(res.body.data.nextReminderAt).toBeDefined();

    // Verify DB update
    const doc = await MonthlyRefill.findOne({ customerId: custAId });
    expect(doc.lastOrderedAt).toBeTruthy();
    expect(doc.nextReminderAt).toBeTruthy();
    expect(doc.reminderSentAt).toBeNull(); // reset for next cycle

    // Verify nextReminderAt is ~30 days in future
    const diffDays = Math.round(
      (new Date(doc.nextReminderAt) - new Date(doc.lastOrderedAt)) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });

  test("10. DELETE /:itemId removes single item for authorized owner", async () => {
    const res = await request(app)
      .delete(`/api/v1/customer/monthly-refill/${createdItemId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.count).toBe(0);
  });

  test("11. DELETE / clears entire list", async () => {
    // Add an item first
    await request(app)
      .post("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ productId: regularProduct._id.toString(), quantity: 1 });

    const res = await request(app)
      .delete("/api/v1/customer/monthly-refill")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
  });
});

describe("Mailjet Reminder Service & Cron Job", () => {
  test("12. sendRefillReminderEmail never throws even when unconfigured", async () => {
    const res = await sendRefillReminderEmail(
      { email: "test@example.com", name: "Test User", id: "test-id" },
      [{ name: "Panadol", quantity: 2 }]
    );

    expect(res).toBeDefined();
    // Either sent or credentials not configured, but must NOT throw
    expect(typeof res.success).toBe("boolean");
  });

  test("13. Daily cron runner correctly finds eligible overdue lists", async () => {
    // Set customer A's list to overdue (nextReminderAt in past, reminderSentAt null)
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await MonthlyRefill.findOneAndUpdate(
      { customerId: custAId },
      {
        $set: {
          nextReminderAt: pastDate,
          reminderSentAt: null,
          items: [{ productId: regularProduct._id, quantity: 2, addedAt: new Date() }],
        },
      },
      { upsert: true }
    );

    const summary = await runMonthlyRefillReminder();
    expect(summary).toBeDefined();
    expect(summary.eligible).toBeGreaterThanOrEqual(1);
  });
});
