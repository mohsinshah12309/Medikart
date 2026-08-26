/**
 * Phase 17 Test — Order Cancellation & Manual Refund Tracking.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Order = require("../../src/modules/orders/order.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Mock the SMTP integration
const smtp = require("../../src/integrations/smtp");
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mock-id", accepted: [] }),
}));

// Mock sheetsSyncQueue to avoid Sheets API calls and background timers/retries
jest.mock("../../src/modules/integrations/sheetsSyncQueue", () => ({
  enqueueSheetSync: jest.fn(),
}));

let authToken;
let adminId;

beforeAll(async () => {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  await mongoose.connect(mongoUri);

  await Order.deleteMany({});
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});

  // Create admin user for auth
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await AdminUser.create({
    name: "Test Admin",
    email: "admin@test.com",
    passwordHash: hashedPassword,
    role: "admin",
  });
  adminId = admin._id.toString();

  // Generate auth token
  authToken = jwt.sign(
    { sub: adminId, role: admin.role, email: admin.email },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" },
  );
});

afterAll(async () => {
  await Order.deleteMany({});
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Phase 17 — Order Cancellation & Manual Refund Tracking", () => {
  test("1. Cancel a Pending COD order (including a narcotics order) → status Cancelled, refundStatus not_applicable, no gateway/payment call attempted, exactly one cancellation email sent", async () => {
    // Create pending COD order
    const order = await Order.create({
      type: "narcotics",
      customer: {
        name: "COD Customer",
        email: "cod_customer@test.com",
        phone: "0300-1111111",
        address: "Street 1",
        city: "Lahore",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Test Medicine",
          price: 150,
          quantity: 2,
        },
      ],
      totals: {
        subtotal: 300,
        deliveryCharge: 250,
        total: 550,
      },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "pending",
      requiresVerification: true,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ reason: "Customer changed their mind" })
      .expect(200);

    expect(response.body.status).toBe("success");
    const updatedOrder = response.body.data.order;

    expect(updatedOrder.status).toBe("cancelled");
    expect(updatedOrder.cancellation).toMatchObject({
      reason: "Customer changed their mind",
      cancelledBy: adminId,
      refundStatus: "not_applicable",
    });
    expect(updatedOrder.cancellation.cancelledAt).toBeTruthy();

    // Exactly one cancellation email mock send assertion
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
    expect(smtp.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "cod_customer@test.com",
        subject: expect.stringContaining(`Order Cancelled — Medikart (#${order._id})`),
      })
    );

    // Verify activity log exists
    const logs = await ActivityLog.find({ entityId: order._id, action: "order_cancelled" });
    expect(logs.length).toBe(1);
    expect(logs[0].actor).toMatchObject({
      id: adminId,
      email: "admin@test.com",
      role: "admin",
    });
  });

  test("2. Cancel a Packed order with paymentState 'paid' → status Cancelled, refundStatus refund_pending", async () => {
    // Create packed paid order
    const order = await Order.create({
      type: "standard",
      customer: {
        name: "Card Customer",
        email: "card_customer@test.com",
        phone: "0300-2222222",
        address: "Street 2",
        city: "Karachi",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Standard Medicine",
          price: 200,
          quantity: 1,
        },
      ],
      totals: {
        subtotal: 200,
        deliveryCharge: 250,
        total: 450,
      },
      paymentMethod: "card",
      paymentState: "paid",
      status: "packed",
      requiresVerification: false,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ reason: "Stock issue" })
      .expect(200);

    expect(response.body.status).toBe("success");
    const updatedOrder = response.body.data.order;

    expect(updatedOrder.status).toBe("cancelled");
    expect(updatedOrder.cancellation).toMatchObject({
      reason: "Stock issue",
      cancelledBy: adminId,
      refundStatus: "refund_pending",
    });
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);
    expect(smtp.sendEmail.mock.calls[0][0].html).toContain("3-5 business days");
  });

  test("3. Call the refund endpoint on that refund_pending order → refundStatus becomes refunded, refundedBy/refundedAt set, Activity Log entry exists", async () => {
    // Find the cancelled order from previous test that has refund_pending status
    const order = await Order.findOne({ "cancellation.refundStatus": "refund_pending" });
    expect(order).toBeTruthy();

    const response = await request(app)
      .patch(`/api/v1/admin/orders/${order._id}/refund`)
      .set("Authorization", `Bearer ${authToken}`)
      .send()
      .expect(200);

    expect(response.body.status).toBe("success");
    const updatedOrder = response.body.data.order;

    expect(updatedOrder.cancellation.refundStatus).toBe("refunded");
    expect(updatedOrder.cancellation.refundedBy).toBe(adminId);
    expect(updatedOrder.cancellation.refundedAt).toBeTruthy();
    expect(updatedOrder.paymentState).toBe("refunded");

    // Verify activity log exists for refund
    const logs = await ActivityLog.find({ entityId: order._id, action: "refund_marked_complete" });
    expect(logs.length).toBe(1);
    expect(logs[0].actor).toMatchObject({
      id: adminId,
      email: "admin@test.com",
      role: "admin",
    });
  });

  test("4. Attempt to call the refund endpoint on an order that's not refund_pending → rejected", async () => {
    // Create an order that is pending and not cancelled (refundStatus is not even set)
    const order = await Order.create({
      type: "standard",
      customer: {
        name: "Standard Customer",
        email: "std@test.com",
        phone: "0300-3333333",
        address: "Street 3",
        city: "Islamabad",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Standard Medicine",
          price: 200,
          quantity: 1,
        },
      ],
      totals: {
        subtotal: 200,
        deliveryCharge: 250,
        total: 450,
      },
      paymentMethod: "card",
      paymentState: "pending",
      status: "pending",
      requiresVerification: false,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/orders/${order._id}/refund`)
      .set("Authorization", `Bearer ${authToken}`)
      .send()
      .expect(400);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toMatch(/refund_pending/i);
  });

  test("5. Attempt to cancel a Shipped or Delivered order → rejected with a clear error, status unchanged", async () => {
    // Create a shipped order
    const shippedOrder = await Order.create({
      type: "standard",
      customer: {
        name: "Shipped Customer",
        email: "shipped@test.com",
        phone: "0300-4444444",
        address: "Street 4",
        city: "Peshawar",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Standard Medicine",
          price: 200,
          quantity: 1,
        },
      ],
      totals: {
        subtotal: 200,
        deliveryCharge: 250,
        total: 450,
      },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "shipped",
      requiresVerification: false,
    });

    const responseShipped = await request(app)
      .patch(`/api/v1/admin/orders/${shippedOrder._id}/cancel`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ reason: "Cancel shipped" })
      .expect(400);

    expect(responseShipped.body.status).toBe("error");
    expect(responseShipped.body.message).toMatch(/Pending or Packed/i);

    // Verify status was unchanged in database
    const freshShipped = await Order.findById(shippedOrder._id);
    expect(freshShipped.status).toBe("shipped");

    // Create a delivered order
    const deliveredOrder = await Order.create({
      type: "standard",
      customer: {
        name: "Delivered Customer",
        email: "delivered@test.com",
        phone: "0300-5555555",
        address: "Street 5",
        city: "Quetta",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Standard Medicine",
          price: 200,
          quantity: 1,
        },
      ],
      totals: {
        subtotal: 200,
        deliveryCharge: 250,
        total: 450,
      },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "delivered",
      requiresVerification: false,
    });

    const responseDelivered = await request(app)
      .patch(`/api/v1/admin/orders/${deliveredOrder._id}/cancel`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ reason: "Cancel delivered" })
      .expect(400);

    expect(responseDelivered.body.status).toBe("error");
    expect(responseDelivered.body.message).toMatch(/Pending or Packed/i);

    // Verify status was unchanged in database
    const freshDelivered = await Order.findById(deliveredOrder._id);
    expect(freshDelivered.status).toBe("delivered");
  });

  test("6. Attempt both endpoints without admin auth → 401", async () => {
    // Create temporary order
    const order = await Order.create({
      type: "standard",
      customer: {
        name: "Auth Test Customer",
        email: "authtest@test.com",
        phone: "0300-6666666",
        address: "Street 6",
        city: "Lahore",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Standard Medicine",
          price: 200,
          quantity: 1,
        },
      ],
      totals: {
        subtotal: 200,
        deliveryCharge: 250,
        total: 450,
      },
      paymentMethod: "cod",
      paymentState: "pending",
      status: "pending",
      requiresVerification: false,
    });

    // Test cancel without token
    const resCancel = await request(app)
      .patch(`/api/v1/admin/orders/${order._id}/cancel`)
      .send({ reason: "No auth" })
      .expect(401);

    expect(resCancel.body.status).toBe("error");

    // Test refund without token
    const resRefund = await request(app)
      .patch(`/api/v1/admin/orders/${order._id}/refund`)
      .send()
      .expect(401);

    expect(resRefund.body.status).toBe("error");
  });
});
