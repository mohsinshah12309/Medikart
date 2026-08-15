/**
 * Phase 5 — Authentication Test Script
 *
 * Tests (exactly as specified in phases.md):
 *   1. Call any /admin/products route with no token → confirm 401
 *   2. Login with the seeded Super Admin's real credentials → confirm valid JWT;
 *      use that JWT on the same route → confirm 200
 *   3. Login with wrong password → confirm 401 with a generic message,
 *      not a stack trace or revealing error
 */

const BASE = "http://localhost:5000/api/v1";

// Credentials seeded above
const SUPER_ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const SUPER_ADMIN_PASSWORD = "medikart@03314170744Abdullah";
const WRONG_PASSWORD = "WrongPassword999!";

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
function expectFalsy(val, msg) {
  if (val) throw new Error(msg || `Expected falsy, got ${JSON.stringify(val)}`);
}

const headers = { "Content-Type": "application/json" };

async function get(path, token) {
  const h = { ...headers };
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers: h });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 5 — Authentication Tests");
  console.log("══════════════════════════════════════════════════════\n");

  let validToken = null;

  // ── TEST 1: No token → 401 ─────────────────────────────────────────────────
  console.log("🔒  Test 1: Protected route with NO token");
  await assert("GET /admin/products (no token) → 401 Unauthorized", async () => {
    const { status, body } = await get("/admin/products");
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 401, `Expected 401 Unauthorized, got ${status}`);
    // Must NOT expose stack trace or internal error details
    expectFalsy(
      typeof body === "string" && body.includes("at "),
      "Response must not contain a stack trace"
    );
  });

  // ── TEST 2a: Login with real credentials → valid JWT ──────────────────────
  console.log("\n🔑  Test 2a: Login with correct Super Admin credentials");
  await assert("POST /auth/admin/login (correct creds) → 200 + JWT", async () => {
    const { status, body } = await post("/auth/admin/login", {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
    });
    console.log(`       Response: ${status} — ${JSON.stringify({
      status: body.status,
      token: body.data?.token ? body.data.token.slice(0, 40) + "...[truncated]" : undefined,
      expiresIn: body.data?.expiresIn,
      admin: body.data?.admin,
    })}`);
    expect(status, 200, `Expected 200, got ${status} — ${JSON.stringify(body)}`);
    expectTruthy(body.data?.token, "Response must include a JWT token");
    expectTruthy(body.data?.expiresIn, "Response must include expiresIn");
    expectTruthy(body.data?.admin?.role === "super_admin", "Role must be super_admin");
    // Token must have 3 parts (header.payload.signature)
    const parts = body.data.token.split(".");
    expect(parts.length, 3, "JWT must have exactly 3 parts separated by dots");
    validToken = body.data.token;
  });

  // ── TEST 2b: Use the JWT on the protected route → 200 ────────────────────
  console.log("\n🔓  Test 2b: Use valid JWT on protected route");
  await assert("GET /admin/products (with valid JWT) → 200 OK", async () => {
    if (!validToken) throw new Error("Skipped — no token from login step");
    const { status, body } = await get("/admin/products", validToken);
    console.log(`       Response: ${status} — ${JSON.stringify({ status: body.status, results: body.results })}`);
    expect(status, 200, `Expected 200 with valid JWT, got ${status} — ${JSON.stringify(body)}`);
  });

  // ── TEST 3: Wrong password → generic 401, no leak ─────────────────────────
  console.log("\n🚫  Test 3: Login with wrong password → generic 401");
  await assert("POST /auth/admin/login (wrong password) → 401 generic error", async () => {
    const { status, body } = await post("/auth/admin/login", {
      email: SUPER_ADMIN_EMAIL,
      password: WRONG_PASSWORD,
    });
    console.log(`       Response: ${status} — ${JSON.stringify(body)}`);
    expect(status, 401, `Expected 401, got ${status}`);
    // Must NOT reveal "wrong password" vs "email not found"
    expectFalsy(
      body.message?.toLowerCase().includes("password"),
      `Response must not mention "password" — got: ${body.message}`
    );
    expectFalsy(
      body.message?.toLowerCase().includes("not found"),
      `Response must not say "not found" — got: ${body.message}`
    );
    expectFalsy(
      body.message?.toLowerCase().includes("email"),
      `Response must not mention "email" — got: ${body.message}`
    );
    // Must NOT be a stack trace
    expectFalsy(
      typeof body === "string" && body.includes("at "),
      "Response must not contain a stack trace"
    );
    expectTruthy(body.message, "Response must include a generic error message");
  });

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
