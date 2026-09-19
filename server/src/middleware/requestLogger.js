/**
 * requestLogger.js
 *
 * Secure HTTP Request & Error Logger with automatic sensitive data redaction.
 */

const { sanitizeSensitiveData } = require("../utils/sanitizeLog");

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Only log in development or non-test environments to avoid noise in unit test runs
    if (process.env.NODE_ENV !== "test") {
      const sanitizedQuery = sanitizeSensitiveData(req.query || {});
      const hasQuery = Object.keys(sanitizedQuery).length > 0;
      const queryStr = hasQuery ? ` ?${JSON.stringify(sanitizedQuery)}` : "";

      const logMsg = `[HTTP] ${req.method} ${req.originalUrl || req.url}${queryStr} ${status} ${duration}ms [ReqID: ${req.id || "N/A"}]`;
      if (status >= 500) {
        console.error(logMsg);
      } else if (status >= 400) {
        console.warn(logMsg);
      } else if (process.env.NODE_ENV === "development") {
        console.log(logMsg);
      }
    }
  });

  next();
}

module.exports = requestLogger;
