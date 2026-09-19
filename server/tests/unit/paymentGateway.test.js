const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Order = require('../../src/modules/orders/order.model');
const Product = require('../../src/modules/products/product.model');
const Category = require('../../src/modules/categories/category.model');
const City = require('../../src/modules/cities/city.model');
const jwt = require('jsonwebtoken');
const AdminUser = require('../../src/modules/admin-users/adminUser.model');
const otpService = require('../../src/modules/otp/otp.service');
const paymentService = require('../../src/modules/payments/payment.service');
const kuickpayProvider = require('../../src/modules/payments/providers/kuickpay.provider');
const path = require('path');
const fs = require('fs').promises;

jest.setTimeout(30000);

// Mock sheetsSyncQueue to avoid external Sheets API calls
jest.mock('../../src/modules/integrations/sheetsSyncQueue', () => ({
  enqueueSheetSync: jest.fn(),
}));

const VALID_JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

let city, category, standardProduct, narcoticsProduct, authToken;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});

  city = await City.create({ name: 'Lahore Test', deliveryCharge: 150, active: true });
  category = await Category.create({ name: 'Pharmacy Test', slug: 'pharmacy-test', active: true });

  standardProduct = await Product.create({
    name: 'Standard Medicine', sku: 'TEST-STD-01', categoryIds: [category._id],
    price: 500, stockStatus: 'in_stock', active: true, isNarcotic: false
  });

  narcoticsProduct = await Product.create({
    name: 'Narcotics Medicine', sku: 'TEST-NAR-01', categoryIds: [category._id],
    price: 1500, stockStatus: 'in_stock', active: true, isNarcotic: true
  });

  const admin = await AdminUser.create({
    name: "Admin", email: "admin@test.com", passwordHash: "hash", role: "admin"
  });
  authToken = jwt.sign({ sub: admin._id }, process.env.JWT_SECRET || "b3f2a1e7d94c8b0f6e52a3d1c7f4b8e0a5d2c9f6b1e4a7d0c3f8b5e2a9d6c3f0", { expiresIn: "1h" });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await Order.deleteMany({ 'customer.email': /kuickpay|test/i });
    await mongoose.connection.close();
  }
});

const makeCustomer = (email) => ({
  name: "Kuickpay Test Customer",
  email,
  phone: "0300-1234567",
  address: "House 12, Street 5, Gulberg III",
  city: city ? city.name : "Lahore Test"
});

describe('Kuickpay Sandbox Payment Gateway Verification Suite', () => {
  beforeEach(() => {
    otpService._resetIpRequestLog();
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CONFIGURATION SEPARATION (SANDBOX VS PRODUCTION)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 1: Kuickpay configuration defaults to SANDBOX / UAT base URL', () => {
    const config = kuickpayProvider.getKuickpayConfig();
    expect(config.env).toBe('sandbox');
    expect(config.sandboxUrl).toBe('https://uat.kuickpay.com');
    expect(config.productionUrl).toBe('https://api.kuickpay.com');
    expect(config.baseUrl).toContain('uat.kuickpay.com');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. NARCOTICS PAYMENT GATING
  // ─────────────────────────────────────────────────────────────────────────────
  test('Narcotics Gating: Card payment attempt on narcotics order is strictly rejected', async () => {
    const email = "narcotics-kuickpay@test.com";
    const otpRes = await request(app).post("/api/v1/otp/request").send({ email }).expect(200);
    const otpCode = otpRes.body._testCode;

    const filePath = path.join(__dirname, 'narc-test-prescription.jpg');
    await fs.writeFile(filePath, VALID_JPEG_BUFFER);

    const response = await request(app)
      .post('/api/v1/orders/narcotics')
      .field('customer', JSON.stringify(makeCustomer(email)))
      .field('items', JSON.stringify([{ productId: narcoticsProduct._id.toString(), quantity: 1 }]))
      .field('paymentMethod', 'card') // Invalid for narcotics
      .field('otp', JSON.stringify({ email, code: otpCode }))
      .attach('prescription', filePath)
      .expect(400);

    expect(response.body.message).toMatch(/only be paid via Cash on Delivery/i);
    await fs.unlink(filePath);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. HOSTED PAYMENT INITIATION (PCI-DSS SAQ-A SCOPE)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 2A: Standard card checkout initiates hosted payment session without server touching PAN', async () => {
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('card-initiate@test.com'),
      items: [{ productId: standardProduct._id, name: standardProduct.name, price: 500, quantity: 2 }],
      totals: { subtotal: 1000, deliveryCharge: 150, platformFee: 10, total: 1160 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
    });

    const initRes = await request(app)
      .post(`/api/v1/orders/${order._id}/payment/initiate`)
      .expect(200);

    expect(initRes.body).toHaveProperty('redirectUrl');
    expect(initRes.body).toHaveProperty('transactionId');
    expect(initRes.body.isHosted).toBe(true);
    expect(initRes.body.environment).toBe('sandbox');

    // Verify DB linkage
    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.paymentMethod).toBe('card');
    expect(orderInDb.paymentState).toBe('pending');
    expect(orderInDb.gatewayTransactionId).toBe(initRes.body.transactionId);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. WEBHOOK SECURITY & AUTHENTICITY VERIFICATION (TASK 3)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 3: Unsigned or forged webhook request is REJECTED with 401 Unauthorized', async () => {
    const fakePayload = {
      transactionId: 'TXN-FORGED-999',
      status: 'paid'
    };

    // A. Missing signature header
    const unsignedRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .send(fakePayload)
      .expect(401);

    expect(unsignedRes.body.error).toMatch(/unauthorized/i);

    // B. Invalid/Tampered signature header
    const forgedRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .set('x-kuickpay-signature', 'invalid_fake_hmac_hash')
      .send(fakePayload)
      .expect(401);

    expect(forgedRes.body.error).toMatch(/unauthorized/i);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SUCCESS WEBHOOK FLOW WITH TEST CARD 5123-4500-0000-0008 (TASK 2B)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 2B: Success test card payment via authenticated webhook updates paymentState to paid', async () => {
    const txnId = 'TXN-KP-SUCCESS-0008';
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('card-success@test.com'),
      totals: { subtotal: 1000, deliveryCharge: 150, platformFee: 10, total: 1160 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      gatewayTransactionId: txnId
    });

    const payload = {
      transactionId: txnId,
      cardLast4: '0008',
      cardScheme: 'Mastercard',
      authCode: '00',
    };

    const signature = kuickpayProvider.generateWebhookSignature(payload);

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .set('x-kuickpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(webhookRes.body.received).toBe(true);

    const updated = await Order.findById(order._id);
    expect(updated.paymentState).toBe('paid');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. DECLINE / FAILURE WEBHOOK FLOW (TASK 2C)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 2C: Decline simulation test via authenticated webhook updates paymentState to failed', async () => {
    const txnId = 'TXN-KP-DECLINE-0009';
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('card-decline@test.com'),
      totals: { subtotal: 500, deliveryCharge: 150, platformFee: 10, total: 660 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      gatewayTransactionId: txnId
    });

    const payload = {
      transactionId: txnId,
      cardLast4: '0009',
      responseCode: '51', // Insufficient Funds
      message: 'Declined by Issuing Bank',
    };

    const signature = kuickpayProvider.generateWebhookSignature(payload);

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .set('x-kuickpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(webhookRes.body.received).toBe(true);

    const updated = await Order.findById(order._id);
    expect(updated.paymentState).toBe('failed');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. STATUS-CHECK API FALLBACK (TASK 4)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 4: Status-check API fallback queries Kuickpay gateway directly and updates DB', async () => {
    const txnId = 'TXN-KP-FALLBACK-VERIFY';
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('fallback@test.com'),
      totals: { subtotal: 500, deliveryCharge: 150, platformFee: 10, total: 660 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      gatewayTransactionId: txnId
    });

    const statusRes = await request(app)
      .get(`/api/v1/payments/orders/${order._id}/status-check`)
      .expect(200);

    expect(statusRes.body.status).toBe('success');
    expect(statusRes.body.data.orderId.toString()).toBe(order._id.toString());
    expect(statusRes.body.data.paymentState).toBe('paid');

    const verifiedOrder = await Order.findById(order._id);
    expect(verifiedOrder.paymentState).toBe('paid');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. EDGE CASES (TASK 5)
  // ─────────────────────────────────────────────────────────────────────────────
  test('Task 5A: Abandoned checkout leaves order in pending state without side effects', async () => {
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('abandoned@test.com'),
      items: [{ productId: standardProduct._id, name: standardProduct.name, price: 500, quantity: 1 }],
      totals: { subtotal: 500, deliveryCharge: 150, platformFee: 10, total: 660 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
    });

    await request(app).post(`/api/v1/orders/${order._id}/payment/initiate`).expect(200);

    // Check DB state: remains pending
    const orderAfter = await Order.findById(order._id);
    expect(orderAfter.paymentState).toBe('pending');
    expect(orderAfter.status).toBe('pending');
  });

  test('Task 5B: Idempotent webhook handling on duplicate network retries', async () => {
    const txnId = 'TXN-KP-DUPLICATE-RETRY';
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('duplicate@test.com'),
      totals: { subtotal: 500, deliveryCharge: 150, platformFee: 10, total: 660 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      gatewayTransactionId: txnId
    });

    const payload = { transactionId: txnId };
    const signature = kuickpayProvider.generateWebhookSignature(payload);

    // First webhook call: transitions pending -> paid
    const firstRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .set('x-kuickpay-signature', signature)
      .send(payload)
      .expect(200);
    expect(firstRes.body.received).toBe(true);

    // Second webhook retry (network duplicate): handles idempotently
    const secondRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .set('x-kuickpay-signature', signature)
      .send(payload)
      .expect(200);
    expect(secondRes.body.received).toBe(true);
    expect(secondRes.body.idempotent).toBe(true);

    const finalOrder = await Order.findById(order._id);
    expect(finalOrder.paymentState).toBe('paid');
  });

  test('Task 5C: Webhook for non-existent transactionId fails gracefully with 404', async () => {
    const payload = { transactionId: 'TXN-DOES-NOT-EXIST-404' };
    const signature = kuickpayProvider.generateWebhookSignature(payload);

    const res = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .set('x-kuickpay-signature', signature)
      .send(payload)
      .expect(404);

    expect(res.body.message).toMatch(/not found/i);
  });
});
