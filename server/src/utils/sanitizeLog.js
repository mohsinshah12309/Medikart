/**
 * sanitizeLog.js
 *
 * Deep log sanitization utility to prevent sensitive data leakage
 * in logs, activity audit trails, and error dumps.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "currentpassword",
  "confirmpassword",
  "oldpassword",
  "token",
  "temptoken",
  "refreshtoken",
  "accesstoken",
  "jwt",
  "authorization",
  "cookie",
  "set-cookie",
  "twofactorsecret",
  "twofactorcode",
  "otp",
  "verificationcode",
  "secret",
  "secretkey",
  "apikey",
  "apisecret",
  "cvv",
  "cvc",
  "cardnumber",
  "card_number",
  "cardexp",
  "card_exp",
  "cardexpiry",
  "expiry",
  "pan",
]);

const SENSITIVE_SUBSTRINGS = [
  "password",
  "token",
  "secret",
  "cvv",
  "cvc",
  "cardnumber",
  "cardexp",
  "expiry",
  "otp",
  "twofactor",
  "authorization",
  "cookie",
  "apikey",
  "privatekey",
];

/**
 * Recursively sanitize an object, masking all sensitive key values.
 */
function sanitizeSensitiveData(data, depth = 0) {
  if (!data || depth > 8) return data;

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeSensitiveData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

    const isSensitive = SENSITIVE_KEYS.has(normalizedKey) ||
      SENSITIVE_SUBSTRINGS.some((sub) => normalizedKey.includes(sub));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeSensitiveData(value, depth + 1);
    } else if (typeof value === "string") {
      // Check for Bearer tokens in string values
      if (/^bearer\s+[a-zA-Z0-9\-_.]+/i.test(value)) {
        sanitized[key] = "Bearer [REDACTED]";
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeSensitiveData,
};
