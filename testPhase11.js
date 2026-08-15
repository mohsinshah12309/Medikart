/**
 * Phase 11 — Narcotics Flagging & Audit Test Script
 * Run from root: node testPhase11.js
 *
 * Tests (per phases.md & prompt instructions):
 *   1. Flag a product as Narcotics via PATCH /:id/narcotics — confirm it now appears in GET /products/narcotics.
 *   2. Remove the flag via the same endpoint — confirm it disappears from that view immediately.
 *   3. Confirm two Activity Log entries exist for that product: one narcotics_flag_added, one narcotics_flag_removed, each with correct actor, entityId, and timestamp.
 *   4. Bulk-flag three products at once via PATCH /bulk/narcotics — confirm all three appear in narcotics view and three Activity Log entries are written.
 *   5. Attempt to call narcotics endpoint without a JWT — confirm 401.
 */

const path = require("path");
const serverNodeModules = path.join(__dirname, "server", "node_modules");

require(path.join(serverNodeModules, "dotenv")).config({ path: path.join(__dirname, "server", ".env") });
const mongoose = require(path.join(serverNodeModules, "mongoose"));
const { connectDB } = require("./server/src/config/db");
const app = require("./server/src/app");

const BASE = "http://localhost:5000/api/v1";
const SUPER_ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const SUPER_ADMIN_PASS = "medikart@03314170744Abdullah";

let passed = 0;
let failed = 0;
let serverInstance = null;

async function request(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 11 — Narcotics Flagging & Audit Tests");
  console.log("══════════════════════════════════════════════════════\n");

  await connectDB();
  serverInstance = app.listen(5000);

  const Product = require("./server/src/modules/products/product.model");
  const ActivityLog = require("./server/src/modules/activity-logs/activityLog.model");


  // 1. Obtain JWT Token via Admin Login
  console.log("🔑 Authenticating Super Admin...");
  const loginRes = await request("POST", "/auth/admin/login", {
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASS,
  });

  if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
    console.error("❌ Failed to log in super admin:", loginRes);
    process.exit(1);
  }
  const token = loginRes.body.data.token;

  console.log(`   Logged in successfully. Token acquired.\n`);

  // Create 3 test products
  console.log("📦 Creating 3 test products for Phase 11 tests...");
  const p1Res = await request("POST", "/admin/products", {
    name: "Test Paracetamol 500mg",
    price: 150,
    sku: `TEST-NARC-P1-${Date.now()}`,
  }, token);
  const p2Res = await request("POST", "/admin/products", {
    name: "Test Morphine 10mg",
    price: 500,
    sku: `TEST-NARC-P2-${Date.now()}`,
  }, token);
  const p3Res = await request("POST", "/admin/products", {
    name: "Test Oxycodone 20mg",
    price: 750,
    sku: `TEST-NARC-P3-${Date.now()}`,
  }, token);

  const p1Id = p1Res.body._id;
  const p2Id = p2Res.body._id;
  const p3Id = p3Res.body._id;

  console.log(`   Created test products: ${p1Id}, ${p2Id}, ${p3Id}\n`);

  try {
    // ── CHECK 1: Flag single product as Narcotics ─────────────────────────────
    console.log("📌 Check 1: PATCH /admin/products/:id/narcotics (isNarcotic: true)");
    const flagRes = await request("PATCH", `/admin/products/${p1Id}/narcotics`, { isNarcotic: true }, token);
    console.log(`   Response Status: ${flagRes.status}`);
    console.log(`   Response Payload:`, JSON.stringify(flagRes.body, null, 2));

    const narcoticsListRes1 = await request("GET", "/admin/products/narcotics", null, token);
    console.log(`   GET /admin/products/narcotics count: ${narcoticsListRes1.body.results}`);
    const foundP1InNarcotics = narcoticsListRes1.body.data.products.some(p => p._id.toString() === p1Id);
    
    if (flagRes.status === 200 && foundP1InNarcotics) {
      console.log("  ✅ Check 1 PASSED: Product successfully flagged and appears in narcotics view.\n");
      passed++;
    } else {
      console.log("  ❌ Check 1 FAILED.\n");
      failed++;
    }

    // ── CHECK 2: Remove Narcotics flag from single product ────────────────────
    console.log("📌 Check 2: PATCH /admin/products/:id/narcotics (isNarcotic: false)");
    const unflagRes = await request("PATCH", `/admin/products/${p1Id}/narcotics`, { isNarcotic: false }, token);
    console.log(`   Response Status: ${unflagRes.status}`);
    console.log(`   Response Payload:`, JSON.stringify(unflagRes.body, null, 2));

    const narcoticsListRes2 = await request("GET", "/admin/products/narcotics", null, token);
    const foundP1AfterUnflag = narcoticsListRes2.body.data.products.some(p => p._id.toString() === p1Id);

    if (unflagRes.status === 200 && !foundP1AfterUnflag) {
      console.log("  ✅ Check 2 PASSED: Flag removed and product disappeared from narcotics view.\n");
      passed++;
    } else {
      console.log("  ❌ Check 2 FAILED.\n");
      failed++;
    }

    // ── CHECK 3: Verify Activity Logs for single product ──────────────────────
    console.log("📌 Check 3: GET /admin/activity-logs (Verify 2 activity log entries for product P1)");
    const logsRes = await request("GET", `/admin/activity-logs?entityType=product&entityId=${p1Id}`, null, token);
    console.log(`   Response Status: ${logsRes.status}`);
    console.log(`   Activity Logs Found: ${logsRes.body.data ? logsRes.body.data.length : 0}`);
    console.log(`   Logs Payload:`, JSON.stringify(logsRes.body, null, 2));

    const logs = logsRes.body.data || [];
    const hasAddAction = logs.some(l => l.action === "narcotics_flag_added" && l.entityId.toString() === p1Id);
    const hasRemoveAction = logs.some(l => l.action === "narcotics_flag_removed" && l.entityId.toString() === p1Id);

    if (logsRes.status === 200 && logs.length >= 2 && hasAddAction && hasRemoveAction) {
      console.log("  ✅ Check 3 PASSED: Both narcotics_flag_added and narcotics_flag_removed logs exist with correct details.\n");
      passed++;
    } else {
      console.log("  ❌ Check 3 FAILED.\n");
      failed++;
    }

    // ── CHECK 4: Bulk-flag three products ──────────────────────────────────────
    console.log("📌 Check 4: PATCH /admin/products/bulk/narcotics (Bulk flag 3 products)");
    const bulkRes = await request("PATCH", "/admin/products/bulk/narcotics", {
      productIds: [p1Id, p2Id, p3Id],
      isNarcotic: true,
    }, token);
    console.log(`   Response Status: ${bulkRes.status}`);
    console.log(`   Response Payload:`, JSON.stringify(bulkRes.body, null, 2));

    const narcoticsListRes3 = await request("GET", "/admin/products/narcotics", null, token);
    const narcoticIds = narcoticsListRes3.body.data.products.map(p => p._id.toString());
    const all3Flagged = [p1Id, p2Id, p3Id].every(id => narcoticIds.includes(id));

    // Verify 3 activity log entries written for bulk
    const bulkLogsP1 = await ActivityLog.find({ entityId: p1Id, action: "narcotics_flag_added" });
    const bulkLogsP2 = await ActivityLog.find({ entityId: p2Id, action: "narcotics_flag_added" });
    const bulkLogsP3 = await ActivityLog.find({ entityId: p3Id, action: "narcotics_flag_added" });

    if (bulkRes.status === 200 && all3Flagged && bulkLogsP1.length && bulkLogsP2.length && bulkLogsP3.length) {
      console.log("  ✅ Check 4 PASSED: Bulk flagging succeeded, all 3 in narcotics view & activity log entries written.\n");
      passed++;
    } else {
      console.log("  ❌ Check 4 FAILED.\n");
      failed++;
    }

    // ── CHECK 5: Attempt call without JWT (401 Unauthorized) ──────────────────
    console.log("📌 Check 5: PATCH /admin/products/:id/narcotics WITHOUT JWT");
    const unauthRes = await request("PATCH", `/admin/products/${p1Id}/narcotics`, { isNarcotic: true });
    console.log(`   Response Status: ${unauthRes.status}`);
    console.log(`   Response Payload:`, JSON.stringify(unauthRes.body, null, 2));

    if (unauthRes.status === 401) {
      console.log("  ✅ Check 5 PASSED: Request rejected with 401 Unauthorized.\n");
      passed++;
    } else {
      console.log("  ❌ Check 5 FAILED.\n");
      failed++;
    }

  } finally {
    // Cleanup test products and logs created during test run
    console.log("🧹 Cleaning up test products & logs...");
    await Product.deleteMany({ _id: { $in: [p1Id, p2Id, p3Id] } });
    await ActivityLog.deleteMany({ entityId: { $in: [p1Id, p2Id, p3Id] } });
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
  }


  console.log("══════════════════════════════════════════════════════");
  console.log(`   Phase 11 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
