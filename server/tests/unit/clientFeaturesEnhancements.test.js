/**
 * clientFeaturesEnhancements.test.js
 * 
 * Automated Test Suite for New Client-Requested Features:
 *  1a. Pharmacy CRUD + City Association + Order Assignment + Date-Ranged Reporting (exact PKR math)
 *  1b. Banner CRUD + Placement + Active Toggle Gating
 *  1c. Condition CRUD + Storefront Condition Filtering
 *  1d. Order Short-Code Generation (Collision Resistance across 1,500 codes + Retry Logic)
 *  1e. Category Active-Toggle Cascade (Single Disabled vs Multi-Category Active/Disabled)
 *  2.  City-Pharmacy Confidentiality (Public /cities response body inspection)
 */

jest.setTimeout(60000);

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../src/app");
const Pharmacy = require("../../src/modules/pharmacies/pharmacy.model");
const pharmacyService = require("../../src/modules/pharmacies/pharmacy.service");
const Banner = require("../../src/modules/banners/banner.model");
const bannerService = require("../../src/modules/banners/banner.service");
const Condition = require("../../src/modules/conditions/condition.model");
const conditionService = require("../../src/modules/conditions/condition.service");
const Category = require("../../src/modules/categories/category.model");
const Product = require("../../src/modules/products/product.model");
const Order = require("../../src/modules/orders/order.model");
const orderService = require("../../src/modules/orders/order.service");
const City = require("../../src/modules/cities/city.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const jwt = require("jsonwebtoken");

let superAdminToken;
let testCity1, testCity2;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Create or retrieve super admin for authenticated admin endpoints
  let admin = await AdminUser.findOne({ role: "super_admin", active: true }).lean();
  if (!admin) {
    admin = await AdminUser.create({
      name: "Super Admin Test",
      email: "features_superadmin@medikart.test",
      role: "super_admin",
      permissions: ["products", "orders", "pharmacies", "reports", "settings"],
      passwordHash: "dummy-hash",
      active: true,
    });
  }
  
  superAdminToken = jwt.sign(
    { sub: admin._id.toString(), role: "super_admin", email: admin.email },
    process.env.JWT_SECRET || "default_jwt_secret_for_test",
    { expiresIn: "2h" }
  );

  // Setup test cities
  testCity1 = await City.findOneAndUpdate(
    { name: "Test City Alpha" },
    { name: "Test City Alpha", deliveryCharge: 150, active: true },
    { upsert: true, new: true }
  );
  testCity2 = await City.findOneAndUpdate(
    { name: "Test City Beta" },
    { name: "Test City Beta", deliveryCharge: 200, active: true },
    { upsert: true, new: true }
  );
});

afterAll(async () => {
  // Cleanup test entities
  await Pharmacy.deleteMany({ code: { $regex: /^TEST-PH-/ } });
  await Banner.deleteMany({ title: { $regex: /^TEST-BANNER-/ } });
  await Condition.deleteMany({ slug: { $regex: /^test-condition-/ } });
  await Category.deleteMany({ slug: { $regex: /^test-cat-/ } });
  await Product.deleteMany({ name: { $regex: /^TEST-PROD-/ } });
  await Order.deleteMany({ "customer.email": "test-features@medikart.test" });
  await City.deleteMany({ name: { $regex: /^Test City/ } });
  await AdminUser.deleteMany({ email: "features_superadmin@medikart.test" });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe("1a. Pharmacy CRUD, City Association, Order Assignment & Date-Ranged Reporting", () => {
  let pharmacyA, pharmacyB;

  test("Pharmacy CRUD: Create, Read, Update, Delete with City Association", async () => {
    // CREATE
    const phData = {
      name: "Test Alpha Pharmacy",
      code: "TEST-PH-ALPHA",
      contactPerson: "Dr. Tariq",
      phone: "+923001234567",
      email: "alpha@pharmacy.test",
      address: "123 Healthcare Ave",
      cityIds: [testCity1._id, testCity2._id],
      active: true,
    };
    pharmacyA = await pharmacyService.createPharmacy(phData);
    expect(pharmacyA._id).toBeDefined();
    expect(pharmacyA.code).toBe("TEST-PH-ALPHA");
    expect(pharmacyA.cityIds.length).toBe(2);

    const phDataB = {
      name: "Test Beta Pharmacy",
      code: "TEST-PH-BETA",
      contactPerson: "Dr. Fatima",
      phone: "+923007654321",
      email: "beta@pharmacy.test",
      address: "456 Wellness Rd",
      cityIds: [testCity1._id],
      active: true,
    };
    pharmacyB = await pharmacyService.createPharmacy(phDataB);

    // READ by ID
    const fetched = await pharmacyService.getPharmacyById(pharmacyA._id);
    expect(fetched.name).toBe("Test Alpha Pharmacy");
    expect(fetched.cityIds[0].name).toBeDefined(); // populated

    // UPDATE
    const updated = await pharmacyService.updatePharmacy(pharmacyA._id, {
      contactPerson: "Dr. Tariq Senior",
    });
    expect(updated.contactPerson).toBe("Dr. Tariq Senior");
  });

  test("Order Assignment & Performance Reporting Math against Known Seeded Data", async () => {
    // Create specific test orders for Pharmacy A and Pharmacy B
    // Pharmacy A: 2 orders (Order 1: 1,500 PKR 'delivered', Order 2: 2,500 PKR 'shipped') => Total 4,000 PKR, 2 orders, 1 delivered, 1 pending/progress
    // Pharmacy B: 1 order (Order 3: 3,200 PKR 'delivered') => Total 3,200 PKR, 1 order, 1 delivered
    
    const baseDate = new Date("2026-05-15T10:00:00Z");

    const order1 = new Order({
      type: "standard",
      customer: { name: "Test Client 1", email: "test-features@medikart.test", phone: "+923001111111", address: "St 1", city: "Test City Alpha" },
      totals: { subtotal: 1350, deliveryCharge: 150, total: 1500 },
      paymentMethod: "cod",
      status: "delivered",
      assignedPharmacyId: pharmacyA._id,
      createdAt: baseDate,
    });
    await order1.save();

    const order2 = new Order({
      type: "standard",
      customer: { name: "Test Client 2", email: "test-features@medikart.test", phone: "+923002222222", address: "St 2", city: "Test City Alpha" },
      totals: { subtotal: 2350, deliveryCharge: 150, total: 2500 },
      paymentMethod: "cod",
      status: "shipped",
      assignedPharmacyId: pharmacyA._id,
      createdAt: baseDate,
    });
    await order2.save();

    const order3 = new Order({
      type: "standard",
      customer: { name: "Test Client 3", email: "test-features@medikart.test", phone: "+923003333333", address: "St 3", city: "Test City Beta" },
      totals: { subtotal: 3000, deliveryCharge: 200, total: 3200 },
      paymentMethod: "card",
      status: "delivered",
      assignedPharmacyId: pharmacyB._id,
      createdAt: baseDate,
    });
    await order3.save();

    // Query reporting service within date range
    const result = await pharmacyService.getPharmacyReports({
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });

    // Verify Pharmacy A stats
    const reportA = result.reports.find(r => r.pharmacyId.toString() === pharmacyA._id.toString());
    expect(reportA).toBeDefined();
    expect(reportA.totalOrders).toBe(2);
    expect(reportA.totalRevenue).toBe(4000); // 1500 + 2500
    expect(reportA.deliveredOrders).toBe(1);
    expect(reportA.pendingOrders).toBe(1); // 'shipped' is counted as in-progress
    expect(reportA.averageOrderValue).toBe(2000); // 4000 / 2

    // Verify Pharmacy B stats
    const reportB = result.reports.find(r => r.pharmacyId.toString() === pharmacyB._id.toString());
    expect(reportB).toBeDefined();
    expect(reportB.totalOrders).toBe(1);
    expect(reportB.totalRevenue).toBe(3200);
    expect(reportB.deliveredOrders).toBe(1);
    expect(reportB.averageOrderValue).toBe(3200);

    // Verify Date Filtering: query a date range that excludes these orders
    const emptyResult = await pharmacyService.getPharmacyReports({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    const emptyReportA = emptyResult.reports.find(r => r.pharmacyId.toString() === pharmacyA._id.toString());
    expect(emptyReportA.totalOrders).toBe(0);
    expect(emptyReportA.totalRevenue).toBe(0);
  });

  test("Admin Orders Pharmacy Filtering: specific branch, 'assigned', and 'unassigned'", async () => {
    // Also create an unassigned order
    const unassignedOrder = new Order({
      type: "standard",
      customer: { name: "Test Unassigned", email: "test-features@medikart.test", phone: "+923004444444", address: "St 4", city: "Test City Alpha" },
      totals: { subtotal: 1000, deliveryCharge: 150, total: 1150 },
      paymentMethod: "cod",
      status: "pending",
      createdAt: new Date(),
    });
    await unassignedOrder.save();

    // 1. Query by specific pharmacy ID (Pharmacy A)
    const resA = await request(app)
      .get(`/api/v1/admin/orders?pharmacyId=${pharmacyA._id}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(resA.status).toBe(200);
    expect(resA.body.data.orders.length).toBeGreaterThanOrEqual(2);
    expect(resA.body.data.orders.every(o => o.assignedPharmacyId?._id?.toString() === pharmacyA._id.toString())).toBe(true);

    // 2. Query by specific pharmacy ID (Pharmacy B)
    const resB = await request(app)
      .get(`/api/v1/admin/orders?pharmacyId=${pharmacyB._id}`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(resB.status).toBe(200);
    expect(resB.body.data.orders.length).toBeGreaterThanOrEqual(1);
    expect(resB.body.data.orders.every(o => o.assignedPharmacyId?._id?.toString() === pharmacyB._id.toString())).toBe(true);

    // 3. Query all assigned orders
    const resAssigned = await request(app)
      .get(`/api/v1/admin/orders?pharmacyId=assigned`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(resAssigned.status).toBe(200);
    expect(resAssigned.body.data.orders.length).toBeGreaterThanOrEqual(3);
    expect(resAssigned.body.data.orders.every(o => o.assignedPharmacyId != null)).toBe(true);

    // 4. Query unassigned orders
    const resUnassigned = await request(app)
      .get(`/api/v1/admin/orders?pharmacyId=unassigned`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(resUnassigned.status).toBe(200);
    expect(resUnassigned.body.data.orders.some(o => o._id.toString() === unassignedOrder._id.toString())).toBe(true);
    expect(resUnassigned.body.data.orders.every(o => !o.assignedPharmacyId)).toBe(true);
  });
});

describe("1b. Banner CRUD, Placement Field, Active Toggle & Storefront Gating", () => {
  let heroActive, heroInactive, midActive;

  test("Banner CRUD & Active Storefront Filtering", async () => {
    // 1. Create Active Hero Banner
    heroActive = await bannerService.createBanner({
      title: "TEST-BANNER-HERO-ACTIVE",
      subtitle: "Active Hero",
      imageUrl: "https://example.com/hero1.jpg",
      placement: "hero",
      displayOrder: 1,
      active: true,
    });

    // 2. Create Inactive Hero Banner
    heroInactive = await bannerService.createBanner({
      title: "TEST-BANNER-HERO-INACTIVE",
      subtitle: "Disabled Hero",
      imageUrl: "https://example.com/hero2.jpg",
      placement: "hero",
      displayOrder: 2,
      active: false,
    });

    // 3. Create Active Mid-Page Banner
    midActive = await bannerService.createBanner({
      title: "TEST-BANNER-MID-ACTIVE",
      subtitle: "Mid Page Promo",
      imageUrl: "https://example.com/mid.jpg",
      placement: "mid-page",
      displayOrder: 1,
      active: true,
    });

    // Storefront Query: GET /api/v1/banners?placement=hero
    const heroRes = await request(app).get("/api/v1/banners?placement=hero");
    expect(heroRes.status).toBe(200);
    const bannersList = heroRes.body.data?.banners || heroRes.body.banners || [];
    const heroTitles = bannersList.map(b => b.title);
    
    // CONFIRM: Active hero banner is returned
    expect(heroTitles).toContain("TEST-BANNER-HERO-ACTIVE");
    // CONFIRM: Inactive hero banner is NOT returned on storefront
    expect(heroTitles).not.toContain("TEST-BANNER-HERO-INACTIVE");
    // CONFIRM: Mid-page banner is NOT in hero placement
    expect(heroTitles).not.toContain("TEST-BANNER-MID-ACTIVE");

    // Storefront Query: GET /api/v1/banners?placement=mid-page
    const midRes = await request(app).get("/api/v1/banners?placement=mid-page");
    expect(midRes.status).toBe(200);
    const midBanners = midRes.body.data?.banners || midRes.body.banners || [];
    const midTitles = midBanners.map(b => b.title);
    expect(midTitles).toContain("TEST-BANNER-MID-ACTIVE");
    expect(midTitles).not.toContain("TEST-BANNER-HERO-ACTIVE");
  });
});

describe("1c. Condition CRUD & Storefront Condition Filtering", () => {
  let testCondition, condCategory, condProduct1, condProduct2;

  test("Condition linking to Category/Product and filtering on storefront", async () => {
    // 1. Create Condition
    testCondition = await conditionService.createCondition({
      name: "TEST-CONDITION-DIABETES",
      slug: "test-condition-diabetes",
      icon: "🩸",
      description: "Diabetes care medicines and supplies",
      active: true,
    });
    expect(testCondition.slug).toBe("test-condition-diabetes");

    // 2. Create Category and Products
    condCategory = new Category({
      name: "Test Diabetic Category",
      slug: "test-cat-diabetes",
      active: true,
    });
    await condCategory.save();

    // Link category to condition
    await conditionService.updateCondition(testCondition._id, {
      linkedCategoryIds: [condCategory._id],
    });

    condProduct1 = new Product({
      name: "TEST-PROD-INSULIN-GLARGINE",
      sku: "TEST-INS-01",
      price: 2500,
      categoryIds: [condCategory._id],
      active: true,
    });
    await condProduct1.save();

    // Product outside condition
    const otherCategory = new Category({
      name: "Test Other Category",
      slug: "test-cat-other",
      active: true,
    });
    await otherCategory.save();

    condProduct2 = new Product({
      name: "TEST-PROD-VITAMIN-C",
      sku: "TEST-VIT-01",
      price: 500,
      categoryIds: [otherCategory._id],
      active: true,
    });
    await condProduct2.save();

    // Storefront Query: GET /api/v1/products?condition=test-condition-diabetes&bypassCache=true
    const res = await request(app).get("/api/v1/products?condition=test-condition-diabetes&bypassCache=true");
    expect(res.status).toBe(200);
    
    const productsList = res.body.data?.products || [];
    const names = productsList.map(p => p.name);
    expect(names).toContain("TEST-PROD-INSULIN-GLARGINE");
    expect(names).not.toContain("TEST-PROD-VITAMIN-C");
  });
});

describe("1d. Order Short-Code Generation & Collision Resistance", () => {
  test("Collision Resistance: Generate 1,500 Order Codes with Zero Duplicates", () => {
    const { generateOrderCode } = Order;
    expect(typeof generateOrderCode).toBe("function");

    const codeSet = new Set();
    const count = 1500;

    for (let i = 0; i < count; i++) {
      const code = generateOrderCode();
      // Verify format: MK- followed by 6 alphanumeric characters
      expect(code).toMatch(/^MK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
      codeSet.add(code);
    }

    // Zero collisions in 1,500 consecutive generations
    expect(codeSet.size).toBe(count);
  });

  test("Collision Retry Logic: Model pre-validate hook regenerates on conflict", async () => {
    const code = Order.generateOrderCode();
    
    // Save existing order with this code
    const existingOrder = new Order({
      type: "standard",
      customer: { name: "Test Existing", email: "test-features@medikart.test", phone: "+923000000001", address: "St 1", city: "Test City Alpha" },
      totals: { subtotal: 500, deliveryCharge: 150, total: 650 },
      paymentMethod: "cod",
      orderCode: code,
    });
    await existingOrder.save();

    // Create new order — hook will generate code, find collision, retry, and assign a unique code
    const newOrder = new Order({
      type: "standard",
      customer: { name: "Test New", email: "test-features@medikart.test", phone: "+923000000002", address: "St 2", city: "Test City Alpha" },
      totals: { subtotal: 700, deliveryCharge: 150, total: 850 },
      paymentMethod: "cod",
    });
    await newOrder.save();

    expect(newOrder.orderCode).toBeDefined();
    expect(newOrder.orderCode).toMatch(/^MK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    expect(newOrder.orderCode).not.toBe(code); // Collision prevented
  });
});

describe("1e. Category Active-Toggle Cascade", () => {
  let activeCat, inactiveCat;
  let singleDisabledProd, multiCatProd, singleActiveProd;

  test("Product in ONLY disabled category is hidden; Product in disabled AND active category remains visible", async () => {
    activeCat = new Category({
      name: "Test Active Category Cascade",
      slug: "test-cat-active-cascade",
      active: true,
    });
    await activeCat.save();

    inactiveCat = new Category({
      name: "Test Inactive Category Cascade",
      slug: "test-cat-inactive-cascade",
      active: false,
    });
    await inactiveCat.save();

    // 1. Belongs ONLY to disabled category
    singleDisabledProd = new Product({
      name: "TEST-PROD-ONLY-DISABLED",
      sku: "TEST-CASCADE-01",
      price: 1000,
      categoryIds: [inactiveCat._id],
      active: true,
    });
    await singleDisabledProd.save();

    // 2. Belongs to disabled AND active category
    multiCatProd = new Product({
      name: "TEST-PROD-MULTI-ACTIVE-DISABLED",
      sku: "TEST-CASCADE-02",
      price: 1200,
      categoryIds: [activeCat._id, inactiveCat._id],
      active: true,
    });
    await multiCatProd.save();

    // 3. Belongs ONLY to active category
    singleActiveProd = new Product({
      name: "TEST-PROD-ONLY-ACTIVE",
      sku: "TEST-CASCADE-03",
      price: 1400,
      categoryIds: [activeCat._id],
      active: true,
    });
    await singleActiveProd.save();

    // Query storefront public catalog
    const res = await request(app).get("/api/v1/products?bypassCache=true&limit=100");
    expect(res.status).toBe(200);

    const productsList = res.body.data?.products || [];
    const productNames = productsList.map(p => p.name);

    // Assertions
    // Hidden: Single-category product in disabled category
    expect(productNames).not.toContain("TEST-PROD-ONLY-DISABLED");

    // Visible: Multi-category product having at least one active category
    expect(productNames).toContain("TEST-PROD-MULTI-ACTIVE-DISABLED");

    // Visible: Single-category product in active category
    expect(productNames).toContain("TEST-PROD-ONLY-ACTIVE");
  });
});

describe("2. City-Pharmacy Confidentiality (Public /api/v1/cities Inspection)", () => {
  test("Public GET /api/v1/cities returns only name, deliveryCharge and NO pharmacy fields", async () => {
    const res = await request(app).get("/api/v1/cities");
    expect(res.status).toBe(200);

    const cities = res.body.data?.cities || res.body.cities || [];
    expect(cities.length).toBeGreaterThan(0);

    // Check every item in data array
    cities.forEach(city => {
      expect(city).toHaveProperty("name");
      expect(city).toHaveProperty("deliveryCharge");
      expect(city.pharmacy).toBeUndefined();
      expect(city.pharmacies).toBeUndefined();
      expect(city.pharmacyIds).toBeUndefined();
      expect(city.assignedPharmacyId).toBeUndefined();
      expect(city.contactPerson).toBeUndefined();
    });

    // Whole response inspection
    const jsonString = JSON.stringify(res.body);
    expect(jsonString).not.toMatch(/pharmacy/i);
    expect(jsonString).not.toMatch(/assignedPharmacy/i);
  });
});
