/**
 * Phase 8 — Integration / API test script
 * Run from: D:/Projects/Medikart/server
 *   node testPhase8.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const BASE = "http://localhost:5000/api/v1";

const ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const ADMIN_PASSWORD = "medikart@03314170744Abdullah";

let passed = 0;
let failed = 0;
let token = null;

async function assert(label, fn) {
  try {
    await fn();
    console.log(`  ✅  ${label}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${label}`);
    console.log(`       → ${e.message}`);
    failed++;
  }
}

function expect(actual, expected, msg) {
  if (actual !== expected)
    throw new Error(msg || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
}
function expectTruthy(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: jsonHeaders() });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function patch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 8 — API & Endpoints Tests");
  console.log("══════════════════════════════════════════════════════\n");

  const loginRes = await post("/auth/admin/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    console.error("  ❌ Could not log in — aborting tests");
    process.exit(1);
  }
  token = loginRes.body.data.token;
  console.log("  🔑 Logged in as Super Admin\n");

  let catId, prodId;

  // Clean up previous test artifacts if any
  await mongoose.connect(process.env.MONGODB_URI);
  const Category = require("./src/modules/categories/category.model");
  const Product = require("./src/modules/products/product.model");
  await Category.deleteMany({ slug: "discount-test-cat" });
  await Product.deleteMany({ sku: "DISC-TEST-001" });
  await mongoose.disconnect();

  // 1. Create test category & product
  await assert("Create test Category & Product", async () => {
    const catRes = await post("/admin/categories", { name: "Discount Test Cat", slug: "discount-test-cat" });
    expect(catRes.status, 201, `Category creation failed: ${JSON.stringify(catRes.body)}`);
    catId = catRes.body._id;

    const prodRes = await post("/admin/products", {
      name: "Discount Test Product",
      price: 1000,
      sku: "DISC-TEST-001",
      categoryIds: [catId],
    });
    expect(prodRes.status, 201, `Product creation failed: ${JSON.stringify(prodRes.body)}`);
    prodId = prodRes.body._id;
  });

  // 2. Set Category Discount
  await assert("PATCH /admin/categories/:id/discount → 200", async () => {
    const res = await patch(`/admin/categories/${catId}/discount`, { value: 10, active: true });
    expect(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    expect(res.body.data.discount.value, 10);
    expect(res.body.data.discount.active, true);
  });

  // 3. Set Product Discount
  await assert("PATCH /admin/products/:id/discount → 200", async () => {
    const res = await patch(`/admin/products/${prodId}/discount`, { value: 15, active: true });
    expect(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    expect(res.body.data.discount.value, 15);
    expect(res.body.data.discount.active, true);
  });

  // 4. Set Storewide Discount via Settings
  await assert("PUT /admin/settings/discount → 200", async () => {
    const res = await put("/admin/settings/discount", { value: 5, active: true });
    expect(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    expect(res.body.data.storewideDiscount.value, 5);
  });

  // 5. GET Storewide Discount
  await assert("GET /admin/settings/discount → 200", async () => {
    const res = await get("/admin/settings/discount");
    expect(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    expect(res.body.data.storewideDiscountPercent, 5);
  });

  // 6. Test allow-list security on discount endpoints (extra field rejected)
  await assert("PATCH /admin/products/:id/discount with extra field (price) → 400 (Zod strict)", async () => {
    const res = await patch(`/admin/products/${prodId}/discount`, { value: 20, active: true, price: 1 });
    expect(res.status, 400, `Expected 400 rejected, got ${res.status}`);
  });

  // Cleanup
  await mongoose.connect(process.env.MONGODB_URI);
  await Category.findByIdAndDelete(catId);
  await Product.findByIdAndDelete(prodId);
  await mongoose.disconnect();

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
