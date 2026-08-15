/**
 * Phase 4 — Automated CRUD Test Script
 * Runs against a locally running server on http://localhost:5000
 * Uses Node's built-in fetch (Node 18+)
 *
 * Uses timestamp-based unique slugs/SKUs to avoid duplicate-key errors
 * from previous test runs.
 */

const BASE = "http://localhost:5000/api/v1/admin";
const TS = Date.now(); // unique suffix for every run

let passed = 0;
let failed = 0;

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

const headers = { "Content-Type": "application/json" };

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}
async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: {} }; }
}
async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, { method: "PUT", headers, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}
async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  return { status: res.status, body: res.status === 204 ? null : await res.json().catch(() => null) };
}

// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n══════════════════════════════════════════");
  console.log("   Phase 4 — CRUD API Tests");
  console.log("══════════════════════════════════════════\n");

  // ── CATEGORIES ──────────────────────────────────────────────────────────────
  console.log("📁  CATEGORY endpoints");

  let categoryId;

  await assert("POST /categories → 201 + returns _id", async () => {
    const { status, body } = await post("/categories", {
      name: `Test Category ${TS}`,
      slug: `test-category-${TS}`,
      active: true,
    });
    expect(status, 201, `Expected 201, got ${status} — ${JSON.stringify(body)}`);
    // Accept either { _id } or { data: { category: { _id } } } response shapes
    const id = body._id || body?.data?.category?._id;
    expectTruthy(id, `Response must include _id, got: ${JSON.stringify(body)}`);
    categoryId = id;
  });

  await assert("GET /categories → 200 + results array", async () => {
    const { status, body } = await get("/categories");
    expect(status, 200, `Expected 200, got ${status}`);
    expectTruthy(Array.isArray(body?.data?.categories), `data.categories must be array, got: ${JSON.stringify(body)}`);
  });

  await assert("GET /categories/:id → 200 + correct document", async () => {
    if (!categoryId) throw new Error("Skipped — no categoryId from POST");
    const { status, body } = await get(`/categories/${categoryId}`);
    expect(status, 200, `Expected 200, got ${status} — ${JSON.stringify(body)}`);
    const returnedId = body?.data?.category?._id || body?._id;
    expect(returnedId, categoryId, "Returned wrong category");
  });

  await assert("PUT /categories/:id → 200 + returns _id", async () => {
    if (!categoryId) throw new Error("Skipped — no categoryId from POST");
    const { status, body } = await put(`/categories/${categoryId}`, {
      name: `Test Category ${TS} Updated`,
    });
    expect(status, 200, `Expected 200, got ${status} — ${JSON.stringify(body)}`);
    const returnedId = body._id || body?.data?.category?._id;
    expectTruthy(returnedId, `Response must include _id, got: ${JSON.stringify(body)}`);
  });

  // Validation: extra field should be rejected (Zod .strict())
  await assert("POST /categories with extra field → 400 (Zod strict)", async () => {
    const { status } = await post("/categories", {
      name: "Bad Cat",
      slug: `bad-cat-${TS}`,
      unknownField: "hack",
    });
    expect(status, 400, `Expected 400 for extra field, got ${status}`);
  });

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  console.log("\n📦  PRODUCT endpoints");

  let productId;

  await assert("POST /products → 201 + returns _id", async () => {
    const body_payload = {
      name: `Paracetamol 500mg ${TS}`,
      price: 12.5,
      sku: `PARA-${TS}`,
      active: true,
    };
    // Only add categoryIds if we have a valid one
    if (categoryId) body_payload.categoryIds = [categoryId];

    const { status, body } = await post("/products", body_payload);
    expect(status, 201, `Expected 201, got ${status} — ${JSON.stringify(body)}`);
    const id = body._id || body?.data?.product?._id;
    expectTruthy(id, `Response must include _id, got: ${JSON.stringify(body)}`);
    productId = id;
  });

  await assert("GET /products → 200 + results array", async () => {
    const { status, body } = await get("/products");
    expect(status, 200, `Expected 200, got ${status}`);
    expectTruthy(Array.isArray(body?.data?.products), `data.products must be array, got: ${JSON.stringify(body)}`);
  });

  await assert("GET /products/:id → 200 + correct document", async () => {
    if (!productId) throw new Error("Skipped — no productId from POST");
    const { status, body } = await get(`/products/${productId}`);
    expect(status, 200, `Expected 200, got ${status} — ${JSON.stringify(body)}`);
    const returnedId = body?.data?.product?._id || body?._id;
    expect(returnedId, productId, "Returned wrong product");
  });

  await assert("PUT /products/:id → 200 + returns _id", async () => {
    if (!productId) throw new Error("Skipped — no productId from POST");
    const { status, body } = await put(`/products/${productId}`, {
      name: `Paracetamol 500mg ${TS} Updated`,
      price: 14.99,
    });
    expect(status, 200, `Expected 200, got ${status} — ${JSON.stringify(body)}`);
    const returnedId = body._id || body?.data?.product?._id;
    expectTruthy(returnedId, `Response must include _id, got: ${JSON.stringify(body)}`);
  });

  // Validation: extra field should be rejected
  await assert("POST /products with extra field → 400 (Zod strict)", async () => {
    const { status } = await post("/products", {
      name: "Bad Product",
      price: 10,
      sku: `BAD-${TS}`,
      unknownField: "hack",
    });
    expect(status, 400, `Expected 400 for extra field, got ${status}`);
  });

  // ── DELETES (run last) ───────────────────────────────────────────────────────
  console.log("\n🗑️   DELETE endpoints");

  await assert("DELETE /products/:id → 204", async () => {
    if (!productId) throw new Error("Skipped — no productId");
    const { status } = await del(`/products/${productId}`);
    expect(status, 204, `Expected 204, got ${status}`);
  });

  await assert("GET /products/:id after delete → 404", async () => {
    if (!productId) throw new Error("Skipped — no productId");
    const { status } = await get(`/products/${productId}`);
    expect(status, 404, `Expected 404 after deletion, got ${status}`);
  });

  await assert("DELETE /categories/:id → 204", async () => {
    if (!categoryId) throw new Error("Skipped — no categoryId");
    const { status } = await del(`/categories/${categoryId}`);
    expect(status, 204, `Expected 204, got ${status}`);
  });

  await assert("GET /categories/:id after delete → 404", async () => {
    if (!categoryId) throw new Error("Skipped — no categoryId");
    const { status } = await get(`/categories/${categoryId}`);
    expect(status, 404, `Expected 404 after deletion, got ${status}`);
  });

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════");
  console.log(`   Results: ${passed} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
