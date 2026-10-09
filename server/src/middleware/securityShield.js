/**
 * securityShield.js
 *
 * Middleware for:
 *   1. Enforcing HTTPS in production (Cloudflare / reverse proxy SSL termination)
 *   2. Real Client IP extraction and normalisation
 *   3. Detecting & blocking automated vulnerability scanners, path traversal probes, and NoSQL injection attempts
 *   4. Logging suspicious traffic patterns to the security audit trail
 */

const { getClientIp, logSecurityAlert } = require("../utils/securityLogger");

// Known vulnerability scanner / malicious exploit paths
const SUSPICIOUS_PATH_PATTERNS = [
  /\/\.env(\.|$)/i,
  /\/\.git(\/|$)/i,
  /\/wp-(admin|login|content|includes)/i,
  /\/xmlrpc\.php/i,
  /\/phpmyadmin/i,
  /\/pma(\/|$)/i,
  /\/actuator(\/|$)/i,
  /\/\.aws(\/|$)/i,
  /\/\.ssh(\/|$)/i,
  /\/etc\/passwd/i,
  /\.(bak|backup|sql|tar|gz|zip|swp|ini|conf)$/i,
];

// Suspicious query / payload injection signatures
const INJECTION_PATTERNS = [
  /\b(\$where|\$regex|\$gt|\$ne|\$nin|\$expr)\b/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /javascript:[^\n]+/i,
  /union\s+select/i,
];

function securityShield(req, res, next) {
  // 1. Normalize client IP
  req.clientIp = getClientIp(req);

  // 2. Enforce HTTPS in production behind Cloudflare / Reverse Proxy
  if (process.env.NODE_ENV === "production") {
    const isLoopback =
      req.hostname === "localhost" ||
      req.hostname === "127.0.0.1" ||
      req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.clientIp === "127.0.0.1" ||
      req.clientIp === "::1";

    const isHttps =
      isLoopback ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https" ||
      req.headers["cf-visitor"]?.includes('"scheme":"https"');

    // Skip health check and internal loopback probes from HTTP enforcement
    if (!isHttps && req.path !== "/health") {
      const host = req.headers.host || "medikart.pk";
      const secureUrl = `https://${host}${req.originalUrl || req.url}`;
      return res.redirect(301, secureUrl);
    }
  }

  const pathUrl = req.originalUrl || req.url || "";

  // 3. Path Traversal Detection (e.g., ../ or %2e%2e%2f)
  if (
    pathUrl.includes("..") ||
    pathUrl.includes("%2e%2e") ||
    pathUrl.includes("%2E%2E")
  ) {
    logSecurityAlert({
      alertType: "PATH_TRAVERSAL_ATTEMPT",
      message: `Path traversal pattern detected in request URL: ${pathUrl}`,
      req,
    });
    return res.status(403).json({
      status: "error",
      message: "Access Denied: Invalid request path",
    });
  }

  // 4. Known Scanner / Exploit Probing Detection
  for (const pattern of SUSPICIOUS_PATH_PATTERNS) {
    if (pattern.test(pathUrl)) {
      logSecurityAlert({
        alertType: "SCANNER_PROBE",
        message: `Vulnerability scanner target probed: ${pathUrl}`,
        req,
      });
      return res.status(403).json({
        status: "error",
        message: "Forbidden",
      });
    }
  }

  // 5. Query Parameter Injection Scanning
  const queryString = req.url.includes("?") ? req.url.split("?")[1] : "";
  if (queryString) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(queryString)) {
        logSecurityAlert({
          alertType: "INJECTION_PROBE",
          message: `Suspicious injection pattern detected in query string`,
          req,
          details: { query: queryString },
        });
        return res.status(400).json({
          status: "error",
          message: "Bad Request: Malformed query parameters",
        });
      }
    }
  }

  next();
}

module.exports = securityShield;
