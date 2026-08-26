/**
 * Child server spawned by redisMultiProcessTest.js
 */
const express = require("express");
const path = require("path");

// Ensure NODE_ENV is development so it uses real Redis connection
process.env.NODE_ENV = "development";

const app = express();
const port = process.argv[2] || process.env.PORT || 5000;

// Import the real rateLimiter middleware from project source
const { createRateLimiter } = require("../../server/src/middleware/rateLimiter");

// Create limiter: max 5 requests per 15 minutes
const testLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Rate limit exceeded",
});

app.get("/test-limit", testLimiter, (req, res) => {
  res.status(200).send("OK");
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Graceful exit handler
process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});
