/**
 * Environment configuration validator — Phase 24.
 *
 * Validates critical environment variables in production mode.
 * Throws a clear error if requirements are not met, allowing the caller to
 * crash the process safely during startup.
 */

function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";

  // Always check JWT_SECRET exists and is safe if we are not in test env
  if (process.env.NODE_ENV !== "test") {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing from the environment");
    }

    const weakSecrets = [
      "secret",
      "changeme",
      "development-secret",
      "development",
      "replace_with_strong_random_secret"
    ];

    if (weakSecrets.includes(secret.trim().toLowerCase()) || secret.trim().length < 32) {
      throw new Error("JWT_SECRET is insecure. Must be at least 32 characters and cannot be a default fallback secret.");
    }
  }

  if (!isProd) {
    return; // Skip full validation for non-production environments
  }

  // Production-only strict validations
  const criticalVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "KUICKPAY_BASE_URL",
    "KUICKPAY_MERCHANT_ID",
    "KUICKPAY_API_KEY",
    "GOOGLE_SHEETS_CLIENT_EMAIL",
    "GOOGLE_SHEETS_PRIVATE_KEY",
    "GOOGLE_SHEETS_SHEET_ID"
  ];

  const missing = [];
  for (const v of criticalVars) {
    if (!process.env[v] || process.env[v].trim() === "") {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing critical production environment variables: ${missing.join(", ")}`);
  }
}

module.exports = { validateEnv };
