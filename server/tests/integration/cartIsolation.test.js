/**
 * cartIsolation.test.js
 * Integration test suite for Cart Data Isolation, Guest Scoping, Customer Scoping,
 * Login Merge, and Anti-Cache Protection.
 */

jest.setTimeout(60000);

require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");
const Customer = require("../../src/modules/customers/customer.model");
const Cart = require("../../src/modules/cart/cart.model");

let prodA = null;
let prodB = null;
let prodC = null;
let customer1 = null;
let customer2 = null;
let token1 = "";
let token2 = "";

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Cleanup prior test records
  await Category.deleteMany({ slug: "cart-test-cat" });
  await Product.deleteMany({ name: { $in: ["Cart Prod A", "Cart Prod B", "Cart Prod C"] } });
  await Customer.deleteMany({ email: { $in: ["cart-cust-1@medikart.pk", "cart-cust-2@medikart.pk"] } });
  await Cart.deleteMany({});

  const category = await Category.create({
    name: "Cart Test Category",
    slug: "cart-test-cat",
    active: true,
  });

  prodA = await Product.create({
    sku: "SKU-CART-A",
    name: "Cart Prod A",
    genericName: "Paracetamol",
    price: 100,
    categoryIds: [category._id],
    stock: 50,
    active: true,
    requiresPrescription: false,
    isNarcotic: false,
  });

  prodB = await Product.create({
    sku: "SKU-CART-B",
    name: "Cart Prod B",
    genericName: "Ibuprofen",
    price: 200,
    categoryIds: [category._id],
    stock: 50,
    active: true,
    requiresPrescription: false,
    isNarcotic: false,
  });

  prodC = await Product.create({
    sku: "SKU-CART-C",
    name: "Cart Prod C",
    genericName: "Amoxicillin",
    price: 300,
    categoryIds: [category._id],
    stock: 50,
    active: true,
    requiresPrescription: false,
    isNarcotic: false,
  });

  customer1 = await Customer.create({
    name: "Cart Customer One",
    email: "cart-cust-1@medikart.pk",
    passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF",
    emailVerified: true,
    isBlocked: false,
  });

  customer2 = await Customer.create({
    name: "Cart Customer Two",
    email: "cart-cust-2@medikart.pk",
    passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF",
    emailVerified: true,
    isBlocked: false,
  });

  const secret = process.env.JWT_SECRET;
  token1 = jwt.sign({ sub: customer1._id.toString(), role: "customer" }, secret, { expiresIn: "1h" });
  token2 = jwt.sign({ sub: customer2._id.toString(), role: "customer" }, secret, { expiresIn: "1h" });
});

afterAll(async () => {
  await Category.deleteMany({ slug: "cart-test-cat" });
  await Product.deleteMany({ name: { $in: ["Cart Prod A", "Cart Prod B", "Cart Prod C"] } });
  await Customer.deleteMany({ email: { $in: ["cart-cust-1@medikart.pk", "cart-cust-2@medikart.pk"] } });
  await Cart.deleteMany({});
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe("Cart Data Isolation & Scoping Test Suite", () => {
  test("1. Anti-Cache Headers: GET /api/v1/cart sets strict no-store headers", async () => {
    const res = await request(app).get("/api/v1/cart");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/no-store/);
    expect(res.headers["pragma"]).toBe("no-cache");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/medikart_guest_id=/);
  });

  test("2. Guest Isolation: Two separate guest visitors have completely isolated carts", async () => {
    const guest1Id = "guest-uuid-1111-1111-1111";
    const guest2Id = "guest-uuid-2222-2222-2222";

    // Guest 1 adds Product A (qty 2)
    const res1 = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", [`medikart_guest_id=${guest1Id}`])
      .send({ productId: prodA._id.toString(), quantity: 2 });

    expect(res1.status).toBe(200);
    expect(res1.body.data.items).toHaveLength(1);
    expect(res1.body.data.items[0].name).toBe("Cart Prod A");
    expect(res1.body.data.items[0].quantity).toBe(2);

    // Guest 2 adds Product B (qty 3)
    const res2 = await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", [`medikart_guest_id=${guest2Id}`])
      .send({ productId: prodB._id.toString(), quantity: 3 });

    expect(res2.status).toBe(200);
    expect(res2.body.data.items).toHaveLength(1);
    expect(res2.body.data.items[0].name).toBe("Cart Prod B");
    expect(res2.body.data.items[0].quantity).toBe(3);

    // Verify Guest 1 cart STILL only has Product A
    const verifyGuest1 = await request(app)
      .get("/api/v1/cart")
      .set("Cookie", [`medikart_guest_id=${guest1Id}`]);

    expect(verifyGuest1.body.data.items).toHaveLength(1);
    expect(verifyGuest1.body.data.items[0].name).toBe("Cart Prod A");
    expect(verifyGuest1.body.data.items[0].quantity).toBe(2);

    // Verify Guest 2 cart STILL only has Product B
    const verifyGuest2 = await request(app)
      .get("/api/v1/cart")
      .set("Cookie", [`medikart_guest_id=${guest2Id}`]);

    expect(verifyGuest2.body.data.items).toHaveLength(1);
    expect(verifyGuest2.body.data.items[0].name).toBe("Cart Prod B");
    expect(verifyGuest2.body.data.items[0].quantity).toBe(3);
  });

  test("3. Authenticated Customer Isolation: Customer 1 and Customer 2 have distinct account carts", async () => {
    // Customer 1 adds Product C
    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token1}`)
      .send({ productId: prodC._id.toString(), quantity: 1 });

    // Customer 2 adds Product A
    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token2}`)
      .send({ productId: prodA._id.toString(), quantity: 5 });

    // Customer 1 verifies cart
    const cust1Cart = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${token1}`);

    expect(cust1Cart.body.data.items).toHaveLength(1);
    expect(cust1Cart.body.data.items[0].name).toBe("Cart Prod C");

    // Customer 2 verifies cart
    const cust2Cart = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${token2}`);

    expect(cust2Cart.body.data.items).toHaveLength(1);
    expect(cust2Cart.body.data.items[0].name).toBe("Cart Prod A");
    expect(cust2Cart.body.data.items[0].quantity).toBe(5);
  });

  test("4. Guest-to-Customer Merge on Login: Merges guest cart into customer account cart without loss", async () => {
    const guestMergeId = "guest-merge-uuid-3333";

    // Guest adds Product A (qty 2) and Product B (qty 1)
    await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", [`medikart_guest_id=${guestMergeId}`])
      .send({ productId: prodA._id.toString(), quantity: 2 });

    await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", [`medikart_guest_id=${guestMergeId}`])
      .send({ productId: prodB._id.toString(), quantity: 1 });

    // Customer 1 already has Product C (qty 1).
    // Now Customer 1 logs in and merges guestMergeId cart
    const mergeRes = await request(app)
      .post("/api/v1/cart/merge")
      .set("Authorization", `Bearer ${token1}`)
      .set("Cookie", [`medikart_guest_id=${guestMergeId}`])
      .send({ guestId: guestMergeId });

    expect(mergeRes.status).toBe(200);
    const items = mergeRes.body.data.items;
    // Customer 1 should now have 3 items: Product C, Product A, Product B
    expect(items).toHaveLength(3);
    const prodAItem = items.find((i) => i.name === "Cart Prod A");
    const prodBItem = items.find((i) => i.name === "Cart Prod B");
    const prodCItem = items.find((i) => i.name === "Cart Prod C");

    expect(prodAItem.quantity).toBe(2);
    expect(prodBItem.quantity).toBe(1);
    expect(prodCItem.quantity).toBe(1);

    // Guest cart document should now be deleted
    const guestCartDoc = await Cart.findOne({ guestId: guestMergeId });
    expect(guestCartDoc).toBeNull();
  });

  test("5. Logout Reversion: Request without auth token is isolated to a new/existing guest session", async () => {
    // Fresh guest request without cookies or auth
    const guestRes = await request(app).get("/api/v1/cart");
    expect(guestRes.status).toBe(200);
    // Should be an empty cart, NOT Customer 1's items
    expect(guestRes.body.data.items).toEqual([]);
    expect(guestRes.body.data.cartCount).toBe(0);
  });

  test("6. Quantity updates and Item removal", async () => {
    const guestId = "guest-update-test-4444";

    // Add item
    await request(app)
      .post("/api/v1/cart/items")
      .set("Cookie", [`medikart_guest_id=${guestId}`])
      .send({ productId: prodA._id.toString(), quantity: 2 });

    // Update quantity to 7
    const updateRes = await request(app)
      .patch(`/api/v1/cart/items/${prodA._id.toString()}`)
      .set("Cookie", [`medikart_guest_id=${guestId}`])
      .send({ quantity: 7 });

    expect(updateRes.body.data.items[0].quantity).toBe(7);

    // Remove item
    const removeRes = await request(app)
      .delete(`/api/v1/cart/items/${prodA._id.toString()}`)
      .set("Cookie", [`medikart_guest_id=${guestId}`]);

    expect(removeRes.body.data.items).toEqual([]);
    expect(removeRes.body.data.cartCount).toBe(0);
  });
});
