/**
 * Phase 10 — Image Upload & Processing Pipeline Integration Tests
 * Run from: D:/Projects/Medikart/server
 *   node testPhase10.js
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const BASE = "http://localhost:5000/api/v1";

const ADMIN_EMAIL = "alishahmohsin938@gmail.com";
const ADMIN_PASSWORD = "medikart@03314170744Abdullah";

// Test image files from D:/Projects/testing
const TEST_IMAGE_1 = "D:/Projects/testing/Acefer (50Mg5Ml) 120Ml Syrup.png"; // 1.17 MB
const TEST_IMAGE_2 = "D:/Projects/testing/Acefyl (258MgMl) 125Ml Syrup.png";  // 1.16 MB
const TEST_IMAGE_3 = "D:/Projects/testing/Acenac (1.5% WW) 20G Gel.png";       // 1.06 MB

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

const authHeader = () => ({ Authorization: `Bearer ${token}` });

async function postJson(pathUrl, body) {
  const res = await fetch(`${BASE}${pathUrl}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function getJson(pathUrl) {
  const res = await fetch(`${BASE}${pathUrl}`, { headers: authHeader() });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function patchJson(pathUrl, body = {}) {
  const res = await fetch(`${BASE}${pathUrl}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

/** Upload multipart files using FormData */
async function uploadFiles(pathUrl, filePaths) {
  const formData = new FormData();
  for (const fp of filePaths) {
    const buffer = fs.readFileSync(fp.path || fp);
    const filename = fp.name || path.basename(fp.path || fp);
    const mime = fp.mime || "image/png";
    const blob = new Blob([buffer], { type: mime });
    formData.append("images", blob, filename);
  }

  const res = await fetch(`${BASE}${pathUrl}`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });

  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 10 — Image Upload & Processing Pipeline Tests");
  console.log("══════════════════════════════════════════════════════\n");

  const loginRes = await postJson("/auth/admin/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    console.error("  ❌ Could not log in — aborting tests");
    process.exit(1);
  }
  token = loginRes.body.data.token;
  console.log("  🔑 Logged in as Super Admin\n");

  let prodId = null;
  let emptyProdId = null;

  // Setup: Create test product in DB
  await assert("Create test products for image pipeline tests", async () => {
    const res1 = await postJson("/admin/products", {
      name: "Image Pipeline Test Product",
      price: 500,
      sku: "IMG-PIPE-TEST-001",
    });
    expect(res1.status, 201, "Product 1 creation failed");
    prodId = res1.body._id;

    const res2 = await postJson("/admin/products", {
      name: "Empty Image Product",
      price: 250,
      sku: "IMG-PIPE-TEST-EMPTY",
    });
    expect(res2.status, 201, "Product 2 creation failed");
    emptyProdId = res2.body._id;
  });

  // ── TEST 1: Upload a large PNG/JPEG → compressed WebP under ~150KB ──────
  console.log("\n🖼️   Test 1: Upload large PNG (1.17MB) → verify stored WebP file & size");
  let firstImageId = null;
  await assert("Upload 1.17MB PNG image → 201 + WebP compressed < 150KB", async () => {
    const res = await uploadFiles(`/admin/products/${prodId}/images`, [TEST_IMAGE_1]);
    expect(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    expectTruthy(res.body.data?.images?.length === 1, "Expected 1 image in product images");

    const img = res.body.data.images[0];
    firstImageId = img._id;
    expect(img.isPrimary, true, "First uploaded image should automatically be primary cover");
    expectTruthy(img.path.endsWith(".webp"), `Path must end with .webp, got ${img.path}`);

    // Check physical file size on disk
    const diskPath = path.join(__dirname, img.path);
    expectTruthy(fs.existsSync(diskPath), `Stored file must exist on disk at ${diskPath}`);
    const sizeKB = (fs.statSync(diskPath).size / 1024).toFixed(2);
    console.log(`       Original input size : 1.17 MB (1,170,634 bytes)`);
    console.log(`       Processed WebP path : ${img.path}`);
    console.log(`       Stored WebP size   : ${sizeKB} KB (Target: < 150KB)`);
    expectTruthy(parseFloat(sizeKB) < 150, `Stored WebP size (${sizeKB}KB) must be under 150KB`);
  });

  // ── TEST 2: Multi-image upload & set primary cover ─────────────────────────
  console.log("\n📸  Test 2: Upload 2nd & 3rd images → set 2nd image as primary cover");
  let secondImageId = null;
  await assert("Upload 2nd & 3rd images → all 3 listed, set 2nd as primary", async () => {
    const resUpload = await uploadFiles(`/admin/products/${prodId}/images`, [TEST_IMAGE_2, TEST_IMAGE_3]);
    expect(resUpload.status, 201, `Upload failed: ${JSON.stringify(resUpload.body)}`);
    expect(resUpload.body.data.images.length, 3, "Product must have 3 images total");

    secondImageId = resUpload.body.data.images[1]._id;

    // Set 2nd image as primary
    const resPrimary = await patchJson(`/admin/products/${prodId}/images/${secondImageId}/primary`);
    expect(resPrimary.status, 200, `Set primary failed: ${JSON.stringify(resPrimary.body)}`);

    // Verify GET /admin/products/:id returns coverImage pointing to 2nd image
    const resGet = await getJson(`/admin/products/${prodId}`);
    expect(resGet.status, 200);
    const coverPath = resGet.body.data.product.coverImage;
    const secondImgPath = resUpload.body.data.images[1].path;
    console.log(`       Cover Image Path    : ${coverPath}`);
    expect(coverPath, secondImgPath, "coverImage must match 2nd image path");
  });

  // ── TEST 3: Request product with no uploaded image → placeholder returned ──
  console.log("\n🖼️   Test 3: Request product with no images → confirm placeholder returned");
  await assert("GET /admin/products/:emptyId → returns placeholder webp path", async () => {
    const res = await getJson(`/admin/products/${emptyProdId}`);
    expect(res.status, 200);
    const prod = res.body.data.product;
    console.log(`       No-image product cover: ${prod.coverImage}`);
    expect(prod.coverImage, "/uploads/placeholder.webp");
    expect(prod.images[0].path, "/uploads/placeholder.webp");
  });

  // ── TEST 4: Attempt upload of disguised file (renamed .exe/.txt as .jpg) ──
  console.log("\n🛡️   Test 4: Disguised non-image file (.exe content renamed .jpg) → 400 Bad Request");
  await assert("Upload fake disguised image file → rejected by magic-bytes content check", async () => {
    const fakeFilePath = path.join(__dirname, "fake_malicious.jpg");
    fs.writeFileSync(fakeFilePath, "MZ9000... fake executable binary content disguised with .jpg extension");

    try {
      const res = await uploadFiles(`/admin/products/${prodId}/images`, [{ path: fakeFilePath, name: "fake_malicious.jpg", mime: "image/jpeg" }]);
      console.log(`       Response: ${res.status} — ${JSON.stringify(res.body)}`);
      expect(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
      expectTruthy(
        res.body.message?.toLowerCase().includes("corrupted") || res.body.message?.toLowerCase().includes("invalid"),
        `Error message must indicate invalid content, got: ${res.body.message}`
      );
    } finally {
      if (fs.existsSync(fakeFilePath)) fs.unlinkSync(fakeFilePath);
    }
  });

  // ── TEST 5: Attempt upload of corrupted / truncated image → graceful 400 ──
  console.log("\n💥  Test 5: Corrupted / truncated image file → graceful 400, no server crash");
  await assert("Upload truncated image file → rejected gracefully with 400", async () => {
    const corruptPath = path.join(__dirname, "corrupted.jpg");
    fs.writeFileSync(corruptPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])); // incomplete JPEG header bytes

    try {
      const res = await uploadFiles(`/admin/products/${prodId}/images`, [{ path: corruptPath, name: "corrupted.jpg", mime: "image/jpeg" }]);
      console.log(`       Response: ${res.status} — ${JSON.stringify(res.body)}`);
      expect(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
      expectTruthy(
        res.body.message?.toLowerCase().includes("corrupted") || res.body.message?.toLowerCase().includes("invalid"),
        `Error message must indicate corrupted file, got: ${res.body.message}`
      );
    } finally {
      if (fs.existsSync(corruptPath)) fs.unlinkSync(corruptPath);
    }
  });

  // Cleanup test products in DB
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require("./src/modules/products/product.model");
  await Product.findByIdAndDelete(prodId);
  await Product.findByIdAndDelete(emptyProdId);
  await mongoose.disconnect();

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`   Results: ${passed} passed  |  ${failed} failed`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal error during tests:", err.message);
  process.exit(1);
});
