/**
 * Phase 7 — Cities & Delivery Pricing Test Script
 * Run from: D:/Projects/Medikart/server
 *   node testPhase7.js
 *
 * Tests (exactly as specified in phases.md):
 *   1. Add "Lahore" (active, charge=250) → delivery-charge lookup returns 250
 *   2. Lookup "Multan" (not configured)  → returns 500
 *   3. Confirm no request parameter lets a caller pass a charge in
 */

require("dotenv").config();

const mongoose = require("mongoose");

const BASE = "http://localhost:5000/api/v1";

// Login to get a JWT (routes are auth-protected)
const ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const ADMIN_PASSWORD = "medikart@03314170744Abdullah";

let passed = 0;
let failed = 0;
let token = null;
let lahoreId = null;

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

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: jsonHeaders() });
  return { status: res.status };
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 7 — Cities & Delivery Pricing Tests");
  console.log("══════════════════════════════════════════════════════\n");

  // ── Get JWT ───────────────────────────────────────────────────────────────
  const loginRes = await post("/auth/admin/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    console.error("  ❌  Could not log in — aborting tests");
    console.error("      ", JSON.stringify(loginRes.body));
    process.exit(1);
  }
  token = loginRes.body.data.token;
  console.log("  🔑  Logged in as Super Admin\n");

  // Clean up any leftover Lahore/Multan from previous runs
  await mongoose.connect(process.env.MONGODB_URI);
  const City = require("./src/modules/cities/city.model");
  await City.deleteMany({ name: { $in: ["Lahore", "Multan"] } });
  await mongoose.disconnect();

  // ── TEST 1: Add Lahore → delivery charge = 250 ────────────────────────────
  console.log("🏙️   Test 1: Add Lahore (active, charge=250) and verify lookup");

  await assert("POST /cities — create Lahore with charge 250 → 201", async () => {
    const { status, body } = await post("/admin/cities", {
      name: "Lahore",
      deliveryCharge: 250,
      active: true,
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body.data?.city || body)}`);
    expect(status, 201, `Expected 201, got ${status} — ${JSON.stringify(body)}`);
    expectTruthy(body.data?.city?._id, "Response must include city._id");
    lahoreId = body.data.city._id;
  });

  await assert("GET /cities/delivery-charge?city=Lahore → 250", async () => {
    const { status, body } = await get("/admin/cities/delivery-charge?city=Lahore");
    console.log(`       Response: ${status} — ${JSON.stringify(body.data)}`);
    expect(status, 200, `Expected 200, got ${status}`);
    expect(body.data?.deliveryCharge, 250, `Expected 250 for Lahore, got ${body.data?.deliveryCharge}`);
  });

  // ── TEST 2: Multan (not configured) → 500 ────────────────────────────────
  console.log("\n🏙️   Test 2: Multan (not configured) → delivery charge = 500");

  await assert("GET /cities/delivery-charge?city=Multan → 500 (default)", async () => {
    const { status, body } = await get("/admin/cities/delivery-charge?city=Multan");
    console.log(`       Response: ${status} — ${JSON.stringify(body.data)}`);
    expect(status, 200, `Expected 200, got ${status}`);
    expect(body.data?.deliveryCharge, 500, `Expected 500 for unconfigured city, got ${body.data?.deliveryCharge}`);
  });

  await assert("Inactive city also returns 500 (active=false treated as unconfigured)", async () => {
    // Create an inactive city to verify active check
    const createRes = await post("/admin/cities", { name: "Multan", deliveryCharge: 300, active: false });
    const { status, body } = await get("/admin/cities/delivery-charge?city=Multan");
    console.log(`       Response: ${status} — ${JSON.stringify(body.data)}`);
    expect(body.data?.deliveryCharge, 500, `Inactive city must return 500, got ${body.data?.deliveryCharge}`);
    // cleanup
    if (createRes.data?.city?._id) await del(`/admin/cities/${createRes.data.city._id}`);
  });

  // ── TEST 3: No way to pass a delivery charge in from the client ────────────
  console.log("\n🛡️   Test 3: Confirm no endpoint accepts a delivery charge from the client");

  await assert("POST /cities with extra 'charge' field → 400 (Zod strict)", async () => {
    const { status, body } = await post("/admin/cities", {
      name: "FakeCity",
      deliveryCharge: 250,
      active: true,
      charge: 999, // injected extra field — must be rejected
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 400, `Expected 400 for unrecognised field, got ${status}`);
  });

  await assert("delivery-charge endpoint has no body/query param for amount", async () => {
    // Even if a caller tries to pass ?amount=0, it's completely ignored —
    // the response is still computed server-side from the city name alone
    const { status, body } = await get("/admin/cities/delivery-charge?city=Lahore&amount=0&charge=0&deliveryCharge=0");
    console.log(`       Response: ${status} — ${JSON.stringify(body.data)}`);
    expect(status, 200, `Expected 200`);
    // Must still return 250 (from DB) not 0 (from query params)
    expect(body.data?.deliveryCharge, 250, `Charge must be 250 from DB, not 0 from query param`);
  });

  // ── Full CRUD round-trip ──────────────────────────────────────────────────
  console.log("\n🔄  CRUD round-trip");

  await assert("GET /cities — list includes Lahore", async () => {
    const { status, body } = await get("/admin/cities");
    expect(status, 200);
    expectTruthy(Array.isArray(body.data?.cities), "Expected cities array");
    const found = body.data.cities.some((c) => c.name === "Lahore");
    expectTruthy(found, "Lahore must appear in the cities list");
  });

  await assert("PUT /cities/:id — update Lahore charge to 275", async () => {
    if (!lahoreId) throw new Error("No lahoreId");
    const { status, body } = await put(`/admin/cities/${lahoreId}`, { deliveryCharge: 275 });
    expect(status, 200, `Expected 200, got ${status}`);
    expect(body.data?.city?.deliveryCharge, 275, `Expected 275 after update`);
  });

  await assert("DELETE /cities/:id — delete Lahore → 204", async () => {
    if (!lahoreId) throw new Error("No lahoreId");
    const { status } = await del(`/admin/cities/${lahoreId}`);
    expect(status, 204, `Expected 204, got ${status}`);
  });

  await assert("delivery-charge for deleted Lahore → 500 (fallback)", async () => {
    const { status, body } = await get("/admin/cities/delivery-charge?city=Lahore");
    expect(status, 200);
    expect(body.data?.deliveryCharge, 500, `After deletion, Lahore should return 500`);
  });

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
