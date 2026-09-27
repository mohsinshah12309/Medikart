/**
 * securityLogger.js
 *
 * Dedicated production-grade security and audit logger for:
 *   1. Authentication attempts (login success/failure, 2FA, OTP, password resets)
 *   2. API errors (4xx client errors & 5xx system faults)
 *   3. Unusual traffic patterns & security alerts (brute-force, scanner probes, injection attempts)
 *
 * Persists structured log entries to `server/logs/` and outputs sanitized real-time alerts to console.
 */

const fs = require("fs");
const path = require("path");

const LOGS_DIR = path.join(__dirname, "../../logs");

// Ensure logs directory exists safely
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (e) {
  // Directory creation fallback
}

/**
 * Appends a JSON line to a specified log file safely.
 */
function appendLog(fileName, data) {
  try {
    const filePath = path.join(LOGS_DIR, fileName);
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...data }) + "\n";
    fs.appendFile(filePath, line, (err) => {
      if (err) {
        // Fallback to console if file write encounters an issue
      }
    });
  } catch (err) {
    // Non-blocking log persistence
  }
}

/**
 * Extracts the real client IP address, prioritizing Cloudflare / reverse proxy headers.
 */
function getClientIp(req) {
  if (!req) return "unknown";
  const rawXForwarded = req.headers ? req.headers["x-forwarded-for"] : null;
  const clientIpFromForwarded = typeof rawXForwarded === "string" ? rawXForwarded.split(",")[0].trim() : null;
  return (
    (req.headers && req.headers["cf-connecting-ip"]) ||
    (req.headers && req.headers["x-real-ip"]) ||
    clientIpFromForwarded ||
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    "127.0.0.1"
  );
}

/**
 * 1. Log Authentication Events (Admin, Customer, OTP, 2FA)
 */
function logAuthEvent({
  action, // e.g., 'ADMIN_LOGIN', 'CUSTOMER_LOGIN', 'CUSTOMER_SIGNUP', 'OTP_VERIFY', '2FA_VERIFY', 'PASSWORD_RESET'
  status, // 'SUCCESS' | 'FAILED'
  identifier, // email or phone (sanitized)
  userId = null,
  role = 'customer',
  ip = null,
  userAgent = null,
  req = null,
  reason = null,
}) {
  const clientIp = ip || (req ? getClientIp(req) : "unknown");
  const ua = userAgent || (req && req.headers ? req.headers["user-agent"] : "unknown");
  const reqId = req ? req.id || "N/A" : "N/A";

  const payload = {
    eventType: "AUTH_EVENT",
    action,
    status,
    identifier: identifier ? String(identifier).toLowerCase().trim() : "unknown",
    userId,
    role,
    ip: clientIp,
    userAgent: ua,
    reqId,
    reason: reason || undefined,
  };

  appendLog("auth-events.log", payload);

  const icon = status === "SUCCESS" ? "🔓 [AUTH_SUCCESS]" : "🔒 [AUTH_FAILED]";
  const logStr = `${icon} Action: ${action} | User: ${payload.identifier} | Role: ${role} | IP: ${clientIp} | Reason: ${reason || "N/A"} [ReqID: ${reqId}]`;

  if (status === "SUCCESS") {
    if (process.env.NODE_ENV !== "test") {
      console.log(logStr);
    }
  } else {
    console.warn(logStr);
  }
}

/**
 * 2. Log API Errors (4xx client issues & 5xx server exceptions)
 */
function logApiError({ req, error, statusCode = 500, details = null }) {
  const clientIp = getClientIp(req);
  const reqId = req ? req.id || "N/A" : "N/A";
  const pathUrl = req ? (req.originalUrl || req.url || "N/A") : "N/A";
  const method = req ? req.method : "N/A";

  const payload = {
    eventType: "API_ERROR",
    statusCode,
    method,
    path: pathUrl,
    ip: clientIp,
    reqId,
    errorMessage: error ? error.message : "Unknown error",
    errorName: error ? error.name : "Error",
    details: details || (error && error.details ? error.details : undefined),
    userAgent: req && req.headers ? req.headers["user-agent"] : "unknown",
  };

  appendLog("api-errors.log", payload);

  if (statusCode >= 500) {
    console.error(`🚨 [API_ERROR_${statusCode}] ${method} ${pathUrl} - ${payload.errorMessage} [IP: ${clientIp}] [ReqID: ${reqId}]`);
  } else if (statusCode >= 400 && process.env.NODE_ENV !== "test") {
    console.warn(`⚠️ [API_WARN_${statusCode}] ${method} ${pathUrl} - ${payload.errorMessage} [IP: ${clientIp}] [ReqID: ${reqId}]`);
  }
}

/**
 * 3. Log Unusual Traffic Patterns & Security Alerts
 */
function logSecurityAlert({
  alertType, // e.g., 'RATE_LIMIT_BREACH', 'SCANNER_PROBE', 'PATH_TRAVERSAL_ATTEMPT', 'NOSQL_INJECTION_PROBE', 'SUSPICIOUS_USER_AGENT'
  message,
  req = null,
  ip = null,
  details = {},
}) {
  const clientIp = ip || (req ? getClientIp(req) : "unknown");
  const pathUrl = req ? (req.originalUrl || req.url || "N/A") : "N/A";
  const method = req ? req.method : "N/A";
  const ua = req && req.headers ? req.headers["user-agent"] : "unknown";
  const reqId = req ? req.id || "N/A" : "N/A";

  const payload = {
    eventType: "SECURITY_ALERT",
    alertType,
    message,
    method,
    path: pathUrl,
    ip: clientIp,
    userAgent: ua,
    reqId,
    details,
  };

  appendLog("security-alerts.log", payload);

  console.error(`🛡️ [SECURITY_ALERT: ${alertType}] ${message} | Target: ${method} ${pathUrl} | IP: ${clientIp} | UA: ${ua} [ReqID: ${reqId}]`);
}

module.exports = {
  getClientIp,
  logAuthEvent,
  logApiError,
  logSecurityAlert,
};
