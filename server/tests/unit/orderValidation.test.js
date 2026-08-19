/**
 * orderValidation.test.js — Audit Fix / Verification (PART A - Items 3 & 4).
 *
 * Tests Zod validation & true content validation:
 *   1. Sending malformed JSON or empty items array to POST /orders/instant and
 *      POST /orders/narcotics returns 400 (not 500).
 *   2. Uploading a renamed executable (.exe bytes) with a spoofed image/jpeg or
 *      application/pdf mimetype returns 400 (rejected by magic bytes).
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");

// Fake executable binary content disguised as JPG/PDF (starts with MZ...)
const SPOOFED_EXE_BUFFER = Buffer.from(
  "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00 fake executable binary",
);

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);
}, 90000);

afterAll(async () => {
  await mongoose.connection.close();
}, 90000);

describe("Order Route Zod & Content Validation (Fixes 3 & 4)", () => {
  describe("Zod validation — malformed JSON & empty items", () => {
    test("POST /api/v1/orders/instant returns 400 on malformed JSON in customer field", async () => {
      const res = await request(app)
        .post("/api/v1/orders/instant")
        .field("customer", "{ malformed json string")
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email: "test@example.com", code: "123456" }));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/invalid json|validation/i);
    });

    test("POST /api/v1/orders/narcotics returns 400 on malformed JSON in items field", async () => {
      const res = await request(app)
        .post("/api/v1/orders/narcotics")
        .field("customer", JSON.stringify({ name: "Ali", phone: "+923001234567", address: "123 St", city: "Lahore" }))
        .field("items", "not-valid-json-array")
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email: "test@example.com", code: "123456" }));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });

    test("POST /api/v1/orders/narcotics returns 400 on empty items array", async () => {
      const res = await request(app)
        .post("/api/v1/orders/narcotics")
        .field("customer", JSON.stringify({ name: "Ali", phone: "+923001234567", address: "123 St", city: "Lahore" }))
        .field("items", JSON.stringify([]))
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email: "test@example.com", code: "123456" }));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });
  });

  describe("Prescription true content validation — magic bytes", () => {
    test("POST /api/v1/orders/instant rejects spoofed .exe with image/jpeg mimetype", async () => {
      const res = await request(app)
        .post("/api/v1/orders/instant")
        .field("customer", JSON.stringify({ name: "Ali", phone: "+923001234567", address: "123 St", city: "Lahore" }))
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email: "test@example.com", code: "123456" }))
        .attach("prescription", SPOOFED_EXE_BUFFER, {
          filename: "malicious.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/validation/i);
    });

    test("POST /api/v1/orders/narcotics rejects spoofed .exe with application/pdf mimetype", async () => {
      const res = await request(app)
        .post("/api/v1/orders/narcotics")
        .field("customer", JSON.stringify({ name: "Ali", phone: "+923001234567", address: "123 St", city: "Lahore" }))
        .field("items", JSON.stringify([{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }]))
        .field("paymentMethod", "cod")
        .field("otp", JSON.stringify({ email: "test@example.com", code: "123456" }))
        .attach("prescription", SPOOFED_EXE_BUFFER, {
          filename: "malicious.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/validation/i);
    });
  });
});
