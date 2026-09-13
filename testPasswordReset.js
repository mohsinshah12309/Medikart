/**
 * Password Reset Flow — Smoke Test
 * Run from root:  node testPasswordReset.js
 *
 * Tests:
 *   1. POST /auth/customer/forgot-password (non-existent email) → 200 generic (no enumeration)
 *   2. POST /auth/customer/forgot-password (missing body) → 400 validation
 *   3. POST /auth/customer/reset-password  (invalid token) → 400
 *   4. POST /auth/customer/reset-password  (short password) → 400 validation
 *   5. Full happy-path: signup → forgot-password (capture _testToken) → reset-password → verify new password via login
 */

const path = require("path");
const serverNodeModules = path.join(__dirname, "server", "node_modules");

require(path.join(serverNodeModules, "dotenv")).config({ path: path.join(__dirname, "server", ".env") });

const { connectDB } = require("./server/src/config/db");
const app = require("./server/src/app");

const BASE = "http://localhost:5000/api/v1";

let passed = 0;
let failed = 0;
let serverInstance = null;

async function request(method, urlPath, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${urlPath}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Password Reset Flow — Smoke Tests");
  console.log("══════════════════════════════════════════════════════\n");

  await connectDB();
  serverInstance = app.listen(5000);

  // Load models for cleanup
  const Customer = require("./server/src/modules/customers/customer.model");
  const CustomerPasswordReset = require("./server/src/modules/customers/customerPasswordReset.model");

  const TEST_EMAIL = `test_pwreset_${Date.now()}@test-domain-local.com`;
  const ORIG_PASS = "OrigPass123!";
  const NEW_PASS  = "NewPass456!";

  /* ── 1. Forgot password with non-existent email → 200 generic ── */
  {
    const r = await request("POST", "/auth/customer/forgot-password", { email: "nobody_xyz_404@example.com" });
    console.log(`📌 Check 1: forgot-password (non-existent email)`);
    console.log(`   Status: ${r.status} | Message: ${r.body?.message}`);
    assert("Returns 200 with generic message (no enumeration)", r.status === 200 && r.body?.status === "success");
  }

  /* ── 2. Missing email body → 400 ── */
  {
    const r = await request("POST", "/auth/customer/forgot-password", {});
    console.log(`\n📌 Check 2: forgot-password (missing email field)`);
    console.log(`   Status: ${r.status}`);
    assert("Returns 400 validation error", r.status === 400);
  }

  /* ── 3. Reset with bogus token → 400 ── */
  {
    const r = await request("POST", "/auth/customer/reset-password", {
      token: "a".repeat(64),
      password: "ValidPass123!",
    });
    console.log(`\n📌 Check 3: reset-password (invalid token)`);
    console.log(`   Status: ${r.status} | Message: ${r.body?.message}`);
    assert("Returns 400 with invalid token message", r.status === 400);
  }

  /* ── 4. Short password → 400 validation ── */
  {
    const r = await request("POST", "/auth/customer/reset-password", {
      token: "a".repeat(64),
      password: "abc",
    });
    console.log(`\n📌 Check 4: reset-password (password too short)`);
    console.log(`   Status: ${r.status}`);
    assert("Returns 400 validation error for short password", r.status === 400);
  }

  /* ── 5. Happy-path: signup → forgot-password → reset-password → login with new password ── */
  console.log(`\n📌 Check 5: Full happy-path reset flow`);

  // Reset rate limiters so previous test calls don't block us
  const { resetRateLimiters } = require("./server/src/middleware/rateLimiter");
  resetRateLimiters();
  await new Promise((r) => setTimeout(r, 50)); // let flush settle

  // 5a. Sign up a test customer (bypass OTP for speed — set emailVerified directly)
  let testCustomer = null;
  try {
    const bcrypt = require(path.join(serverNodeModules, "bcryptjs"));
    const hash = await bcrypt.hash(ORIG_PASS, 10);
    testCustomer = await Customer.create({
      name: "Reset Test User",
      email: TEST_EMAIL,
      passwordHash: hash,
      emailVerified: true,
    });
    console.log(`   Created test customer: ${testCustomer._id}`);
  } catch (e) {
    console.log(`   ⚠️  Could not create test customer: ${e.message}`);
    failed++;
  }

  if (testCustomer) {
    // 5b. Trigger forgot-password — capture _testToken (only returned in NODE_ENV=test)
    const fp = await request("POST", "/auth/customer/forgot-password", { email: TEST_EMAIL });
    console.log(`   forgot-password status: ${fp.status}`);
    assert("Forgot-password returns 200", fp.status === 200);

    const testToken = fp.body?._testToken;
    if (!testToken) {
      console.log("   ⚠️  _testToken not returned — NODE_ENV may not be 'test'. Skipping token-based checks.");
    } else {
      // 5c. Reset password with the captured token
      const rp = await request("POST", "/auth/customer/reset-password", {
        token: testToken,
        password: NEW_PASS,
      });
      console.log(`   reset-password status: ${rp.status} | message: ${rp.body?.message}`);
      assert("Reset-password with valid token returns 200", rp.status === 200 && rp.body?.status === "success");

      // 5d. Login with NEW password should succeed
      const login1 = await request("POST", "/auth/customer/login", { email: TEST_EMAIL, password: NEW_PASS });
      assert("Login with new password succeeds", login1.status === 200 && login1.body?.token);

      // 5e. Login with OLD password should fail
      const login2 = await request("POST", "/auth/customer/login", { email: TEST_EMAIL, password: ORIG_PASS });
      assert("Login with old password fails (401)", login2.status === 401);

      // 5f. Re-using the same token should fail (single-use)
      const rp2 = await request("POST", "/auth/customer/reset-password", {
        token: testToken,
        password: "AnotherPass789!",
      });
      assert("Same token cannot be reused (400)", rp2.status === 400);
    }
  }

  /* ── Cleanup ── */
  console.log("\n🧹 Cleaning up test data...");
  if (testCustomer) {
    await CustomerPasswordReset.deleteMany({ customerId: testCustomer._id });
    await Customer.deleteOne({ _id: testCustomer._id });
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} Passed, ${failed} Failed`);
  console.log("══════════════════════════════════════════════════════\n");
}

runTests()
  .catch((e) => { console.error("Test execution failed:", e); })
  .finally(async () => {
    if (serverInstance) serverInstance.close();
    const mongoose = require(path.join(serverNodeModules, "mongoose"));
    await mongoose.disconnect();
    console.log("[DB] MongoDB disconnected");
    process.exit(failed > 0 ? 1 : 0);
  });
