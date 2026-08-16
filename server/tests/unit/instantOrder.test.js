/**
 * Phase 14 Test — Instant Order Workflow (FR-CW-12 / FR-AD-19).
 *
 * Test cases:
 *   1. Submit instant order with prescription + no items → items [] + awaiting-pharmacist-pricing
 *   2. Admin adds 2 medicines + total → correct update + pending status
 *   3. Submit instant order without prescription → rejected
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../src/app');
const Order = require('../../src/modules/orders/order.model');
const Product = require('../../src/modules/products/product.model');
const Category = require('../../src/modules/categories/category.model');
const City = require('../../src/modules/cities/city.model');
const AdminUser = require('../../src/modules/admin-users/adminUser.model');
const Otp = require('../../src/modules/otp/otp.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let authToken;
let product1, product2;
let city;

beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medikart_test';
  await mongoose.connect(mongoUri);

  // Clean up
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});
  await Otp.deleteMany({});

  // Create test city
  city = await City.create({
    name: 'Test City',
    slug: 'test-city',
    deliveryCharge: 100,
    active: true,
  });

  // Create test category
  const category = await Category.create({
    name: 'Test Category',
    slug: 'test-category',
    active: true,
  });

  // Create test products
  product1 = await Product.create({
    name: 'Test Medicine 1',
    sku: 'TEST-MED-001',
    categoryIds: [category._id],
    price: 500,
    stockStatus: 'in_stock',
    active: true,
    isNarcotic: false,
  });

  product2 = await Product.create({
    name: 'Test Medicine 2',
    sku: 'TEST-MED-002',
    categoryIds: [category._id],
    price: 750,
    stockStatus: 'in_stock',
    active: true,
    isNarcotic: false,
  });

  // Create admin user for authentication
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await AdminUser.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    passwordHash: hashedPassword,
    role: 'admin',
  });

  // Generate auth token
  authToken = jwt.sign(
    { sub: admin._id.toString(), role: admin.role, email: admin.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}, 30000);

afterAll(async () => {
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await City.deleteMany({});
  await AdminUser.deleteMany({});
  await Otp.deleteMany({});
  await mongoose.connection.close();

  // Clean up test prescription files
  const uploadsDir = path.join(__dirname, '../../uploads/prescriptions');
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(files.map(file => fs.unlink(path.join(uploadsDir, file))));
  } catch (err) {
    // Directory might not exist, that's OK
  }
}, 30000);

/**
 * Helper: Request OTP and return the test code
 */
const requestTestOtp = async (email) => {
  const response = await request(app)
    .post('/api/v1/otp/request')
    .send({ email })
    .expect(200);

  return response.body._testCode;
};

describe('Phase 14 — Instant Order Workflow', () => {
  test('Test 1: Submit instant order with prescription → items=[] + awaiting-pharmacist-pricing', async () => {
    const email = 'customer1@test.com';
    const otpCode = await requestTestOtp(email);

    // Create a dummy prescription file
    const prescriptionPath = path.join(__dirname, 'test-prescription.jpg');
    await fs.writeFile(prescriptionPath, 'fake-prescription-content');

    const response = await request(app)
      .post('/api/v1/orders/instant')
      .field('customer', JSON.stringify({
        name: 'John Doe',
        email,
        phone: '03001234567',
        address: '123 Test Street',
        city: city.name,
      }))
      .field('paymentMethod', 'cod')
      .field('otp', JSON.stringify({ email, code: otpCode }))
      .field('branchDescription', 'Main branch location')
      .attach('prescription', prescriptionPath)
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.data.order).toMatchObject({
      type: 'instant',
      items: [],
      status: 'awaiting-pharmacist-pricing',
      paymentMethod: 'cod',
      customer: {
        name: 'John Doe',
        email,
      },
    });
    expect(response.body.data.order.prescriptionUrl).toMatch(/\/uploads\/prescriptions\/.+/);
    expect(response.body.data.order.totals.subtotal).toBe(0);
    expect(response.body.data.order.totals.deliveryCharge).toBe(100);
    expect(response.body.data.order.totals.total).toBe(100);

    // Clean up test file
    await fs.unlink(prescriptionPath);
  }, 15000);

  test('Test 2: Admin adds 2 medicines + total → correct update + pending status', async () => {
    const email = 'customer2@test.com';
    const otpCode = await requestTestOtp(email);

    // Create prescription file
    const prescriptionPath = path.join(__dirname, 'test-prescription2.jpg');
    await fs.writeFile(prescriptionPath, 'fake-prescription-content-2');

    // Submit instant order
    const orderResponse = await request(app)
      .post('/api/v1/orders/instant')
      .field('customer', JSON.stringify({
        name: 'Jane Smith',
        email,
        phone: '03009876543',
        address: '456 Test Avenue',
        city: city.name,
      }))
      .field('paymentMethod', 'cod')
      .field('otp', JSON.stringify({ email, code: otpCode }))
      .attach('prescription', prescriptionPath)
      .expect(201);

    const orderId = orderResponse.body.data.order._id;

    // Admin prices the order
    const pricingResponse = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { productId: product1._id.toString(), quantity: 2 },
          { productId: product2._id.toString(), quantity: 1 },
        ],
      })
      .expect(200);

    expect(pricingResponse.body.status).toBe('success');
    expect(pricingResponse.body.data.order).toMatchObject({
      type: 'instant',
      status: 'pending',
      items: [
        {
          productId: product1._id.toString(),
          name: 'Test Medicine 1',
          quantity: 2,
        },
        {
          productId: product2._id.toString(),
          name: 'Test Medicine 2',
          quantity: 1,
        },
      ],
    });

    // Verify items array has 2 items and prices are server-computed
    expect(pricingResponse.body.data.order.items).toHaveLength(2);
    expect(pricingResponse.body.data.order.items[0].price).toBeGreaterThan(0);
    expect(pricingResponse.body.data.order.items[1].price).toBeGreaterThan(0);

    // Verify totals are computed correctly (subtotal + delivery)
    const subtotal = pricingResponse.body.data.order.totals.subtotal;
    const deliveryCharge = pricingResponse.body.data.order.totals.deliveryCharge;
    const total = pricingResponse.body.data.order.totals.total;

    expect(deliveryCharge).toBe(100);
    expect(total).toBe(subtotal + deliveryCharge);
    expect(subtotal).toBeGreaterThan(0);

    // Clean up test file
    await fs.unlink(prescriptionPath);
  }, 15000);

  test('Test 3: Submit instant order without prescription → rejected', async () => {
    const email = 'customer3@test.com';
    const otpCode = await requestTestOtp(email);

    const response = await request(app)
      .post('/api/v1/orders/instant')
      .field('customer', JSON.stringify({
        name: 'Bob Johnson',
        email,
        phone: '03001112222',
        address: '789 Test Road',
        city: city.name,
      }))
      .field('paymentMethod', 'cod')
      .field('otp', JSON.stringify({ email, code: otpCode }))
      .field('branchDescription', 'Branch location')
      // No .attach('prescription', ...) — prescription missing
      .expect(400);

    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/prescription/i);
  }, 15000);
});
