/**
 * deliveryCharge.test.js — Phase 7 unit tests (Fix 6 / NFR-TEST-01).
 *
 * Tests FR-CW-11 via city.service.getDeliveryCharge():
 *   1. Configured active city -> returns that city's deliveryCharge (e.g. 250).
 *   2. Non-configured city -> returns the default charge (500).
 *   3. Inactive city -> returns the default charge (500).
 *   4. Invalid/empty input -> returns the default charge (500).
 *   5. Client CANNOT override the charge — the function signature accepts only
 *      a city name; there is no charge parameter anywhere (FR-CW-11 / §9.2).
 */

require("dotenv").config();

const mongoose = require("mongoose");
const City = require("../../src/modules/cities/city.model");
const {
  getDeliveryCharge,
  DEFAULT_DELIVERY_CHARGE,
} = require("../../src/modules/cities/city.service");

const CONFIGURED_CHARGE = 250;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);
  await City.deleteMany({});

  // Configured active city (Lahore -> 250) and an inactive city.
  await City.create({
    name: "Lahore",
    deliveryCharge: CONFIGURED_CHARGE,
    active: true,
  });
  await City.create({ name: "Old City", deliveryCharge: 150, active: false });
}, 15000);

afterAll(async () => {
  await City.deleteMany({});
  await mongoose.connection.close();
}, 15000);

describe("getDeliveryCharge — FR-CW-11 delivery pricing", () => {
  test("Configured active city -> returns its configured charge (250)", async () => {
    const charge = await getDeliveryCharge("Lahore");
    expect(charge).toBe(CONFIGURED_CHARGE);
  });

  test("Case-insensitive match -> still returns configured charge", async () => {
    const charge = await getDeliveryCharge("lahore");
    expect(charge).toBe(CONFIGURED_CHARGE);
  });

  test("Non-configured city -> returns default charge (500)", async () => {
    const charge = await getDeliveryCharge("Multan");
    expect(charge).toBe(DEFAULT_DELIVERY_CHARGE);
  });

  test("Inactive city -> returns default charge (500), never its stored charge", async () => {
    const charge = await getDeliveryCharge("Old City");
    expect(charge).toBe(DEFAULT_DELIVERY_CHARGE);
  });

  test("Empty / missing city name -> returns default charge (500)", async () => {
    expect(await getDeliveryCharge("")).toBe(DEFAULT_DELIVERY_CHARGE);
    expect(await getDeliveryCharge(undefined)).toBe(DEFAULT_DELIVERY_CHARGE);
    expect(await getDeliveryCharge(null)).toBe(DEFAULT_DELIVERY_CHARGE);
  });

  test("Client CANNOT override the charge — no charge parameter exists on the function", async () => {
    // The function signature is getDeliveryCharge(cityName) — there is no
    // overload or optional charge value. Passing extra args is ignored.
    const charge = await getDeliveryCharge("Lahore", 0);
    expect(charge).toBe(CONFIGURED_CHARGE);

    // Even if a caller tries to trick it with an object, it still only reads
    // the DB-configured value, never a client-supplied number.
    const charge2 = await getDeliveryCharge({
      name: "Lahore",
      deliveryCharge: 1,
    });
    expect(charge2).toBe(DEFAULT_DELIVERY_CHARGE);
  });
});
