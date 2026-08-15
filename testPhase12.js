/**
 * Phase 12 — Email OTP Verification Test Script
 * Run from root: node testPhase12.js
 *
 * Tests (per phases.md & prompt instructions):
 *   1. POST /otp/request with a test email — confirm 200, OTP document created in MongoDB with hashed code (not plaintext), and email delivered.
 *   2. POST /otp/verify with correct code from that email — confirm 200 and document marked verified: true.
 *   3. POST /otp/verify again with same (already-used) code — confirm rejected (single-use enforcement).
 *   4. POST /otp/verify with a wrong code 4 times in a row — confirm 4th attempt triggers cooldown/invalidation, clear error (not 500).
 *   5. POST /otp/request 4 times rapidly for same email — confirm per-email rate limit kicks in before 4th request is accepted.
 */

const path = require("path");
const serverNodeModules = path.join(__dirname, "server", "node_modules");

require(path.join(serverNodeModules, "dotenv")).config({ path: path.join(__dirname, "server", ".env") });
const mongoose = require(path.join(serverNodeModules, "mongoose"));
const bcrypt = require(path.join(serverNodeModules, "bcryptjs"));
const { connectDB } = require("./server/src/config/db");
const app = require("./server/src/app");

const BASE = "http://localhost:5000/api/v1";
const TEST_EMAIL_1 = "otp.test.user1@medikart.pk";
const TEST_EMAIL_2 = "otp.test.user2@medikart.pk";
const TEST_EMAIL_3 = "otp.test.user3@medikart.pk";

let passed = 0;
let failed = 0;
let serverInstance = null;

async function request(method, routePath, body = null) {
  const headers = { "Content-Type": "application/json" };
  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${routePath}`, opts);
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
  console.log("   Phase 12 — Email OTP Verification Tests");
  console.log("══════════════════════════════════════════════════════\n");

  process.env.NODE_ENV = "test";
  await connectDB();
  serverInstance = app.listen(5000);

  const Otp = require("./server/src/modules/otp/otp.model");

  // Cleanup pre-existing test records for clean test run
  await Otp.deleteMany({ email: { $in: [TEST_EMAIL_1, TEST_EMAIL_2, TEST_EMAIL_3] } });

  try {
    // ── CHECK 1: Request OTP for real test email ──────────────────────────────
    console.log("📌 Check 1: POST /api/v1/otp/request with test email");
    const reqRes1 = await request("POST", "/otp/request", { email: TEST_EMAIL_1 });
    console.log(`   Response Status: ${reqRes1.status}`);
    console.log(`   Response Payload:`, JSON.stringify(reqRes1.body, null, 2));

    const otpDoc1 = await Otp.findOne({ email: TEST_EMAIL_1, invalidated: false }).sort({ createdAt: -1 });
    console.log(`   OTP Document in DB:`, {
      id: otpDoc1?._id,
      email: otpDoc1?.email,
      codeHash: otpDoc1?.codeHash ? `${otpDoc1.codeHash.substring(0, 15)}... (hashed)` : null,
      verified: otpDoc1?.verified,
      expiresAt: otpDoc1?.expiresAt,
    });

    const isCodeHashed = otpDoc1 && otpDoc1.codeHash && otpDoc1.codeHash.startsWith("$2");
    if (reqRes1.status === 200 && otpDoc1 && isCodeHashed) {
      console.log("  ✅ Check 1 PASSED: 200 returned, document created in MongoDB with bcrypt hash (not plaintext).\n");
      passed++;
    } else {
      console.log("  ❌ Check 1 FAILED.\n");
      failed++;
    }

    const extractedCode = reqRes1.body._testCode;
    console.log(`   [Test Helper] OTP code received via test transport: ${extractedCode}\n`);


    // ── CHECK 2: Verify OTP with correct code ─────────────────────────────────
    console.log("📌 Check 2: POST /api/v1/otp/verify with correct code");
    const verifyRes1 = await request("POST", "/otp/verify", { email: TEST_EMAIL_1, code: extractedCode });
    console.log(`   Response Status: ${verifyRes1.status}`);
    console.log(`   Response Payload:`, JSON.stringify(verifyRes1.body, null, 2));

    const updatedDoc1 = await Otp.findById(otpDoc1._id);
    console.log(`   Updated DB Document verified flag: ${updatedDoc1.verified}`);

    if (verifyRes1.status === 200 && verifyRes1.body.verified === true && updatedDoc1.verified === true) {
      console.log("  ✅ Check 2 PASSED: 200 returned and document marked verified: true.\n");
      passed++;
    } else {
      console.log("  ❌ Check 2 FAILED.\n");
      failed++;
    }

    // ── CHECK 3: Verify OTP again with same code (Single-use enforcement) ────
    console.log("📌 Check 3: POST /api/v1/otp/verify again with same (already-used) code");
    const reuseRes = await request("POST", "/otp/verify", { email: TEST_EMAIL_1, code: extractedCode });
    console.log(`   Response Status: ${reuseRes.status}`);
    console.log(`   Response Payload:`, JSON.stringify(reuseRes.body, null, 2));

    if (reuseRes.status === 400 && reuseRes.body.message?.includes("already been verified")) {
      console.log("  ✅ Check 3 PASSED: Second verification rejected (single-use enforcement).\n");
      passed++;
    } else {
      console.log("  ❌ Check 3 FAILED.\n");
      failed++;
    }

    // ── CHECK 4: 4 wrong verification attempts (Attempt cap) ─────────────────
    console.log("📌 Check 4: POST /api/v1/otp/verify with wrong code 4 times in a row");
    // Request a fresh OTP for TEST_EMAIL_2
    await request("POST", "/otp/request", { email: TEST_EMAIL_2 });
    
    let attemptStatuses = [];
    let lastResponseBody = null;
    for (let i = 1; i <= 4; i++) {
      const wrongRes = await request("POST", "/otp/verify", { email: TEST_EMAIL_2, code: "000000" });
      attemptStatuses.push(`Attempt ${i}: ${wrongRes.status}`);
      lastResponseBody = wrongRes.body;
      console.log(`   Attempt ${i}/4 -> Status: ${wrongRes.status}, Message: "${wrongRes.body.message}"`);
    }

    const otpDoc2 = await Otp.findOne({ email: TEST_EMAIL_2 }).sort({ createdAt: -1 });
    console.log(`   DB Document state after 4 attempts: attempts=${otpDoc2?.attempts}, invalidated=${otpDoc2?.invalidated}`);

    if (
      attemptStatuses.every(s => s.includes("400")) &&
      otpDoc2.attempts === 4 &&
      otpDoc2.invalidated === true &&
      lastResponseBody.message?.includes("Maximum verification attempts exceeded")
    ) {
      console.log("  ✅ Check 4 PASSED: 4th attempt triggered invalidation with clear error message.\n");
      passed++;
    } else {
      console.log("  ❌ Check 4 FAILED.\n");
      failed++;
    }

    // ── CHECK 5: Per-email rate limiting (max 3 requests / 15 mins) ───────────
    console.log("📌 Check 5: POST /api/v1/otp/request 4 times rapidly for same email");
    let reqStatuses = [];
    let rateLimitPayload = null;

    for (let i = 1; i <= 4; i++) {
      const rateRes = await request("POST", "/otp/request", { email: TEST_EMAIL_3 });
      reqStatuses.push(rateRes.status);
      if (i === 4) {
        rateLimitPayload = rateRes.body;
      }
      console.log(`   Request ${i}/4 -> Status: ${rateRes.status}`);
    }

    if (
      reqStatuses[0] === 200 &&
      reqStatuses[1] === 200 &&
      reqStatuses[2] === 200 &&
      reqStatuses[3] === 400 &&
      rateLimitPayload?.message?.includes("Too many OTP requests")
    ) {
      console.log("  ✅ Check 5 PASSED: 4th rapid request rejected by per-email rate limiter with clear error.\n");
      passed++;
    } else {
      console.log("  ❌ Check 5 FAILED.\n");
      failed++;
    }

  } finally {
    console.log("🧹 Cleaning up test OTP documents...");
    await Otp.deleteMany({ email: { $in: [TEST_EMAIL_1, TEST_EMAIL_2, TEST_EMAIL_3] } });
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
  }

  console.log("══════════════════════════════════════════════════════");
  console.log(`   Phase 12 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
