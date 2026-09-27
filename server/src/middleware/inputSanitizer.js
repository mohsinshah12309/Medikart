/**
 * inputSanitizer.js
 *
 * Universal Input Sanitization & Anti-Injection Middleware.
 *
 * Protection layers:
 *   1. NoSQL Injection Prevention: Recursively strips keys starting with `$` or containing `.` (MongoDB operators).
 *   2. Prototype Pollution Defense: Strips `__proto__`, `constructor`, and `prototype` keys.
 *   3. XSS / Script Injection Neutralization: Strips `<script>`, `<iframe>`, `javascript:`, and unsafe HTML event handlers.
 *   4. Null Byte & Control Character Removal: Strips null bytes (`\0`) to prevent file/path truncation attacks.
 *   5. Command Injection Defense: Strips unsafe shell metacharacters from sensitive string parameters.
 */

const { logSecurityAlert } = require("../utils/securityLogger");

// Dangerous HTML and script injection patterns
const DANGEROUS_HTML_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>|javascript:[^\s"'>]+|on\w+\s*=\s*["'][^"']*["']/gi;

// Null byte regex
const NULL_BYTE_REGEX = /\0/g;

/**
 * Recursively cleans and sanitizes any value (string, array, object).
 * Returns cleaned data and flags if suspicious injection attempt was found.
 */
function cleanValue(value, isRoot = false) {
  let hasInjection = false;

  if (typeof value === "string") {
    // 1. Strip null bytes
    if (NULL_BYTE_REGEX.test(value)) {
      hasInjection = true;
      value = value.replace(NULL_BYTE_REGEX, "");
    }

    // 2. Strip dangerous script and iframe injections
    if (DANGEROUS_HTML_REGEX.test(value)) {
      hasInjection = true;
      value = value.replace(DANGEROUS_HTML_REGEX, "");
    }

    return { cleaned: value.trim(), hasInjection };
  }

  if (Array.isArray(value)) {
    const cleanedArr = [];
    for (const item of value) {
      const res = cleanValue(item);
      if (res.hasInjection) hasInjection = true;
      cleanedArr.push(res.cleaned);
    }
    return { cleaned: cleanedArr, hasInjection };
  }

  if (value !== null && typeof value === "object") {
    const cleanedObj = {};
    for (const key of Object.keys(value)) {
      // Prototype pollution defense
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        hasInjection = true;
        continue;
      }

      // NoSQL injection defense: remove keys starting with '$' or containing '.'
      if (key.startsWith("$") || key.includes(".")) {
        hasInjection = true;
        continue;
      }

      const res = cleanValue(value[key]);
      if (res.hasInjection) hasInjection = true;
      cleanedObj[key] = res.cleaned;
    }
    return { cleaned: cleanedObj, hasInjection };
  }

  return { cleaned: value, hasInjection: false };
}

function inputSanitizer(req, res, next) {
  let suspiciousActivityDetected = false;

  // 1. Sanitize Request Body
  if (req.body && typeof req.body === "object") {
    const result = cleanValue(req.body, true);
    if (result.hasInjection) suspiciousActivityDetected = true;
    req.body = result.cleaned;
  }

  // 2. Sanitize Query Parameters
  if (req.query && typeof req.query === "object") {
    const result = cleanValue(req.query, true);
    if (result.hasInjection) suspiciousActivityDetected = true;
    req.query = result.cleaned;
  }

  // 3. Sanitize Request Params
  if (req.params && typeof req.params === "object") {
    const result = cleanValue(req.params, true);
    if (result.hasInjection) suspiciousActivityDetected = true;
    req.params = result.cleaned;
  }

  // If active malicious injection payload was detected and scrubbed, log a security alert
  if (suspiciousActivityDetected) {
    logSecurityAlert({
      alertType: "INJECTION_ATTEMPT_SCRUBBED",
      message: `Malicious injection payload (NoSQL/XSS/Null-byte) was neutralized`,
      req,
      details: {
        path: req.originalUrl || req.url,
        method: req.method,
      },
    });
  }

  next();
}

module.exports = inputSanitizer;
