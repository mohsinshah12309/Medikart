/**
 * Medikart Performance & Caching Benchmark Tool
 *
 * Measures response times, latency distribution (p50, p95, p99), throughput (req/s),
 * and cache speedup across hot-path read endpoints.
 */

const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = require("../src/app");
const { connectDB } = require("../src/config/db");
const Product = require("../src/modules/products/product.model");
const redisClient = require("../src/config/redisClient");

const CONCURRENCY = 20;
const TOTAL_REQUESTS = 100;

function makeRequest(serverUrl, path) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.get(`${serverUrl}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          bodyLength: data.length,
        });
      });
    });
    req.on("error", (err) => reject(err));
  });
}

async function runBenchmarkForPath(serverUrl, path, name) {
  // 1. Cold Request (Bypass cache)
  const coldRes = await makeRequest(serverUrl, `${path}${path.includes("?") ? "&" : "?"}bypassCache=true`);

  // 2. Prime the cache
  await makeRequest(serverUrl, path);

  // 3. Run concurrent warm requests (hitting Redis cache)
  const durations = [];
  const startTime = Date.now();

  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);
  for (let b = 0; b < batches; b++) {
    const promises = [];
    for (let c = 0; c < CONCURRENCY; c++) {
      promises.push(makeRequest(serverUrl, path));
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      durations.push(r.durationMs);
    }
  }

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const throughput = (durations.length / totalTimeSec).toFixed(1);

  durations.sort((a, b) => a - b);
  const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);
  const p50 = durations[Math.floor(durations.length * 0.5)].toFixed(2);
  const p95 = durations[Math.floor(durations.length * 0.95)].toFixed(2);
  const p99 = durations[Math.floor(durations.length * 0.99)].toFixed(2);
  const speedup = (coldRes.durationMs / parseFloat(avg)).toFixed(1);

  return {
    endpoint: name,
    coldMs: coldRes.durationMs.toFixed(2),
    avgWarmMs: avg,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    throughputReqSec: throughput,
    speedup: `${speedup}x`,
  };
}

async function start() {
  console.log("\n========================================================");
  console.log("   MEDIKART BACKEND PERFORMANCE & CACHE BENCHMARK");
  console.log("========================================================\n");

  await connectDB();

  // Find a sample product for detail benchmark
  const sampleProduct = await Product.findOne({ active: true });
  const sampleProductId = sampleProduct ? sampleProduct._id.toString() : "000000000000000000000000";

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, "127.0.0.1", resolve));
  const serverUrl = "http://127.0.0.1:5099";

  console.log(`Test server running at ${serverUrl}`);
  console.log(`Running benchmark with ${TOTAL_REQUESTS} requests (${CONCURRENCY} concurrent)...\n`);

  try {
    const endpoints = [
      { name: "Product Catalog (GET /api/v1/products)", path: "/api/v1/products?limit=20" },
      { name: "Product Detail (GET /api/v1/products/:id)", path: `/api/v1/products/${sampleProductId}` },
      { name: "Category List (GET /api/v1/categories)", path: "/api/v1/categories" },
      { name: "Search Suggestions (GET /api/v1/search/suggestions)", path: "/api/v1/search/suggestions?q=pan" },
    ];

    const results = [];
    for (const ep of endpoints) {
      process.stdout.write(`Testing: ${ep.name}... `);
      const res = await runBenchmarkForPath(serverUrl, ep.path, ep.name);
      results.push(res);
      console.log("Done.");
    }

    console.log("\n========================================================");
    console.log("                   BENCHMARK RESULTS");
    console.log("========================================================\n");
    console.table(results);
    console.log("\nBenchmark completed successfully.\n");
  } catch (err) {
    console.error("Benchmark error:", err);
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

start();
