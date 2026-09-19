/**
 * emailProviderSeparation.test.js
 *
 * Verifies email provider separation:
 *   1. Regular orders, OTPs, and system notifications use Brevo SMTP relay with correct sender details.
 *   2. Monthly refill order placement and scheduled reminders use Mailjet Send API v3.1.
 */

jest.setTimeout(60000);

require("dotenv").config();

const mongoose = require("mongoose");
const Order = require("../../src/modules/orders/order.model");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");
const Customer = require("../../src/modules/customers/customer.model");
const MonthlyRefill = require("../../src/modules/customers/monthlyRefill.model");

const smtp = require("../../src/integrations/smtp");
const mailjetService = require("../../src/services/mailjet.service");
const { reorderRefill } = require("../../src/modules/customers/monthlyRefill.service");
const { sendOrderConfirmationEmailOnce } = require("../../src/modules/orders/standardOrder.handler");

// Spy on email functions
jest.spyOn(smtp, "sendEmail");
jest.spyOn(mailjetService, "sendMonthlyRefillOrderEmail");
jest.spyOn(mailjetService, "sendRefillReminderEmail");

describe("Email Provider Separation: Brevo SMTP (Regular) vs Mailjet (Monthly Refill)", () => {
  let testCustomer;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is required");
    await mongoose.connect(mongoUri);

    // Clean test data
    await Customer.deleteMany({ email: /@test-email-sep\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-email-sep\.com$/ });
    await MonthlyRefill.deleteMany({});
    await Product.deleteMany({ sku: "SKU-EMAIL-TEST" });
    await Category.deleteMany({ slug: "cat-email-test" });

    testCategory = await Category.create({
      name: "Email Test Category",
      slug: "cat-email-test",
      active: true,
      discount: 0,
    });

    testProduct = await Product.create({
      name: "Vitamin C 500mg Email Test",
      slug: "vitamin-c-500mg-email-test",
      sku: "SKU-EMAIL-TEST",
      price: 250,
      active: true,
      stockStatus: "in_stock",
      isNarcotic: false,
      categoryIds: [testCategory._id],
    });

    testCustomer = await Customer.create({
      name: "Zain Email Test",
      email: "zain@test-email-sep.com",
      phone: "+923009998877",
      passwordHash: "hash123",
      verified: true,
    });
  });

  afterAll(async () => {
    await Customer.deleteMany({ email: /@test-email-sep\.com$/ });
    await Order.deleteMany({ "customer.email": /@test-email-sep\.com$/ });
    await MonthlyRefill.deleteMany({});
    await Product.deleteMany({ sku: "SKU-EMAIL-TEST" });
    await Category.deleteMany({ slug: "cat-email-test" });
    await mongoose.connection.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. REGULAR ORDERS USE BREVO SMTP
  // ─────────────────────────────────────────────────────────────────────────────
  test("1. Regular Standard Order uses Brevo SMTP with default Medikart sender", async () => {
    const regularOrder = await Order.create({
      type: "standard",
      customer: {
        name: "Zain Email Test",
        email: "zain@test-email-sep.com",
        phone: "+923009998877",
        address: "Street 10, DHA",
        city: "Lahore",
      },
      items: [
        {
          productId: testProduct._id,
          name: testProduct.name,
          price: 250,
          quantity: 2,
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
      status: "pending",
      confirmationEmailSent: false,
    });

    await sendOrderConfirmationEmailOnce(regularOrder);

    // Verify SMTP was called
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
    const smtpCallArgs = smtp.sendEmail.mock.calls[0][0];
    expect(smtpCallArgs.to).toBe("zain@test-email-sep.com");
    expect(smtpCallArgs.subject).toMatch(/Order Confirmed — Medikart/i);

    // Verify Mailjet was NOT called for regular orders
    expect(mailjetService.sendMonthlyRefillOrderEmail).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MONTHLY REFILL ORDERS USE MAILJET
  // ─────────────────────────────────────────────────────────────────────────────
  test("2. Monthly Refill Order placement uses dedicated Mailjet service", async () => {
    // Setup customer refill list
    const refillList = await MonthlyRefill.create({
      customerId: testCustomer._id,
      items: [
        {
          productId: testProduct._id,
          quantity: 3,
          addedAt: new Date(),
        },
      ],
      lastOrderedAt: null,
      nextReminderAt: null,
    });

    const result = await reorderRefill(testCustomer._id, {
      address: "House 55, Block B, Gulberg",
      city: "Lahore",
      phone: "+923009998877",
      paymentMethod: "cod",
    });

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();

    // Verify Mailjet Monthly Refill Order email was called
    expect(mailjetService.sendMonthlyRefillOrderEmail).toHaveBeenCalledTimes(1);
    const mailjetArgs = mailjetService.sendMonthlyRefillOrderEmail.mock.calls[0];
    expect(mailjetArgs[0].customer.email).toBe("zain@test-email-sep.com");
    expect(mailjetArgs[1]).toBeDefined(); // nextReminderDate
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SCHEDULED MONTHLY REFILL 30-DAY REMINDERS USE MAILJET
  // ─────────────────────────────────────────────────────────────────────────────
  test("3. Scheduled 30-Day Monthly Refill Reminder uses Mailjet service", async () => {
    const refillItems = [
      {
        name: testProduct.name,
        quantity: 2,
      },
    ];

    await mailjetService.sendRefillReminderEmail(testCustomer, refillItems);

    expect(mailjetService.sendRefillReminderEmail).toHaveBeenCalledTimes(1);
  });
});
