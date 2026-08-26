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
const path = require('path');
const fs = require('fs').promises;

jest.mock('../../src/modules/payments/providers/kuickpay.provider');
const kuickpayProvider = require('../../src/modules/payments/providers/kuickpay.provider');

// Mock sheetsSyncQueue to avoid Sheets API calls and background timers/retries
jest.mock('../../src/modules/integrations/sheetsSyncQueue', () => ({
  enqueueSheetSync: jest.fn(),
}));

const VALID_JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

let city, category, standardProduct, narcoticsProduct, authToken;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  await mongoose.connect(mongoUri);

  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});

  city = await City.create({ name: 'Test City', deliveryCharge: 100, active: true });
  category = await Category.create({ name: 'Test Category', slug: 'test-category', active: true });

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
  authToken = jwt.sign({ sub: admin._id }, process.env.JWT_SECRET || "test-secret", { expiresIn: "1h" });
});

afterAll(async () => {
  await mongoose.connection.close();
});

const requestTestOtp = async (email) => {
  const response = await request(app).post("/api/v1/otp/request").send({ email }).expect(200);
  return response.body._testCode;
};

const makeCustomer = (email) => ({
  name: "Payment Customer", email, phone: "0300-1111111", address: "123 St", city: city.name
});

describe('Phase 16 & 15.1 — Payment Gateway and Restrictions', () => {
  beforeEach(() => {
    otpService._resetIpRequestLog();
    jest.clearAllMocks();
  });

  test('Phase 15.1: Card payment attempt on narcotics order is rejected', async () => {
    const email = "narcotics@test.com";
    const otpCode = await requestTestOtp(email);
    const filePath = path.join(__dirname, 'narc-prescription.jpg');
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

  test('Phase 16: Initiate card payment returns redirect and stores transaction ID', async () => {
    // 1. Place standard order with card
    const email = "card@test.com";
    const otpCode = await requestTestOtp(email);
    const orderRes = await request(app)
      .post('/api/v1/orders/standard')
      .send({
        customer: makeCustomer(email),
        items: [{ productId: standardProduct._id.toString(), quantity: 1 }],
        paymentMethod: 'card',
        otp: { email, code: otpCode }
      })
      .expect(201);
    
    const orderId = orderRes.body.data.order._id;

    // Mock kuickpay response
    kuickpayProvider.initiateCharge.mockResolvedValue({
      redirectUrl: 'https://sandbox.kuickpay.example/pay/12345',
      transactionId: 'TXN-12345'
    });

    // 2. Initiate payment
    const initRes = await request(app)
      .post(`/api/v1/orders/${orderId}/payment/initiate`)
      .expect(200);

    expect(initRes.body.redirectUrl).toBe('https://sandbox.kuickpay.example/pay/12345');
    expect(initRes.body.transactionId).toBe('TXN-12345');

    // Verify DB
    const order = await Order.findById(orderId);
    expect(order.gatewayTransactionId).toBe('TXN-12345');
    expect(order.paymentState).toBe('pending');
  });

  test('Phase 16: Webhook confirms payment success independently', async () => {
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('webhook1@test.com'),
      totals: { subtotal: 500, deliveryCharge: 100, total: 600 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      gatewayTransactionId: 'TXN-SUCCESS'
    });

    // Webhook says success, gateway verify confirms success
    kuickpayProvider.verifyTransaction.mockResolvedValue({ status: 'paid' });

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .send({ transactionId: 'TXN-SUCCESS', someFakeStatus: 'paid' })
      .expect(200);

    const updated = await Order.findById(order._id);
    expect(updated.paymentState).toBe('paid');
    expect(kuickpayProvider.verifyTransaction).toHaveBeenCalledWith('TXN-SUCCESS');
  });

  test('Phase 16: Webhook rejects forged success if gateway verify disagrees', async () => {
    const order = await Order.create({
      type: 'standard',
      customer: makeCustomer('webhook2@test.com'),
      totals: { subtotal: 500, deliveryCharge: 100, total: 600 },
      paymentMethod: 'card',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
      gatewayTransactionId: 'TXN-FORGED'
    });

    // Webhook says success, but gateway verify says failed!
    kuickpayProvider.verifyTransaction.mockResolvedValue({ status: 'failed' });

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook/kuickpay')
      .send({ transactionId: 'TXN-FORGED', status: 'paid' }) // Attacker claims paid
      .expect(200);

    const updated = await Order.findById(order._id);
    expect(updated.paymentState).toBe('failed'); // Not paid!
    expect(kuickpayProvider.verifyTransaction).toHaveBeenCalledWith('TXN-FORGED');
  });
});
