/**
 * orderExportExcel.test.js
 *
 * Tests for GET /api/v1/admin/orders/export/excel:
 *   1. Super Admin can export Excel for a date range.
 *   2. Sub-Admin with 'view_orders' can export Excel.
 *   3. Sub-Admin without permissions is rejected (403 Forbidden).
 *   4. Date filtering accurately limits exported rows to the requested range.
 *   5. Pharmacy-scoped admin only exports orders assigned to their branch.
 *   6. Returned binary is valid XLSX workbook with correct columns and headers.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const app = require("../../src/app");
const Order = require("../../src/modules/orders/order.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const Pharmacy = require("../../src/modules/pharmacies/pharmacy.model");

const JWT_SECRET = process.env.JWT_SECRET || "medikart-secret-key-for-test-environments";

const createToken = (adminDoc) => {
  return jwt.sign(
    {
      sub: adminDoc._id.toString(),
      role: adminDoc.role,
      email: adminDoc.email,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

let superAdminToken;
let subAdminWithPermToken;
let subAdminNoPermToken;
let scopedAdminToken;
let testPharmacyId;
let otherPharmacyId;
let testProductId;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);

  testPharmacyId = new mongoose.Types.ObjectId();
  otherPharmacyId = new mongoose.Types.ObjectId();
  testProductId = new mongoose.Types.ObjectId();

  // Create real AdminUser documents in DB so auth.js passes
  const superAdmin = await AdminUser.create({
    email: `superadmin_${Date.now()}@medikart.pk`,
    passwordHash: "$2a$12$dummyhashedpasswordfordevtestonly1234567890",
    name: "Super Admin",
    role: "super_admin",
    active: true,
  });
  superAdminToken = createToken(superAdmin);

  const subAdminWithPerm = await AdminUser.create({
    email: `subadmin_perm_${Date.now()}@medikart.pk`,
    passwordHash: "$2a$12$dummyhashedpasswordfordevtestonly1234567890",
    name: "Staff Admin Perm",
    role: "admin",
    permissions: ["view_orders", "manage_orders"],
    active: true,
  });
  subAdminWithPermToken = createToken(subAdminWithPerm);

  const subAdminNoPerm = await AdminUser.create({
    email: `subadmin_noperm_${Date.now()}@medikart.pk`,
    passwordHash: "$2a$12$dummyhashedpasswordfordevtestonly1234567890",
    name: "Staff Admin No Perm",
    role: "admin",
    permissions: ["view_products"],
    active: true,
  });
  subAdminNoPermToken = createToken(subAdminNoPerm);

  const scopedAdmin = await AdminUser.create({
    email: `scoped_admin_${Date.now()}@medikart.pk`,
    passwordHash: "$2a$12$dummyhashedpasswordfordevtestonly1234567890",
    name: "Scoped Admin",
    role: "admin",
    permissions: ["view_orders"],
    assignedPharmacyId: testPharmacyId,
    active: true,
  });
  scopedAdminToken = createToken(scopedAdmin);

  // Create sample orders across dates and pharmacies
  const baseOrder = {
    type: "standard",
    customer: {
      name: "Excel Test Customer",
      email: "exceltest@medikart.pk",
      phone: "03001234567",
      address: "123 Main Blvd",
      city: "Lahore",
    },
    items: [
      {
        productId: testProductId,
        name: "Test Panadol 500mg",
        price: 250,
        quantity: 2,
      },
    ],
    totals: {
      subtotal: 500,
      deliveryCharge: 150,
      platformFee: 10,
      total: 660,
    },
    paymentMethod: "cod",
    paymentState: "pending",
    status: "pending",
  };

  // Order 1: Created on 2026-09-01 (test pharmacy)
  await Order.create({
    ...baseOrder,
    orderCode: "MK-EXP-001",
    assignedPharmacyId: testPharmacyId,
    createdAt: new Date("2026-09-01T10:00:00Z"),
  });

  // Order 2: Created on 2026-09-10 (other pharmacy)
  await Order.create({
    ...baseOrder,
    orderCode: "MK-EXP-002",
    assignedPharmacyId: otherPharmacyId,
    createdAt: new Date("2026-09-10T12:00:00Z"),
  });

  // Order 3: Created on 2026-09-13 (test pharmacy)
  await Order.create({
    ...baseOrder,
    orderCode: "MK-EXP-003",
    assignedPharmacyId: testPharmacyId,
    createdAt: new Date("2026-09-13T08:00:00Z"),
  });
}, 90000);

afterAll(async () => {
  await Order.deleteMany({ orderCode: { $in: ["MK-EXP-001", "MK-EXP-002", "MK-EXP-003"] } });
  await AdminUser.deleteMany({
    email: {
      $in: [
        /superadmin_/,
        /subadmin_perm_/,
        /subadmin_noperm_/,
        /scoped_admin_/,
      ],
    },
  });
  await mongoose.connection.close();
}, 90000);

describe("Admin Order Excel Export (GET /api/v1/admin/orders/export/excel)", () => {
  test("Super Admin can download Excel workbook", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders/export/excel")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .responseType("blob");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml.sheet");
    expect(res.headers["content-disposition"]).toMatch(/attachment; filename="Medikart_Orders_.*\.xlsx"/);

    // Parse Excel workbook from response binary buffer
    const workbook = XLSX.read(res.body, { type: "buffer" });
    expect(workbook.SheetNames).toContain("Medikart Orders");
    const sheet = workbook.Sheets["Medikart Orders"];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows.length).toBeGreaterThanOrEqual(3);

    // Verify key columns exist
    const firstRow = rows[0];
    expect(firstRow).toHaveProperty("Order Code");
    expect(firstRow).toHaveProperty("Total Amount (PKR)");
    expect(firstRow).toHaveProperty("Platform Fee (PKR)");
  });

  test("Sub-Admin with 'view_orders' permission can download Excel workbook", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders/export/excel")
      .set("Authorization", `Bearer ${subAdminWithPermToken}`)
      .responseType("blob");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml.sheet");
  });

  test("Sub-Admin without 'view_orders' / 'manage_orders' is rejected with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders/export/excel")
      .set("Authorization", `Bearer ${subAdminNoPermToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
  });

  test("Date filtering (startDate and endDate) only returns orders in that date range", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders/export/excel?startDate=2026-09-01&endDate=2026-09-05")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .responseType("blob");

    expect(res.status).toBe(200);
    const workbook = XLSX.read(res.body, { type: "buffer" });
    const sheet = workbook.Sheets["Medikart Orders"];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Only MK-EXP-001 is between 2026-09-01 and 2026-09-05
    const orderCodes = rows.map((r) => r["Order Code"]);
    expect(orderCodes).toContain("MK-EXP-001");
    expect(orderCodes).not.toContain("MK-EXP-002");
    expect(orderCodes).not.toContain("MK-EXP-003");
  });

  test("Pharmacy-scoped admin only exports orders from their assigned pharmacy", async () => {
    const res = await request(app)
      .get("/api/v1/admin/orders/export/excel")
      .set("Authorization", `Bearer ${scopedAdminToken}`)
      .responseType("blob");

    expect(res.status).toBe(200);
    const workbook = XLSX.read(res.body, { type: "buffer" });
    const sheet = workbook.Sheets["Medikart Orders"];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const orderCodes = rows.map((r) => r["Order Code"]);
    expect(orderCodes).toContain("MK-EXP-001");
    expect(orderCodes).toContain("MK-EXP-003");
    // MK-EXP-002 was assigned to otherPharmacyId, so it should not appear
    expect(orderCodes).not.toContain("MK-EXP-002");
  });
});
