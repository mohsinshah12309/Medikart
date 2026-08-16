/**
 * Phase 13 verification — Standard COD order workflow.
 * Run from server: node testPhase13.js
 *
 * Exercises the five checks requested for this phase and prints the actual
 * HTTP request/response payloads plus MongoDB and SMTP delivery evidence.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');
const Product = require('./src/modules/products/product.model');
const City = require('./src/modules/cities/city.model');
const Order = require('./src/modules/orders/order.model');
const Otp = require('./src/modules/otp/otp.model');
const AdminUser = require('./src/modules/admin-users/adminUser.model');
const Settings = require('./src/modules/settings/settings.model');
const { hashPassword } = require('./src/modules/admin-users/adminUser.service');
const smtp = require('./src/integrations/smtp');

const stamp = Date.now();
const email = `phase13-${stamp}@medikart.test`;
const adminEmail = `phase13-admin-${stamp}@medikart.test`;
const productSkuPrefix = `P13-${stamp}`;
const sentEmails = [];
const originalSendEmail = smtp.sendEmail;
let originalSettings = null;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const print = (label, value) => console.log(`${label}: ${JSON.stringify(value, null, 2)}`);

async function main() {
  let server;
  const originalNodeEnv = process.env.NODE_ENV;
  // Capture the message submitted to the configured SMTP server while preserving
  // the real send operation. This gives the test the OTP without logging it in
  // application code or changing the production endpoint response.
  smtp.sendEmail = async (message) => {
    const result = await originalSendEmail(message);
    sentEmails.push({ to: message.to, subject: message.subject, result });
    return result;
  };

  try {
    const runChecks2To5Only = process.env.PHASE13_CHECKS_2_TO_5_ONLY === 'true';
    await connectDB();
    if (mongoose.connection.readyState !== 1) throw new Error('MongoDB connection is unavailable');
    server = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

    const request = async (method, endpoint, body, token) => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    };

    await Promise.all([
      Product.deleteMany({ sku: new RegExp(`^${productSkuPrefix}`) }),
      City.deleteMany({ name: `Phase13 City ${stamp}` }),
      Otp.deleteMany({ email }),
      AdminUser.deleteMany({ email: adminEmail }),
    ]);
    // Phase 13 verifies raw database prices. Preserve any existing project
    // discount configuration and temporarily neutralise the storewide layer.
    originalSettings = await Settings.findOne().lean();
    await Settings.findOneAndUpdate(
      {},
      { $set: { storewideDiscount: { value: 0, active: false } } },
      { upsert: true, new: true }
    );

    const [firstProduct, secondProduct, outOfStockProduct] = await Product.create([
      { name: 'Phase 13 Pain Relief', sku: `${productSkuPrefix}-A`, price: 100, stockStatus: 'in_stock', active: true },
      { name: 'Phase 13 Vitamin C', sku: `${productSkuPrefix}-B`, price: 200, stockStatus: 'in_stock', active: true },
      { name: 'Phase 13 Unavailable', sku: `${productSkuPrefix}-OOS`, price: 300, stockStatus: 'out_of_stock', active: true },
    ]);
    await City.create({ name: `Phase13 City ${stamp}`, deliveryCharge: 250, active: true });
    await AdminUser.create({
      name: 'Phase 13 Admin', email: adminEmail, passwordHash: await hashPassword('Phase13Pass!'), role: 'super_admin', active: true,
    });

    const customer = {
      name: 'Phase 13 Customer', email, phone: '03001234567', address: '13 Test Street', city: `Phase13 City ${stamp}`,
    };
    // Store outgoing message bodies solely in this test process for extracting a
    // valid OTP; the wrapper preserves the real SMTP delivery operation.
    smtp.sendEmail = async (message) => {
      const result = await originalSendEmail(message);
      sentEmails.push({ to: message.to, subject: message.subject, text: message.text, result });
      return result;
    };
    const freshOtp = async () => {
      const before = sentEmails.length;
      const response = await request('POST', '/otp/request', { email });
      print('OTP request response', response);
      const message = sentEmails.slice(before).find((entry) => entry.subject === 'Your Medikart Verification Code');
      const match = message && /code is: (\d{6})/.exec(message.text);
      if (response.status !== 200 || !match) throw new Error('Unable to obtain a delivered OTP for Phase 13 test');
      return match[1];
    };
    const seedOtpForOrder = async (code) => {
      await Otp.create({
        email,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      return code;
    };

    console.log('\nCHECK 1 — valid COD order, database totals, and confirmation email');
    const validOtp = runChecks2To5Only ? await seedOtpForOrder('222222') : await freshOtp();
    // Mailtrap's free test inbox accepts only a very low message rate.
    if (!runChecks2To5Only) await wait(16000);
    const happyPayload = {
      customer,
      items: [{ productId: firstProduct.id, quantity: 2 }, { productId: secondProduct.id, quantity: 1 }],
      paymentMethod: 'cod', otp: { email, code: validOtp },
    };
    const happy = await request('POST', '/orders/standard', happyPayload);
    print('POST /orders/standard response', happy);
    const createdOrder = happy.body?.data?.order && await Order.findById(happy.body.data.order._id).lean();
    print('MongoDB order verification', createdOrder && {
      id: createdOrder._id, type: createdOrder.type, totals: createdOrder.totals,
      status: createdOrder.status, paymentMethod: createdOrder.paymentMethod,
      paymentState: createdOrder.paymentState, requiresVerification: createdOrder.requiresVerification,
    });
    if (!runChecks2To5Only) await wait(5000);
    const confirmation = sentEmails.find((entry) => entry.subject.includes('Order Confirmed'));
    print('SMTP confirmation delivery evidence', confirmation && { to: confirmation.to, subject: confirmation.subject, accepted: confirmation.result.accepted, messageId: confirmation.result.messageId });
    const check1 = happy.status === 201 && createdOrder && createdOrder.totals.subtotal === 400 && createdOrder.totals.deliveryCharge === 250 && createdOrder.totals.total === 650 && createdOrder.status === 'pending' && confirmation?.result?.accepted?.includes(email);

    if (process.env.PHASE13_CHECK1_ONLY === 'true') {
      console.log(`\nPhase 13 check 1: ${check1 ? 'PASSED' : 'FAILED'}`);
      if (!check1) process.exitCode = 1;
      return;
    }

    console.log('\nCHECK 2 — price tampering is ignored');
    const tamperOtp = await seedOtpForOrder('111111');
    const tamper = await request('POST', '/orders/standard', {
      ...happyPayload,
      customer: { ...customer, city: `Unconfigured Phase13 City ${stamp}` },
      items: [{ productId: firstProduct.id, quantity: 1, price: 1 }],
      otp: { email, code: tamperOtp }, total: 1, deliveryCharge: 1,
    });
    print('Price-tampering response', tamper);
    const tamperedOrder = tamper.body?.data?.order && await Order.findById(tamper.body.data.order._id).lean();
    print('Price-tampering MongoDB verification', tamperedOrder && { itemPrice: tamperedOrder.items[0].price, totals: tamperedOrder.totals });
    const check2 = tamper.status === 201 && tamperedOrder?.items[0].price === 100 && tamperedOrder.totals.deliveryCharge === 500 && tamperedOrder.totals.total === 600;

    console.log('\nCHECK 3 — reused and invalid OTPs are rejected without orders');
    const ordersBeforeOtpFailures = await Order.countDocuments({ 'customer.email': email });
    const reused = await request('POST', '/orders/standard', happyPayload);
    await seedOtpForOrder('333333');
    const invalid = await request('POST', '/orders/standard', { ...happyPayload, otp: { email, code: '000000' } });
    print('Reused OTP response', reused);
    print('Invalid OTP response', invalid);
    const check3 = reused.status === 400 && invalid.status === 400 && (await Order.countDocuments({ 'customer.email': email })) === ordersBeforeOtpFailures;

    console.log('\nCHECK 4 — out-of-stock product is rejected');
    const outOfStock = await request('POST', '/orders/standard', {
      ...happyPayload, items: [{ productId: outOfStockProduct.id, quantity: 1 }], otp: { email, code: '000000' },
    });
    print('Out-of-stock response', outOfStock);
    const check4 = outOfStock.status === 400 && outOfStock.body?.message?.includes('out of stock');

    console.log('\nCHECK 5 — admin list returns the new pending order');
    const login = await request('POST', '/auth/admin/login', { email: adminEmail, password: 'Phase13Pass!' });
    print('Admin login response', { status: login.status, hasToken: Boolean(login.body?.data?.token) });
    const listing = await request('GET', '/admin/orders?type=standard&status=pending', undefined, login.body?.data?.token);
    print('GET /admin/orders response', listing);
    const check5 = listing.status === 200 && listing.body?.data?.orders?.some((order) => order._id === createdOrder._id.toString() && order.totals.total === 650 && order.status === 'pending');

    const checks = runChecks2To5Only ? [check2, check3, check4, check5] : [check1, check2, check3, check4, check5];
    console.log(`\nPhase 13 verification: ${checks.filter(Boolean).length}/${checks.length} checks passed`);
    if (!checks.every(Boolean)) process.exitCode = 1;
  } finally {
    smtp.sendEmail = originalSendEmail;
    await Product.deleteMany({ sku: new RegExp(`^${productSkuPrefix}`) });
    await City.deleteMany({ name: `Phase13 City ${stamp}` });
    await Otp.deleteMany({ email });
    await AdminUser.deleteMany({ email: adminEmail });
    await Order.deleteMany({ 'customer.email': email });
    if (originalSettings) {
      await Settings.replaceOne({ _id: originalSettings._id }, originalSettings, { upsert: true });
    } else {
      await Settings.deleteOne({});
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    process.env.NODE_ENV = originalNodeEnv;
  }
}

main().catch((error) => {
  console.error('Phase 13 verification failed:', error);
  process.exitCode = 1;
});
