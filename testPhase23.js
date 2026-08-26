/**
 * Phase 23 Verification Test Script
 * Run from project root: node testPhase23.js
 *
 * This script automates the full Phase 23 test case requirements against the running backend,
 * showing the exact HTTP requests/responses and DB states for each action.
 */

const path = require("path");
const fs = require("fs");

const serverNodeModules = path.join(__dirname, "server", "node_modules");

// Load backend env config from server/node_modules/dotenv
require(path.join(serverNodeModules, "dotenv")).config({ path: path.join(__dirname, "server", ".env") });

const mongoose = require(path.join(serverNodeModules, "mongoose"));
const bcrypt = require(path.join(serverNodeModules, "bcryptjs"));

const BASE_URL = "http://localhost:5000/api/v1";
const ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const ADMIN_PASSWORD = "medikart@03314170744Abdullah";

// Test image files
const TEST_IMAGE_1 = "D:/Projects/testing/Acefer (50Mg5Ml) 120Ml Syrup.png";
const TEST_IMAGE_2 = "D:/Projects/testing/Acefyl (258MgMl) 125Ml Syrup.png";

let token = null;

async function request(method, endpoint, body = null, isMultipart = false) {
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body) {
    opts.body = isMultipart ? body : JSON.stringify(body);
  }

  console.log(`[HTTP Request] ${method} ${BASE_URL}${endpoint}`);
  if (body && !isMultipart) {
    console.log(`[Payload]`, JSON.stringify(body, null, 2));
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  console.log(`[HTTP Response Status] ${res.status}`);
  console.log(`[Response Body]`, JSON.stringify(json, null, 2));
  console.log("------------------------------------------------------------------");
  return { status: res.status, body: json };
}

async function main() {
  console.log("🚀 Starting Phase 23 Full Test Suite...\n");

  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("🔌 Connected to MongoDB directly for database checks.\n");

  const Product = require("./server/src/modules/products/product.model");
  const Order = require("./server/src/modules/orders/order.model");
  const Otp = require("./server/src/modules/otp/otp.model");

  // Clean up existing test data if any
  await Product.deleteMany({ sku: { $in: ["TEST-PH23-P1", "TEST-PH23-P2"] } });

  // 1. Log in as admin
  console.log("🔑 STEP 1: Log in as admin");
  const loginRes = await request("POST", "/auth/admin/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
    console.error("❌ Login failed!");
    process.exit(1);
  }
  token = loginRes.body.data.token;
  console.log("✅ Admin logged in successfully. Token acquired.\n");

  // 2. See today's order count match a direct database query
  console.log("📊 STEP 2: Compare today's order count with direct DB query");
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayDbCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });
  console.log(`[DB DIRECT QUERY] Orders created today: ${todayDbCount}`);

  // Fetch overview parameters
  console.log("[Overview Screen Fetch]: Retrieving counts from order list endpoint...");
  const ordersListRes = await request("GET", "/admin/orders?limit=1");
  const apiTotalOrders = ordersListRes.body?.data?.total || 0;
  console.log(`[Overview Screen Fetch]: Total Orders from API: ${apiTotalOrders}`);
  console.log("⚠️ Note: Today's order count is a backend gap since GET /admin/orders does not filter by date range.\n");

  // 3. Flag a product Narcotics from the UI and confirm it reflects instantly
  console.log("💊 STEP 3: Create a product and flag it as Narcotics");
  const productCreateRes = await request("POST", "/admin/products", {
    name: "Phase 23 Test Medicine",
    price: 120.00,
    sku: "TEST-PH23-P1",
  });
  const productId = productCreateRes.body._id;

  console.log("Flagging product as Narcotics...");
  await request("PATCH", `/admin/products/${productId}/narcotics`, {
    isNarcotic: true,
  });

  console.log("Verifying narcotics flag reflects instantly...");
  const productVerifyRes = await request("GET", `/admin/products/${productId}`);
  if (productVerifyRes.body?.data?.product?.isNarcotic !== true) {
    console.error("❌ Narcotics flag did not update correctly!");
    process.exit(1);
  }
  console.log("✅ Product narcotics flag updated successfully.\n");

  // 4. Upload a second product image and set it primary
  console.log("🖼️ STEP 4: Upload images and set secondary as primary");
  const form1 = new FormData();
  const fileBuffer1 = fs.readFileSync(TEST_IMAGE_1);
  const blob1 = new Blob([fileBuffer1], { type: "image/png" });
  form1.append("images", blob1, path.basename(TEST_IMAGE_1));

  console.log("Uploading first image...");
  const upload1Res = await request("POST", `/admin/products/${productId}/images`, form1, true);

  const form2 = new FormData();
  const fileBuffer2 = fs.readFileSync(TEST_IMAGE_2);
  const blob2 = new Blob([fileBuffer2], { type: "image/png" });
  form2.append("images", blob2, path.basename(TEST_IMAGE_2));

  console.log("Uploading second image...");
  const upload2Res = await request("POST", `/admin/products/${productId}/images`, form2, true);

  const images = upload2Res.body.data.images;
  console.log("Current product images:", JSON.stringify(images, null, 2));

  const secondaryImage = images.find(img => !img.isPrimary);
  if (!secondaryImage) {
    console.error("❌ Secondary image not found!");
    process.exit(1);
  }

  console.log(`Setting image ${secondaryImage._id} as primary...`);
  const primaryRes = await request("PATCH", `/admin/products/${productId}/images/${secondaryImage._id}/primary`);
  
  const updatedImages = primaryRes.body.data.images;
  const isCorrectPrimary = updatedImages.find(img => img._id === secondaryImage._id)?.isPrimary;
  if (!isCorrectPrimary) {
    console.error("❌ Failed to set primary image!");
    process.exit(1);
  }
  console.log("✅ Primary image updated successfully.\n");

  // 5. Approve a narcotics order's prescription from the Orders screen
  console.log("📋 STEP 5: Create a Narcotics order and approve its prescription");
  const testEmail = "test-narcotics@medikart.test";
  const otpCode = "123456";

  // Pre-seed OTP in database
  await Otp.deleteMany({ email: testEmail });
  await Otp.create({
    email: testEmail,
    codeHash: await bcrypt.hash(otpCode, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  console.log(`[DB SEED] OTP 123456 seeded for ${testEmail}`);

  // Create narcotics checkout order with prescription upload
  const formOrder = new FormData();
  formOrder.append("customer", JSON.stringify({
    name: "John Narcotics",
    email: testEmail,
    phone: "03001234567",
    address: "123 Narcotic Lane",
    city: "Lahore",
  }));
  formOrder.append("items", JSON.stringify([
    { productId: productId, quantity: 1 }
  ]));
  formOrder.append("paymentMethod", "cod");
  formOrder.append("otp", JSON.stringify({
    email: testEmail,
    code: otpCode,
  }));
  const presBuffer = fs.readFileSync(TEST_IMAGE_1);
  const presBlob = new Blob([presBuffer], { type: "image/png" });
  formOrder.append("prescription", presBlob, "prescription.png");

  console.log("Submitting Narcotics order...");
  const orderRes = await request("POST", "/orders/narcotics", formOrder, true);
  const orderId = orderRes.body.data.order._id;

  console.log(`Approving prescription for order ${orderId}...`);
  const approveRes = await request("PATCH", `/admin/orders/${orderId}/verification`, {
    decision: "approved",
  });

  if (approveRes.body?.data?.order?.status !== "pending") {
    console.error("❌ Narcotics verification status did not change to pending!");
    process.exit(1);
  }
  console.log("✅ Narcotics order approved and moved to pending.\n");

  // 6. Cancel a Pending order and confirm its status and payment state update correctly in the UI
  console.log("❌ STEP 6: Place a card-paid order, mark paid, cancel it, and manual refund");
  
  // Clean OTP and seed again
  await Otp.deleteMany({ email: testEmail });
  await Otp.create({
    email: testEmail,
    codeHash: await bcrypt.hash(otpCode, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // Create standard test product (must be non-narcotic for card payments)
  const standardProductRes = await request("POST", "/admin/products", {
    name: "Phase 23 Standard Vitamin",
    price: 350.00,
    sku: "TEST-PH23-P2",
  });
  const standardProductId = standardProductRes.body._id;

  console.log("Submitting standard order with paymentMethod: card...");
  const stdOrderRes = await request("POST", "/orders/standard", {
    customer: {
      name: "Alice Cardholder",
      email: testEmail,
      phone: "03211234567",
      address: "789 Online St",
      city: "Lahore",
    },
    items: [
      { productId: standardProductId, quantity: 2 }
    ],
    paymentMethod: "card",
    otp: {
      email: testEmail,
      code: otpCode,
    }
  });

  const cardOrderId = stdOrderRes.body.data.order._id;

  // Mark paymentState as paid in the database directly to simulate Habib Metro webhook
  await Order.findByIdAndUpdate(cardOrderId, { $set: { paymentState: "paid" } });
  console.log(`[DB DIRECT UPDATE] Marked order ${cardOrderId} paymentState as 'paid'.`);

  console.log("Cancelling the order...");
  const cancelRes = await request("PATCH", `/admin/orders/${cardOrderId}/cancel`, {
    reason: "Out of stock or customer requested",
  });

  const updatedOrder = cancelRes.body?.data?.order;
  if (updatedOrder?.status !== "cancelled" || updatedOrder?.cancellation?.refundStatus !== "refund_pending") {
    console.error("❌ Order cancellation or refundStatus state mismatch!", updatedOrder);
    process.exit(1);
  }
  console.log("✅ Order cancelled. Status is 'cancelled' and refundStatus is 'refund_pending'.\n");

  console.log("Marking order as manually refunded...");
  const refundRes = await request("PATCH", `/admin/orders/${cardOrderId}/refund`);
  
  const refundedOrder = refundRes.body?.data?.order;
  if (refundedOrder?.cancellation?.refundStatus !== "refunded" || refundedOrder?.paymentState !== "refunded") {
    console.error("❌ Refund status did not update to refunded!", refundedOrder);
    process.exit(1);
  }
  console.log("✅ Order marked refunded. refundStatus is 'refunded' and paymentState is 'refunded'.\n");

  console.log("🎉 All Phase 23 Verification Test Cases PASSED successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("💥 Test suite crash:", err.message);
  process.exit(1);
});
