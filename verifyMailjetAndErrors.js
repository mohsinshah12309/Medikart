/**
 * Verify Mailjet + errorHandler changes.
 * Run from root: node verifyMailjetAndErrors.js
 */

const path = require("path");
const serverNodeModules = path.join(__dirname, "server", "node_modules");

require(path.join(serverNodeModules, "dotenv")).config({
  path: path.join(__dirname, "server", ".env"),
});

const { connectDB } = require("./server/src/config/db");
const app = require("./server/src/app");

const BASE = "http://localhost:5000/api/v1";

let passed = 0;
let failed = 0;
let serverInstance = null;

async function request(method, urlPath, body = null) {
  const headers = { "Content-Type": "application/json" };
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
  console.log("   Mailjet + Specific Validation Error Messages");
  console.log("══════════════════════════════════════════════════════\n");

  await connectDB();
  serverInstance = app.listen(5000);

  // 1. smtp.js loads and exports sendEmail
  const smtp = require("./server/src/integrations/smtp");
  assert("smtp.js exports sendEmail function", typeof smtp.sendEmail === "function");

  // 2. Mailjet client can be constructed (credentials are set)
  const Mailjet = require(path.join(serverNodeModules, "node-mailjet"));
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  assert("MAILJET_API_KEY is set in .env", Boolean(apiKey), apiKey ? "" : "key missing");
  assert("MAILJET_API_SECRET is set in .env", Boolean(apiSecret));
  assert("MAILJET_SENDER_EMAIL is set in .env", Boolean(process.env.MAILJET_SENDER_EMAIL));

  if (apiKey && apiSecret) {
    const client = Mailjet.apiConnect(apiKey, apiSecret);
    assert("Mailjet.apiConnect() returns client with .post method", typeof client.post === "function");
  }

  // 3. Signup with no uppercase → specific message, not "Validation failed"
  console.log("\n📌 Password validation error messages:");
  {
    const r = await request("POST", "/auth/customer/signup", {
      name: "Test User",
      email: "test@example.com",
      password: "alllowercase1", // no uppercase
    });
    console.log(`   no-uppercase response: ${r.status} | message: "${r.body?.message}"`);
    assert(
      'No-uppercase password → message contains "uppercase"',
      r.status === 400 && r.body?.message?.toLowerCase().includes("uppercase"),
      r.body?.message
    );
    assert(
      "No-uppercase password → message is NOT the generic 'Validation failed'",
      r.body?.message !== "Validation failed",
      r.body?.message
    );
  }

  // 4. Signup with no number → specific message
  {
    const r = await request("POST", "/auth/customer/signup", {
      name: "Test User",
      email: "test@example.com",
      password: "NoNumberHere", // no digit
    });
    console.log(`   no-number response: ${r.status} | message: "${r.body?.message}"`);
    assert(
      'No-number password → message contains "number"',
      r.status === 400 && r.body?.message?.toLowerCase().includes("number"),
      r.body?.message
    );
  }

  // 5. Signup with too-short password → specific message
  {
    const r = await request("POST", "/auth/customer/signup", {
      name: "Test User",
      email: "test@example.com",
      password: "Ab1", // too short
    });
    console.log(`   too-short response: ${r.status} | message: "${r.body?.message}"`);
    assert(
      "Too-short password → message mentions 8 characters",
      r.status === 400 && r.body?.message?.includes("8"),
      r.body?.message
    );
  }

  // 6. Reset-password with no lowercase → specific message
  {
    const r = await request("POST", "/auth/customer/reset-password", {
      token: "a".repeat(64),
      password: "NOLOWERCASE1", // no lowercase
    });
    console.log(`   no-lowercase reset response: ${r.status} | message: "${r.body?.message}"`);
    assert(
      'No-lowercase password → message contains "lowercase"',
      r.status === 400 && r.body?.message?.toLowerCase().includes("lowercase"),
      r.body?.message
    );
  }

  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   Results: ${passed} Passed, ${failed} Failed`);
  console.log(`══════════════════════════════════════════════════════\n`);
}

runTests()
  .catch((e) => { console.error("Test failed:", e); })
  .finally(async () => {
    if (serverInstance) serverInstance.close();
    const mongoose = require(path.join(serverNodeModules, "mongoose"));
    await mongoose.disconnect();
    console.log("[DB] MongoDB disconnected");
    process.exit(failed > 0 ? 1 : 0);
  });
