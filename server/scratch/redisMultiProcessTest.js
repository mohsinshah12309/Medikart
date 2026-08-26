/**
 * Standalone Redis multi-process rate limiting verification script.
 * 
 * Spawns two separate child processes, each hosting an Express server on a different port.
 * Both processes share the same Redis instance and apply the same rate limiter middleware.
 * The script then hits both ports sequentially and proves that the rate limit (max: 5)
 * is shared globally across processes (e.g., 3 hits on Port A + 3 hits on Port B -> 6th hit blocked with 429).
 */

const { fork } = require("child_process");
const path = require("path");
const axios = require("axios");

// Ensure NODE_ENV is not 'test' so we use the real Redis client connection
delete process.env.NODE_ENV;
require("dotenv").config({ path: path.join(__dirname, "../../server/.env") });

const PORT_A = 5001;
const PORT_B = 5002;

function spawnChild(port) {
  return fork(path.join(__dirname, "childServer.js"), [port], {
    env: { ...process.env, PORT: port, NODE_ENV: "development" },
    silent: true,
  });
}

async function run() {
  console.log("=================================================");
  console.log("Redis Multi-Process Rate Limiter Test");
  console.log("=================================================");

  console.log("Spawning Process A (Port 5001) and Process B (Port 5002)...");
  const childA = spawnChild(PORT_A);
  const childB = spawnChild(PORT_B);

  // Capture logs from children
  childA.stdout.on("data", (data) => console.log(`[Process A] ${data.toString().trim()}`));
  childB.stdout.on("data", (data) => console.log(`[Process B] ${data.toString().trim()}`));
  childA.stderr.on("data", (data) => console.error(`[Process A Error] ${data.toString().trim()}`));
  childB.stderr.on("data", (data) => console.error(`[Process B Error] ${data.toString().trim()}`));

  // Wait 2 seconds for servers to start and connect to Redis
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("\nStarting rate-limit hits (Limit: 5 requests per 15 mins)...");

  // Send 3 requests to Process A
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await axios.get(`http://127.0.0.1:${PORT_A}/test-limit`);
      console.log(`Hit ${i}: Requested Process A (Port 5001) -> Status: ${res.status}`);
    } catch (err) {
      console.log(`Hit ${i}: Requested Process A (Port 5001) -> Failed with: ${err.response ? err.response.status : err.message}`);
    }
  }

  // Send 3 requests to Process B
  for (let i = 4; i <= 6; i++) {
    try {
      const res = await axios.get(`http://127.0.0.1:${PORT_B}/test-limit`);
      console.log(`Hit ${i}: Requested Process B (Port 5002) -> Status: ${res.status}`);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.log(`Hit ${i}: Requested Process B (Port 5002) -> Status: 429 (RATE LIMITED!)`);
        console.log(`Retry-After Header: ${err.response.headers["retry-after"]} seconds`);
      } else {
        console.log(`Hit ${i}: Requested Process B (Port 5002) -> Failed with: ${err.response ? err.response.status : err.message}`);
      }
    }
  }

  console.log("\nCleaning up processes...");
  childA.kill();
  childB.kill();
  console.log("Test finished.");
  console.log("=================================================");
}

run().catch(console.error);
