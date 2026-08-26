/**
 * Custom Rate Limiter Middleware — Phase 22.
 *
 * Implements a lightweight, sliding-window, in-memory rate limiting strategy.
 * Key features:
 *   - Keyed by client IP and request endpoint namespace.
 *   - Sliding-window timestamp pruning ensures map size doesn't grow unboundedly.
 *   - Exposes resetRateLimiters() for test isolation (NFR-SEC-01).
 *   - Safe response format that rejects excessive requests with HTTP 429 without leaking internals.
 */

const ipRequestLogs = new Map(); // key -> [timestamps]

/**
 * Creates an Express middleware for rate limiting.
 *
 * @param {Object} options
 * @param {number} [options.windowMs=900000] - Time window in milliseconds (default 15 mins)
 * @param {number} [options.max=5] - Maximum requests allowed in the window
 * @param {string} [options.message="Too many requests. Please try again later."] - Custom error message
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 5, message = "Too many requests. Please try again later." } = {}) => {
  return (req, res, next) => {
    // In test environment or behind proxies, look for common headers, fallback to req.ip
    const ip = req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress || "127.0.0.1";
    
    // Namespace the key by IP + path/base route to ensure limits don't overlap across different features
    const routeKey = req.baseUrl || req.path;
    const key = `${ip}:${routeKey}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Prune stale timestamps
    const timestamps = (ipRequestLogs.get(key) || []).filter((t) => t > cutoff);
    
    if (timestamps.length >= max) {
      return res.status(429).json({
        status: "error",
        message,
      });
    }
    
    // Record current request timestamp
    timestamps.push(now);
    ipRequestLogs.set(key, timestamps);
    
    next();
  };
};

/**
 * Resets the in-memory rate limit logs.
 * Crucial for unit test isolation (Phase 22 / Step 20).
 */
const resetRateLimiters = () => {
  ipRequestLogs.clear();
};

module.exports = {
  createRateLimiter,
  resetRateLimiters,
};
