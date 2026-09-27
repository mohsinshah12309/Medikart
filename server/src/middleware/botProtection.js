/**
 * botProtection.js
 *
 * Dedicated anti-bot, anti-scraping, and abuse mitigation middleware.
 *
 * Features:
 *   1. Blocks known malicious scrapers, automated vulnerability scanners, and exploit toolkits.
 *   2. Enforces User-Agent presence on state-mutating requests (POST, PUT, PATCH, DELETE).
 *   3. Detects automated rapid scraping patterns and flags suspicious pagination iterations.
 *   4. Validates anti-bot honeypot fields on form submissions.
 *   5. Emits structured security audit logs for all blocked automated activities.
 */

const { logSecurityAlert } = require("../utils/securityLogger");

// Known bad bot and automated tool User-Agent signatures (case-insensitive)
const BAD_BOT_USER_AGENTS = [
  /\b(sqlmap|nikto|wpscan|dirbuster|gobuster|masscan|zgrab|shodan|censys|nmap|acunetix|havij|w3af)\b/i,
  /\b(scrapy|mechanize|aiohttp|go-http-client|apache-httpclient|libwww-perl|python-urllib|httpclient)\b/i,
  /\b(phantomjs|headlesschrome\/0\.|selenium|puppeteer)\b/i,
];

// Legitimate search crawlers allowed only on public GET requests
const SEARCH_ENGINE_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
];

// In-memory sliding window for scraping anomaly tracking (IP -> timestamp array)
const ipRequestHistory = new Map();
const SCRAPING_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PUBLIC_GETS_PER_MINUTE = 150; // Threshold for suspicious automated scraping

function botProtection(req, res, next) {
  // Always skip in test environment to avoid breaking synthetic test runners
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const userAgent = req.headers["user-agent"] || "";
  const clientIp = req.clientIp || req.ip || "127.0.0.1";
  const pathUrl = req.originalUrl || req.url || "";
  const isGet = req.method === "GET";

  // 1. Check for known malicious tools and exploit scrapers
  for (const botRegex of BAD_BOT_USER_AGENTS) {
    if (botRegex.test(userAgent)) {
      logSecurityAlert({
        alertType: "BAD_BOT_BLOCKED",
        message: `Malicious bot/scraper blocked by User-Agent: ${userAgent}`,
        req,
        details: { userAgent, matchedPattern: botRegex.toString() },
      });
      return res.status(403).json({
        status: "error",
        message: "Access Denied: Automated tools are not permitted.",
      });
    }
  }

  // 2. Prevent search bots from hitting mutating endpoints or private routes
  if (!isGet) {
    for (const botRegex of SEARCH_ENGINE_BOTS) {
      if (botRegex.test(userAgent)) {
        logSecurityAlert({
          alertType: "BOT_MUTATION_ATTEMPT",
          message: `Crawler attempted non-GET mutation on ${pathUrl}`,
          req,
        });
        return res.status(403).json({
          status: "error",
          message: "Crawlers cannot perform state-modifying requests.",
        });
      }
    }

    // 3. User-Agent requirement for interactive forms/APIs
    if (!userAgent || userAgent.trim().length < 5) {
      logSecurityAlert({
        alertType: "EMPTY_USER_AGENT",
        message: `Mutation request rejected due to missing/empty User-Agent`,
        req,
      });
      return res.status(400).json({
        status: "error",
        message: "Bad Request: Valid User-Agent is required.",
      });
    }
  }

  // 4. Honeypot check on POST/PUT requests (silent bot drop)
  if (req.body && typeof req.body === "object") {
    const honeypotFields = ["_gotcha", "website_hp", "hp_check", "honeypot"];
    for (const field of honeypotFields) {
      if (req.body[field] && String(req.body[field]).trim().length > 0) {
        logSecurityAlert({
          alertType: "HONEYPOT_TRIGGERED",
          message: `Bot triggered hidden honeypot field: ${field}`,
          req,
          details: { honeypotField: field, value: req.body[field] },
        });
        // Return 200 OK so the bot thinks it succeeded, but drop processing
        return res.status(200).json({
          status: "success",
          message: "Request received",
        });
      }
    }
  }

  // 5. Automated Rapid Catalog / API Scraping Detection
  if (isGet && (pathUrl.startsWith("/api/v1/products") || pathUrl.startsWith("/api/v1/categories") || pathUrl.startsWith("/api/v1/blogs"))) {
    const now = Date.now();
    let history = ipRequestHistory.get(clientIp);
    if (!history) {
      history = [];
      ipRequestHistory.set(clientIp, history);
    }

    // Prune requests older than window
    const cutoff = now - SCRAPING_WINDOW_MS;
    while (history.length > 0 && history[0] < cutoff) {
      history.shift();
    }

    history.push(now);

    // If request frequency exceeds threshold, flag scraping anomaly and throttle
    if (history.length > MAX_PUBLIC_GETS_PER_MINUTE) {
      logSecurityAlert({
        alertType: "SCRAPING_ANOMALY_DETECTED",
        message: `High frequency data scraping detected (${history.length} req/min)`,
        req,
        details: { requestCount: history.length, path: pathUrl },
      });

      return res.status(429).json({
        status: "error",
        message: "High request volume detected. Please slow down your browsing.",
      });
    }

    // Clean up memory cache periodically
    if (ipRequestHistory.size > 10000) {
      ipRequestHistory.clear();
    }
  }

  next();
}

module.exports = botProtection;
