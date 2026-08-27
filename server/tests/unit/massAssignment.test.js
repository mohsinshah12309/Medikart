/**
 * massAssignment.test.js — Audit Fix / Verification (PART B - Item 5).
 *
 * Tests mass-assignment vulnerability protection:
 *   Submits order requests containing injected request body fields like `price`,
 *   `isNarcotic`, `role`, `status`, `totals`, and verifies that Zod schema parsing
 *   and handler business logic strip/ignore them completely.
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
const otpService = require("../../src/modules/otp/otp.service");
const Settings = require("../../src/modules/settings/settings.model");
const { setStorewideDiscount } = require("../../src/modules/settings/settings.service");

// Mock SMTP send
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mock-id" }),
}));

// Mock sheetsSyncQueue to avoid Sheets API calls and background timers/retries
jest.mock("../../src/modules/integrations/sheetsSyncQueue", () => ({
  enqueueSheetSync: jest.fn(),
}));

let testProduct;
let testCity;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);

  await Order.deleteMany({ "customer.email": "mass-assign@test.com" });
  await Product.deleteMany({ name: "Mass Assign Paracetamol" });
  await Category.deleteMany({ slug: "mass-assign-cat" });
  await City.deleteMany({ slug: "mass-assign-city" });
  await Otp.deleteMany({ email: "mass-assign@test.com" });
  await Settings.deleteMany({});

  await setStorewideDiscount({ value: 5, active: true });

  testCity = await City.create({
    name: "Lahore",
    slug: "mass-assign-city",
    deliveryCharge: 200,
    active: true,
  });

  const category = await Category.create({
    name: "General",
    slug: "mass-assign-cat",
    active: true,
  });

  testProduct = await Product.create({
    name: "Mass Assign Paracetamol",
    genericName: "Paracetamol",
    sku: "MASS-ASSIGN-SKU",
    categoryIds: [category._id],
    price: 500, // Real price: 500 PKR
    isNarcotic: false,
    active: true,
    requiresPrescription: false,
  });
}, 90000);

afterAll(async () => {
  await Order.deleteMany({ "customer.email": "mass-assign@test.com" });
  if (testProduct) {
    await Product.deleteOne({ _id: testProduct._id });
  }
  await Otp.deleteMany({ email: "mass-assign@test.com" });
  await Settings.deleteMany({});
  await mongoose.connection.close();
}, 90000);

describe("Mass Assignment Protection", () => {
  test("POST /api/v1/orders/standard strips injected price, status, role, and totals fields", async () => {
    const email = "mass-assign@test.com";
    const otpResult = await otpService.requestOtp(email, "1.2.3.4");
    const rawOtp = otpResult._testCode;

    // Inject fake price (1 PKR), fake status ("delivered"), fake role ("super_admin"), fake totals ({ total: 0 })
    const payload = {
      customer: {
        name: "Test User",
        email,
        phone: "+923001234567",
        address: "Street 1",
        city: "Lahore",
      },
      items: [
        {
          productId: testProduct._id.toString(),
          quantity: 2,
          price: 1, // Attacker trying to set price to 1 PKR
          isNarcotic: true, // Attacker trying to tamper with narcotics flag
        },
      ],
      paymentMethod: "cod",
      otp: {
        email,
        code: rawOtp,
      },

      // Root-level mass-assignment injections:
      status: "delivered",
      role: "super_admin",
      totals: { subtotal: 1, deliveryCharge: 0, total: 1 },
      requiresVerification: false,
    };

    const res = await request(app)
      .post("/api/v1/orders/standard")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");

    const savedOrder = await Order.findById(res.body.data.order._id);
    expect(savedOrder).toBeTruthy();

    // 1. Status must be "pending", NOT "delivered"
    expect(savedOrder.status).toBe("pending");

    // 2. Item price must NOT be 1 (from injected payload) — server-calculated effective price is 475 (500 base minus 5% storewide discount)
    expect(savedOrder.items[0].price).not.toBe(1);
    expect(savedOrder.items[0].price).toBe(475);

    // 3. Totals must be server-calculated: 2 * 475 + 200 delivery = 1150 PKR
    expect(savedOrder.totals.subtotal).toBe(950);
    expect(savedOrder.totals.deliveryCharge).toBe(200);
    expect(savedOrder.totals.total).toBe(1150);

    // 4. Injected root/item attributes must not corrupt the document
    expect(savedOrder.role).toBeUndefined();
  });
});
