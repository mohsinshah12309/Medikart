/**
 * searchAnalytics.test.js
 * 
 * Tests for Medikart Dynamic Trending Search & Search Popularity Tracking:
 *  1. recordSearch increments query count and categorizes icons accurately
 *  2. getTrendingSearches dynamically ranks most searched terms
 *  3. POST /api/v1/search/record records search term dynamically
 *  4. GET /api/v1/trending-searches returns dynamic trending searches & products
 */

jest.setTimeout(30000);

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../src/app");
const SearchQuery = require("../../src/modules/search/searchQuery.model");
const { recordSearch, getTrendingSearches, getIconForTerm } = require("../../src/modules/search/search.service");

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await SearchQuery.deleteMany({ query: { $in: ["panadol test", "surbex z test", "baby diapers test"] } });
    await mongoose.connection.close();
  }
});

describe("Dynamic Search & Trending Analytics", () => {
  test("getIconForTerm maps keywords to appropriate category icons", () => {
    expect(getIconForTerm("Panadol Extra")).toBe("💊");
    expect(getIconForTerm("Surbex Z Zinc")).toBe("✨");
    expect(getIconForTerm("Baby Diapers Pampers")).toBe("🍼");
    expect(getIconForTerm("Nexum 40mg")).toBe("🌿");
    expect(getIconForTerm("Dettol Antiseptic")).toBe("🩹");
    expect(getIconForTerm("Digital BP Monitor")).toBe("🩺");
    expect(getIconForTerm("Moisturizing Cream")).toBe("🧴");
  });

  test("recordSearch correctly tracks and increments query hits in MongoDB", async () => {
    await SearchQuery.deleteOne({ query: "panadol test" });

    // First search
    const first = await recordSearch("Panadol Test");
    expect(first).not.toBeNull();
    expect(first.query).toBe("panadol test");
    expect(first.displayName).toBe("Panadol Test");
    expect(first.count).toBe(1);

    // Second search increments count
    const second = await recordSearch("panadol test");
    expect(second.count).toBe(2);

    // Third search increments count again
    const third = await recordSearch("  PANADOL TEST  ");
    expect(third.count).toBe(3);
  });

  test("getTrendingSearches returns sorted results based on search frequency", async () => {
    await SearchQuery.deleteMany({ query: { $in: ["surbex z test", "baby diapers test"] } });

    await recordSearch("Surbex Z Test");
    await recordSearch("Surbex Z Test");
    await recordSearch("Surbex Z Test");
    await recordSearch("Surbex Z Test"); // count 4

    await recordSearch("Baby Diapers Test"); // count 1

    const trending = await getTrendingSearches(10);
    expect(Array.isArray(trending)).toBe(true);
    expect(trending.length).toBeGreaterThanOrEqual(5);

    const surbexIndex = trending.findIndex((t) => t.name === "Surbex Z Test");
    const diapersIndex = trending.findIndex((t) => t.name === "Baby Diapers Test");

    expect(surbexIndex).not.toBe(-1);
    expect(diapersIndex).not.toBe(-1);
    expect(surbexIndex).toBeLessThan(diapersIndex);
  });

  test("POST /api/v1/search/record records search term via API", async () => {
    const res = await request(app)
      .post("/api/v1/search/record")
      .send({ query: "Augmentin 625mg" })
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.query).toBe("augmentin 625mg");
  });

  test("GET /api/v1/trending-searches returns structured trending search items", async () => {
    const res = await request(app)
      .get("/api/v1/trending-searches?limit=8")
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data.trendingSearches)).toBe(true);
    expect(res.body.data.trendingSearches.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.trendingSearches[0]).toHaveProperty("name");
    expect(res.body.data.trendingSearches[0]).toHaveProperty("icon");
  });
});
