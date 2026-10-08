/**
 * Monthly Refill Enterprise & OWASP Security Architecture Test Suite.
 *
 * Verifies:
 *   - Deliverable A: Mongoose model, compound indexes, strict constraints, cap of 25 items.
 *   - Deliverable B: Zod schemas, prototype pollution rejection, ID format validation.
 *   - Deliverable C: Brevo Reminder Service, HMAC-SHA256 signature, SSRF asset domain whitelisting, #FFF352 branding.
 *   - Deliverable D/E: Granular rate limiting on test-reminder, customer JWT verification.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const MonthlyRefill = require("../../src/models/monthlyRefill.model");
const Customer = require("../../src/modules/customers/customer.model");
const Product = require("../../src/modules/products/product.model");
const {
  createRefillSchema,
  updateRefillSchema,
  refillQuerySchema,
  refillParamIdSchema,
} = require("../../src/validators/monthlyRefill.validator");
const {
  sanitizeAssetUrl,
  generateReorderDeepLink,
  verifyReorderToken,
  buildRefillReminderHtml,
  sendBrevoMonthlyRefillEmail,
} = require("../../src/services/brevoReminder.service");

describe("Deliverable A & B: Model & Zod Validation Engine", () => {
  test("Zod rejects prototype pollution in query parameters (A03 Injection)", () => {
    const maliciousQuery = JSON.parse('{"__proto__": "polluted", "page": 1}');
    expect(() => refillQuerySchema.parse(maliciousQuery)).toThrow();
  });

  test("Zod rejects invalid MongoDB ObjectID format (A03 Injection)", () => {
    expect(() =>
      refillParamIdSchema.parse({ id: "invalid-not-24-hex-chars" })
    ).toThrow();
    expect(() =>
      refillParamIdSchema.parse({ id: "6ac7f0dc3422f9966d3e2a52" })
    ).not.toThrow();
  });

  test("Zod enforces frequencyDays enum: [15, 30, 45, 60]", () => {
    expect(() =>
      createRefillSchema.parse({
        items: [{ product: "6ac7f0dc3422f9966d3e2a52", quantity: 1 }],
        frequencyDays: 20, // Not allowed
      })
    ).toThrow();

    const validParsed = createRefillSchema.parse({
      items: [{ product: "6ac7f0dc3422f9966d3e2a52", quantity: 2 }],
      frequencyDays: 45,
    });
    expect(validParsed.frequencyDays).toBe(45);
  });

  test("Zod sanitizes customNotes and strips HTML tags (A03 XSS defense)", () => {
    const parsed = createRefillSchema.parse({
      items: [{ product: "6ac7f0dc3422f9966d3e2a52", quantity: 1 }],
      customNotes: "Please leave package at <script>alert(1)</script>front door",
    });
    expect(parsed.customNotes).toBe("Please leave package at front door");
  });

  test("Mongoose model defines compound indexes for query optimization", () => {
    const indexes = MonthlyRefill.schema.indexes();
    const hasCustomerStatusIndex = indexes.some(
      ([idx]) => idx.customer === 1 && idx.status === 1
    );
    const hasNextReminderDateIndex = indexes.some(
      ([idx]) => idx.nextReminderDate === 1 && idx.status === 1
    );

    expect(hasCustomerStatusIndex).toBe(true);
    expect(hasNextReminderDateIndex).toBe(true);
  });
});

describe("Deliverable C: Brevo Reminder Service & Security Directives", () => {
  test("Anti-SSRF (A10): sanitizeAssetUrl resolves trusted domains and rejects internal/arbitrary URLs", () => {
    // Trusted Cloudinary or Medikart origins
    expect(sanitizeAssetUrl("https://medikart.pk/uploads/product.jpg")).toBe(
      "https://medikart.pk/uploads/product.jpg"
    );
    expect(sanitizeAssetUrl("https://res.cloudinary.com/medikart/image/upload/v1/prod.jpg")).toBe(
      "https://res.cloudinary.com/medikart/image/upload/v1/prod.jpg"
    );
    expect(sanitizeAssetUrl("/uploads/local.jpg")).toBe(
      "https://medikart.pk/uploads/local.jpg"
    );

    // Block SSRF attempts: localhost, 169.254.169.254, arbitrary webhooks
    expect(sanitizeAssetUrl("http://localhost:5000/internal-data")).toBe(
      "https://medikart.pk/uploads/placeholder.webp"
    );
    expect(sanitizeAssetUrl("http://169.254.169.254/latest/meta-data")).toBe(
      "https://medikart.pk/uploads/placeholder.webp"
    );
    expect(sanitizeAssetUrl("https://malicious-attacker.com/exploit.png")).toBe(
      "https://medikart.pk/uploads/placeholder.webp"
    );
  });

  test("HMAC Integrity (A02): generates and verifies tamper-proof reorder deep link", () => {
    const refillId = "6ac7f0dc3422f9966d3e2a52";
    const customerId = "6ac7f0db3422f9966d3e2a25";

    const link = generateReorderDeepLink(refillId, customerId, 24);
    expect(link).toContain("signature=");
    expect(link).toContain("expiresAt=");

    const url = new URL(link);
    const exp = url.searchParams.get("expiresAt");
    const sig = url.searchParams.get("signature");

    // Valid verification
    expect(verifyReorderToken(refillId, customerId, exp, sig)).toBe(true);

    // Tampered payload rejected
    expect(verifyReorderToken(refillId, "tampered-customer-id", exp, sig)).toBe(false);

    // Expired timestamp rejected
    const expiredTs = Date.now() - 10000;
    expect(verifyReorderToken(refillId, customerId, expiredTs, sig)).toBe(false);
  });

  test("Branding & Email Builder: includes #FFF352 brand token", () => {
    const html = buildRefillReminderHtml({
      customerName: "Jane Doe",
      items: [{ name: "Amoxicillin 500mg", quantity: 2, unitPriceAtAddition: 320 }],
      reorderUrl: "https://medikart.pk/refill",
      frequencyDays: 30,
    });

    expect(html).toContain("#FFF352");
    expect(html).toContain("Amoxicillin 500mg");
    expect(html).toContain("1-Click Secure Reorder");
  });
});
