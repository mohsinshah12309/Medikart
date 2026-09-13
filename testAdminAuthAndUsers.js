/**
 * Test Admin Auth, Subadmin Password Assignment, and 6-Digit Forgot/Reset Password
 * Run from root: node testAdminAuthAndUsers.js
 */

const path = require("path");
const serverNodeModules = path.join(__dirname, "server", "node_modules");

require(path.join(serverNodeModules, "dotenv")).config({
  path: path.join(__dirname, "server", ".env"),
});

const { connectDB } = require("./server/src/config/db");
const app = require("./server/src/app");

const BASE = "http://localhost:5000/api/v1";
const SUPER_ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const SUPER_ADMIN_PASS = "medikart@03314170744Abdullah";

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

function assert(label, condition, extra) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${extra ? " — " + extra : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Admin User & Password Reset Flow Tests");
  console.log("══════════════════════════════════════════════════════\n");

  await connectDB();
  serverInstance = app.listen(5000);

  const AdminUser = require("./server/src/modules/admin-users/adminUser.model");
  const PasswordReset = require("./server/src/modules/admin-users/passwordReset.model");

  let superAdminToken = null;
  let subadminId = null;
  const SUBADMIN_EMAIL = `subadmin_test_${Date.now()}@medikart.pk`;
  const ASSIGNED_PASS = "AssignedPass123!";
  const NEW_RESET_PASS = "NewStaffPass456!";

  // 1. Super Admin Login
  console.log("📌 Step 1: Super Admin Login");
  {
    const r = await request("POST", "/auth/admin/login", {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASS,
    });
    superAdminToken = r.body?.data?.token;
    assert("Super Admin logged in successfully", r.status === 200 && Boolean(superAdminToken));
  }

  // 2. Create Subadmin with Assigned Password
  console.log("\n📌 Step 2: Create Subadmin with Assigned Password");
  {
    const r = await request(
      "POST",
      "/admin/users",
      {
        name: "Test Subadmin User",
        email: SUBADMIN_EMAIL,
        password: ASSIGNED_PASS,
        role: "admin",
        permissions: ["view_orders", "manage_orders"],
      },
      superAdminToken
    );
    subadminId = r.body?.data?._id;
    assert("Create Subadmin with assigned password returns 201/200", r.status === 201 || r.status === 200);
    assert("Subadmin ID returned", Boolean(subadminId));
  }

  // 3. Subadmin Login with Assigned Password
  console.log("\n📌 Step 3: Subadmin Login with Assigned Password");
  {
    const r = await request("POST", "/auth/admin/login", {
      email: SUBADMIN_EMAIL,
      password: ASSIGNED_PASS,
    });
    assert("Subadmin can log in directly with assigned password", r.status === 200 && Boolean(r.body?.data?.token));
  }

  // 4. Update Subadmin Access & Details
  console.log("\n📌 Step 4: Superadmin updates Subadmin Permissions");
  {
    const r = await request(
      "PUT",
      `/admin/users/${subadminId}`,
      {
        name: "Test Subadmin Updated",
        permissions: ["view_orders", "manage_orders", "view_products"],
      },
      superAdminToken
    );
    assert("Update subadmin permissions returns 200", r.status === 200);
    assert("Permissions updated in response", r.body?.data?.permissions?.includes("view_products"));
  }

  // 5. Subadmin Forgot Password (Generates 6-Digit Code)
  console.log("\n📌 Step 5: Subadmin Forgot Password");
  let verificationCode = null;
  {
    const r = await request("POST", "/auth/admin/forgot-password", {
      email: SUBADMIN_EMAIL,
    });
    assert("Forgot password returns 200 generic success", r.status === 200 && r.body?.status === "success");

    // Retrieve the active 6-digit code or record from DB to verify
    const record = await PasswordReset.findOne({ adminUserId: subadminId, used: false });
    assert("PasswordReset document created in DB", Boolean(record));

    // Get the verification code if test mode attached it, or test hashing
    if (r.body?._testCode) {
      verificationCode = r.body._testCode;
      console.log(`   Captured 6-digit verification code: ${verificationCode}`);
    } else {
      // In non-test mode, we can test by resetting with the hashed token or direct code injection
      const crypto = require("crypto");
      verificationCode = "654321";
      const hash = crypto.createHash("sha256").update(verificationCode).digest("hex");
      await PasswordReset.findByIdAndUpdate(record._id, { tokenHash: hash });
      console.log(`   Injected test verification code: ${verificationCode}`);
    }
  }

  // 6. Subadmin Reset Password with 6-Digit Code & New Password
  console.log("\n📌 Step 6: Subadmin Reset Password with Code");
  {
    const r = await request("POST", "/auth/admin/reset-password", {
      token: verificationCode,
      newPassword: NEW_RESET_PASS,
    });
    assert("Reset password with 6-digit code returns 200", r.status === 200 && r.body?.status === "success");
  }

  // 7. Subadmin Login with NEW Password succeeds
  console.log("\n📌 Step 7: Subadmin Login with New Password");
  {
    const r = await request("POST", "/auth/admin/login", {
      email: SUBADMIN_EMAIL,
      password: NEW_RESET_PASS,
    });
    assert("Login with new password succeeds", r.status === 200 && Boolean(r.body?.data?.token));
  }

  // 8. Subadmin Login with OLD Assigned Password fails (401)
  console.log("\n📌 Step 8: Login with Old Password fails");
  {
    const { resetRateLimiters } = require("./server/src/middleware/rateLimiter");
    resetRateLimiters();
    const r = await request("POST", "/auth/admin/login", {
      email: SUBADMIN_EMAIL,
      password: ASSIGNED_PASS,
    });
    console.log(`   Status: ${r.status}`, r.body);
    assert("Login with old password fails (401)", r.status === 401, `Got ${r.status}`);
  }

  // 9. Reusing same 6-digit code fails (400)
  console.log("\n📌 Step 9: Reusing used 6-digit code fails");
  {
    const { resetRateLimiters } = require("./server/src/middleware/rateLimiter");
    resetRateLimiters();
    const r = await request("POST", "/auth/admin/reset-password", {
      token: verificationCode,
      newPassword: "AnotherNewPass999!",
    });
    console.log(`   Status: ${r.status}`, r.body);
    assert("Reusing same code is rejected (400)", r.status === 400, `Got ${r.status}`);
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  if (subadminId) {
    await PasswordReset.deleteMany({ adminUserId: subadminId });
    await AdminUser.deleteOne({ _id: subadminId });
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} Passed, ${failed} Failed`);
  console.log("══════════════════════════════════════════════════════\n");
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
  })
  .finally(async () => {
    if (serverInstance) serverInstance.close();
    const mongoose = require(path.join(serverNodeModules, "mongoose"));
    await mongoose.disconnect();
    console.log("[DB] MongoDB disconnected");
    process.exit(failed > 0 ? 1 : 0);
  });
