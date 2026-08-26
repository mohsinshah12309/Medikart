/**
 * Custom Rate Limiter Middleware — Phase 21/22.
 *
 * Implements a sliding-window rate limiting strategy using a Redis sorted set
 * (ZSET).  In production this is backed by ioredis (shared across processes).
 * In tests without REDIS_URL the redisClient module transparently substitutes
 * an in-memory stub, so test isolation is preserved with no network calls.
 *
 * Key design:
 *   - Composite key = IP + route namespace → limits don't bleed across routes.
 *   - Atomic pipeline: ZREMRANGEBYSCORE → ZCARD → ZADD → PEXPIRE in one
 *     round-trip (no race between the count check and the add).
 *   - resetRateLimiters() calls flushdb() on the stub (test) or is a no-op on
 *     a real Redis (tests that use a real Redis must manage their own cleanup).
 */

const redisClient = require("../config/redisClient");

/**
 * Creates an Express middleware for rate limiting.
 *
 * @param {Object} [options]
 * @param {number} [options.windowMs=900000]  - Window length in ms (default 15 min)
 * @param {number} [options.max=5]            - Max requests per window
 * @param {string} [options.message]          - 429 response message
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 5,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return async (req, res, next) => {
    try {
      // Prefer X-Forwarded-For (proxy/load-balancer) then fall back to req.ip
      const ip =
        req.headers["x-forwarded-for"] ||
        req.ip ||
        (req.connection && req.connection.remoteAddress) ||
        "127.0.0.1";

      // Try to determine admin identity to prevent distributed/IP-rotation bypasses
      let adminId = req.admin && req.admin.id;
      if (!adminId && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        const token = req.headers.authorization.slice(7);
        const secret = process.env.JWT_SECRET;
        if (secret) {
          try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(token, secret);
            if (decoded && decoded.sub) {
              adminId = decoded.sub;
            }
          } catch (err) {
            // Ignore verification error; fall back to IP-based rate limiting
          }
        }
      }

      // Namespace key by either admin ID or IP + path, so limits don't bleed across routes
      const routeKey = req.baseUrl || req.path;
      const key = adminId ? `ratelimit:admin:${adminId}:${routeKey}` : `ratelimit:ip:${ip}:${routeKey}`;

      const now = Date.now();
      const cutoff = now - windowMs;

      // Atomic pipeline: prune old entries → count remaining → record new hit → get oldest element → set TTL
      const multi = redisClient.multi();
      multi.zremrangebyscore(key, 0, cutoff);          // [0] remove stale
      multi.zcard(key);                                 // [1] count before this request
      multi.zadd(key, now, `${now}:${Math.random()}`); // [2] record hit
      multi.zrange(key, 0, 0);                         // [3] get oldest element in current window
      multi.pexpire(key, windowMs);                    // [4] sliding TTL

      const results = await multi.exec();

      // results[1] is [err, count] from ioredis pipeline; stub returns same shape
      const currentCount = results[1][1];

      if (currentCount >= max) {
        // Calculate dynamic Retry-After header (seconds until oldest entry in current window expires)
        const oldestVal = results[3] && results[3][1] && results[3][1][0];
        let oldestTimestamp = now;
        if (oldestVal) {
          const parts = oldestVal.split(":");
          oldestTimestamp = parseInt(parts[0], 10) || now;
        }

        const remainingMs = (oldestTimestamp + windowMs) - now;
        const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
        res.set("Retry-After", String(retryAfterSeconds));

        return res.status(429).json({ status: "error", message });
      }

      next();
    } catch (error) {
      // If the backing store fails we log and pass through rather than taking
      // the entire API down.
      console.error("[RateLimiter] Error:", error.message);
      next();
    }
  };
};

/**
 * Flushes all rate-limit counters.
 * Called in beforeEach() by every test suite that imports createRateLimiter.
 * In test mode (in-memory stub) this is synchronous and instant.
 */
const resetRateLimiters = () => {
  // The stub and a real test-redis both expose flushdb()
  if (typeof redisClient.flushdb === "function") {
    redisClient.flushdb().catch(() => {});
  }
};

module.exports = { createRateLimiter, resetRateLimiters };
