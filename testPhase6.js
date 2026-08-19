/**
 * Phase 6 — Password Reset Test Script
 * Run from D:/Projects/Medikart/server:
 *   node ../testPhase6.js
 *
 * Tests (exactly as specified in phases.md):
 *   1. Request a reset for a real admin email → confirm token generated & email sent
 *   2. Use the token to set a new password → confirm admin can log in with it
 *   3. Reuse the same token → confirm it's rejected
 *
 * After tests the original password is restored so the system stays working.
 */

// Load .env from server/
require("dotenv").config({ path: require("path").join(__dirname, "server", ".env") });

const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const BASE = "http://localhost:5000/api/v1";

const SUPER_ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const ORIGINAL_PASSWORD = "medikart@03314170744Abdullah";
const NEW_PASSWORD = "NewTestPass@Phase6!";

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
  const res = await fetch(`${BASE}${path}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 6 — Admin Password Reset Tests");
  console.log("══════════════════════════════════════════════════════\n");

  await mongoose.connect(process.env.MONGODB_URI);

  // Require models after DB is connected
  const PasswordReset = require("./server/src/modules/admin-users/passwordReset.model");
  const AdminUser = require("./server/src/modules/admin-users/adminUser.model");

  let rawToken = null;

  // ── TEST 1: forgot-password ───────────────────────────────────────────────
  console.log("📧  Test 1: POST /forgot-password");

  await assert("Real email → 200 (same message regardless)", async () => {
    const { status, body } = await post("/auth/admin/forgot-password", {
      email: SUPER_ADMIN_EMAIL,
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 200, `Expected 200, got ${status}`);
    expectTruthy(body.message?.includes("If that email"), `Expected generic message, got: ${body.message}`);
  });

  await assert("Unknown email → still 200 (no enumeration leak)", async () => {
    const { status, body } = await post("/auth/admin/forgot-password", {
      email: "ghost@nonexistent.com",
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 200, `Expected 200 for unknown email too, got ${status}`);
  });

  await assert("passwordReset record created in DB with correct fields", async () => {
    const user = await AdminUser.findOne({ email: SUPER_ADMIN_EMAIL });
    expectTruthy(user, "Super Admin user not found");

    const record = await PasswordReset.findOne({ adminUserId: user._id, used: false });
    expectTruthy(record, "No passwordReset record in DB");
    expectTruthy(record.expiresAt > new Date(), "Token must not be expired yet");
    expectTruthy(!record.tokenHash.includes(" "), "tokenHash must be a compact hash string");
    console.log(`       Record _id : ${record._id}`);
    console.log(`       Expires at : ${record.expiresAt.toISOString()}`);
    console.log(`       Used       : ${record.used}`);
    console.log(`       Email sent : ✉️  Check Mailtrap inbox for ${SUPER_ADMIN_EMAIL}`);

    // Inject a known test token so we can test reset without reading email
    const freshRaw = crypto.randomBytes(32).toString("hex");
    const freshHash = crypto.createHash("sha256").update(freshRaw).digest("hex");
    await PasswordReset.findByIdAndUpdate(record._id, { tokenHash: freshHash });
    rawToken = freshRaw;
    console.log(`       [TEST] Injected fresh test token into DB record`);
  });

  // ── TEST 2: reset-password ────────────────────────────────────────────────
  console.log("\n🔑  Test 2: POST /reset-password with valid token");

  await assert("Valid token → 200 + password updated", async () => {
    if (!rawToken) throw new Error("Skipped — no rawToken from test 1");
    const { status, body } = await post("/auth/admin/reset-password", {
      token: rawToken,
      newPassword: NEW_PASSWORD,
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 200, `Expected 200, got ${status} — ${JSON.stringify(body)}`);
    expectTruthy(body.message?.includes("reset successfully"), `Expected success message, got: ${body.message}`);
  });

  await assert("Admin can log in with the NEW password", async () => {
    const { status, body } = await post("/auth/admin/login", {
      email: SUPER_ADMIN_EMAIL,
      password: NEW_PASSWORD,
    });
    console.log(`       Response: ${status} — JWT: ${body.data?.token?.slice(0, 30)}...`);
    expect(status, 200, `Login with new password failed: ${status} — ${JSON.stringify(body)}`);
    expectTruthy(body.data?.token, "Must return a JWT");
  });

  // ── TEST 3: Reuse the same token ──────────────────────────────────────────
  console.log("\n🚫  Test 3: Reuse same token after it's been consumed");

  await assert("Used token → 400 with generic error (no leak of reason)", async () => {
    if (!rawToken) throw new Error("Skipped — no rawToken");
    const { status, body } = await post("/auth/admin/reset-password", {
      token: rawToken,
      newPassword: "AnotherPass@999!",
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 400, `Expected 400 for used token, got ${status}`);
    expectTruthy(body.message?.includes("no longer valid"), `Expected generic error, got: ${body.message}`);
  });

  // ── RESTORE original password ─────────────────────────────────────────────
  console.log("\n🔄  Restoring original Super Admin password...");
  try {
    const hash = await bcrypt.hash(ORIGINAL_PASSWORD, 12);
    await AdminUser.findOneAndUpdate({ email: SUPER_ADMIN_EMAIL }, { passwordHash: hash });
    console.log("  ✅  Original password restored successfully.");
  } catch (e) {
    console.log(`  ⚠️   Restore failed: ${e.message}`);
  }

  await mongoose.disconnect();

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error:", err.message);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
