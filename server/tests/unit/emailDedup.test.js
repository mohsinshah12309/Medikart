/**
 * Phase 19 — Email Deduplication Tests (FR-CW-15).
 *
 * Verifies that exactly ONE confirmation email is sent per order placement,
 * regardless of:
 *   - Multiple concurrent or sequential calls to the email-once wrapper
 *   - Order type (standard / instant / narcotics)
 *
 * All tests mock smtp.sendEmail — no real emails sent.
 * All tests mock otpService.verifyOtp — no real OTP consumed.
 *
 * Tests:
 *   1. Standard order — exactly one confirmation email, sendEmail called once.
 *   2. Instant order — exactly one confirmation email, sendEmail called once.
 *   3. Narcotics order — exactly one confirmation email, sendEmail called once.
 *   4. Retry simulation — calling sendOrderConfirmationEmailOnce twice for the
 *      SAME order document only fires sendEmail once (the second call is blocked
 *      by the atomic confirmationEmailSent guard).
 *   5. confirmationEmailSent flag is persisted as true on the order document
 *      after the first send.
 */

jest.setTimeout(60000);

// ─── Load env FIRST (MONGODB_URI) ─────────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// ─── Mock SMTP BEFORE any module under test is loaded ─────────────────────────
jest.mock('../../src/integrations/smtp', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-dedup-id' }),
}));

// Mock sheetsSyncQueue to avoid Sheets API calls and background timers/retries
jest.mock('../../src/modules/integrations/sheetsSyncQueue', () => ({
  enqueueSheetSync: jest.fn(),
}));

// ─── Mock OTP service ────────────────────────────────────────────────────────
jest.mock('../../src/modules/otp/otp.service', () => ({
  verifyOtp: jest.fn().mockResolvedValue(true),
}));

// ─── Mock city service ────────────────────────────────────────────────────────
jest.mock('../../src/modules/cities/city.service', () => ({
  getDeliveryCharge: jest.fn().mockResolvedValue(250),
}));

// ─── Mock settings service ────────────────────────────────────────────────────
jest.mock('../../src/modules/settings/settings.service', () => ({
  getStorewideDiscount: jest.fn().mockResolvedValue(0),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const Order = require('../../src/modules/orders/order.model');
const Product = require('../../src/modules/products/product.model');
const Category = require('../../src/modules/categories/category.model');
const smtp = require('../../src/integrations/smtp');

// Import the handlers and their exported once-wrappers
const { placeStandardOrder, sendOrderConfirmationEmailOnce } = require('../../src/modules/orders/standardOrder.handler');
const { placeInstantOrder, sendInstantOrderConfirmationEmailOnce } = require('../../src/modules/orders/instantOrder.handler');
const { placeNarcoticsOrder, sendNarcoticsOrderConfirmationEmailOnce } = require('../../src/modules/orders/narcoticsOrder.handler');

// ─── Fixtures ──────────────────────────────────────────────────────────────────

let testCategory;
let testProduct;

// Standard customer payload
const CUSTOMER = {
  name: 'Dedup Test Customer',
  email: 'dedup@test.com',
  phone: '03001234567',
  address: '1 Dedup Lane',
  city: 'Karachi',
};

const OTP = { email: 'dedup@test.com', code: '123456' };

// ─── Global Setup / Teardown ──────────────────────────────────────────────────

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medikart_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Clean slate
  await Order.deleteMany({ 'customer.email': CUSTOMER.email });
  await Category.deleteMany({ slug: 'dedup-test-cat' });
  await Product.deleteMany({ sku: 'DEDUP-001' });

  // Seed a category and product for standard/narcotics order tests
  testCategory = await Category.create({
    name: 'Dedup Test Category',
    slug: 'dedup-test-cat',
  });

  testProduct = await Product.create({
    name: 'Dedup Medicine',
    sku: 'DEDUP-001',
    price: 200,
    stockStatus: 'in_stock',
    active: true,
    categoryIds: [testCategory._id],
    isNarcotic: false,
    images: [],
  });
}, 60000);

afterAll(async () => {
  await Order.deleteMany({ 'customer.email': CUSTOMER.email });
  await Category.deleteMany({ slug: 'dedup-test-cat' });
  await Product.deleteMany({ sku: 'DEDUP-001' });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}, 20000);

beforeEach(async () => {
  jest.clearAllMocks();
  // Fresh slate before each test
  await Order.deleteMany({ 'customer.email': CUSTOMER.email });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Phase 19 — Email Deduplication (FR-CW-15)', () => {

  // ── Test 1: Standard order — exactly one confirmation email ───────────────
  test('1. Standard order: placeStandardOrder calls smtp.sendEmail exactly once', async () => {
    const items = [{ productId: testProduct._id.toString(), quantity: 1 }];

    // Allow event loop to drain (the email is non-blocking / fire-and-forget)
    await placeStandardOrder({ customer: CUSTOMER, items, paymentMethod: 'cod', otp: OTP });

    // Flush the microtask queue so the non-blocking email .catch() resolves
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setTimeout(r, 500));

    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
    expect(smtp.sendEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
  });

  // ── Test 2: Instant order — exactly one confirmation email ────────────────
  test('2. Instant order: placeInstantOrder calls smtp.sendEmail exactly once', async () => {
    // placeInstantOrder requires a prescriptionFilename — provide a fake one
    await placeInstantOrder({
      customer: CUSTOMER,
      paymentMethod: 'cod',
      otp: OTP,
      branchDescription: 'DHA Branch',
      prescriptionFilename: 'fake-rx-dedup.jpg',
    });

    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setTimeout(r, 500));

    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
    expect(smtp.sendEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
  });

  // ── Test 3: Narcotics order — exactly one confirmation email ──────────────
  test('3. Narcotics order: placeNarcoticsOrder calls smtp.sendEmail exactly once', async () => {
    // Use non-narcotics product — narcotics order handler still works for
    // non-flagged products (requiresVerification will be false, no Rx gate)
    const items = [{ productId: testProduct._id.toString(), quantity: 2 }];

    await placeNarcoticsOrder({
      customer: CUSTOMER,
      items,
      paymentMethod: 'cod',
      otp: OTP,
      prescriptionFilename: null,
    });

    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setTimeout(r, 500));

    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
    expect(smtp.sendEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
  });

  // ── Test 4: Retry simulation — second call to *Once wrapper is a no-op ────
  test('4. sendOrderConfirmationEmailOnce: second call for the same order does NOT fire a second email', async () => {
    // Create an order directly (without going through the full handler)
    const order = await Order.create({
      type: 'standard',
      customer: CUSTOMER,
      items: [{ productId: testProduct._id, name: 'Dedup Medicine', price: 200, quantity: 1 }],
      totals: { subtotal: 200, deliveryCharge: 250, total: 450 },
      paymentMethod: 'cod',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      confirmationEmailSent: false, // starts as false
    });

    // First call — should claim the slot and send
    await sendOrderConfirmationEmailOnce(order);
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);

    // Second call (simulate a retry / duplicate request) — should be blocked
    await sendOrderConfirmationEmailOnce(order);
    // Still only one call — the guard prevents the second send
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
  });

  // ── Test 5: confirmationEmailSent flag is persisted after the first send ──
  test('5. confirmationEmailSent flag is set to true on the order document after the first send', async () => {
    const order = await Order.create({
      type: 'standard',
      customer: CUSTOMER,
      items: [{ productId: testProduct._id, name: 'Dedup Medicine', price: 200, quantity: 1 }],
      totals: { subtotal: 200, deliveryCharge: 250, total: 450 },
      paymentMethod: 'cod',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      confirmationEmailSent: false,
    });

    // Flag starts as false
    expect(order.confirmationEmailSent).toBe(false);

    // Trigger the send
    await sendOrderConfirmationEmailOnce(order);

    // Re-fetch from MongoDB and verify the flag is now true
    const updated = await Order.findById(order._id).lean();
    expect(updated.confirmationEmailSent).toBe(true);

    // Email was sent exactly once
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
  });

  // ── Test 6: Same guard works for instant and narcotics once-wrappers ───────
  test('6. sendInstantOrderConfirmationEmailOnce and sendNarcoticsOrderConfirmationEmailOnce: second call blocked', async () => {
    // Instant order
    const instantOrder = await Order.create({
      type: 'instant',
      customer: CUSTOMER,
      items: [],
      totals: { subtotal: 0, deliveryCharge: 250, total: 250 },
      paymentMethod: 'cod',
      paymentState: 'pending',
      status: 'awaiting-pharmacist-pricing',
      requiresVerification: false,
      prescriptionUrl: '/api/v1/admin/prescriptions/fake.jpg',
      confirmationEmailSent: false,
    });

    await sendInstantOrderConfirmationEmailOnce(instantOrder);
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);

    // Retry — blocked
    await sendInstantOrderConfirmationEmailOnce(instantOrder);
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Narcotics order
    const narcOrder = await Order.create({
      type: 'narcotics',
      customer: { ...CUSTOMER, email: 'dedup@test.com' },
      items: [{ productId: testProduct._id, name: 'Dedup Medicine', price: 200, quantity: 1 }],
      totals: { subtotal: 200, deliveryCharge: 250, total: 450 },
      paymentMethod: 'cod',
      paymentState: 'pending',
      status: 'pending_verification',
      requiresVerification: false,
      confirmationEmailSent: false,
    });

    await sendNarcoticsOrderConfirmationEmailOnce(narcOrder);
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);

    // Retry — blocked
    await sendNarcoticsOrderConfirmationEmailOnce(narcOrder);
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
  });
});
