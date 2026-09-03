/**
 * emailPrecheck.js — Email Pre-Check Gate.
 *
 * Lightweight pre-check BEFORE sending OTP emails:
 * 1. Syntax + Format check (Zod boundary validation)
 * 2. Common typo detection on popular email provider domains with suggestion response
 * 3. DNS MX record validation (verifies the domain can actually receive mail)
 * 4. Safe failure posture: transient DNS lookup failures do NOT block legitimate users
 */

const dns = require("dns").promises;

// Small static list of common typos for major email providers
const COMMON_DOMAIN_TYPOS = {
  // Gmail typos
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.co": "gmail.com",
  "gmail.co": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmaio.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.coom": "gmail.com",
  "gmail.cpm": "gmail.com",
  "gmai.co": "gmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahu.com": "yahoo.com",
  "ymail.con": "ymail.com",
  "yahoomail.com": "yahoo.com",

  // Hotmail / Outlook typos
  "hotmial.com": "hotmail.com",
  "hotmale.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outluuk.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",

  // iCloud typos
  "iclou.com": "icloud.com",
  "icloud.con": "icloud.com",
  "icoud.com": "icloud.com",

  // Pakistani ISP / common typos
  "nayatel.con": "nayatel.com",
  "ptcl.con": "ptcl.net",
};

/**
 * Check if the email's domain matches a known common typo.
 *
 * @param {string} email
 * @returns {{ hasTypo: boolean, suggestedEmail: string, suggestedDomain: string, originalEmail: string, message: string } | null}
 */
const checkDomainTypo = (email) => {
  if (!email || typeof email !== "string") return null;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return null;

  const [localPart, domain] = parts;
  const suggestedDomain = COMMON_DOMAIN_TYPOS[domain];

  if (suggestedDomain) {
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    return {
      hasTypo: true,
      originalEmail: email.trim().toLowerCase(),
      suggestedEmail,
      suggestedDomain,
      message: `Did you mean ${suggestedEmail}?`,
    };
  }

  return null;
};

/**
 * Perform a DNS MX record lookup on the domain.
 *
 * @param {string} domain
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<{ valid: boolean, reason?: string, error?: string, skipped?: boolean, message?: string, records?: Array }>}
 */
const checkMxRecord = async (domain, timeoutMs = 5000) => {
  if (!domain || typeof domain !== "string") {
    return {
      valid: false,
      reason: "INVALID_DOMAIN",
      message: "Invalid domain specified in email address.",
    };
  }

  const normalizedDomain = domain.trim().toLowerCase();

  // Whitelist test domains during tests unless explicitly testing MX failure
  if (
    process.env.NODE_ENV === "test" &&
    (normalizedDomain === "test.com" || normalizedDomain === "example.com") &&
    process.env.TEST_MX_FORCE_CHECK !== "true"
  ) {
    return { valid: true, skipped: true, reason: "TEST_ENVIRONMENT_BYPASS" };
  }

  try {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const timeoutError = new Error("DNS_TIMEOUT");
        timeoutError.code = "ETIMEDOUT";
        reject(timeoutError);
      }, timeoutMs);
      if (typeof timer.unref === "function") timer.unref();
    });

    const records = await Promise.race([
      dns.resolveMx(normalizedDomain),
      timeoutPromise,
    ]).finally(() => {
      if (timer) clearTimeout(timer);
    });

    if (!records || records.length === 0) {
      return {
        valid: false,
        reason: "NO_MX_RECORDS",
        message: `The domain "${normalizedDomain}" has no MX records and cannot receive emails.`,
      };
    }

    // RFC 7505: Check for Null MX ("." or empty exchange)
    const hasValidExchange = records.some(
      (r) => r.exchange && r.exchange.trim() !== "" && r.exchange.trim() !== "."
    );

    if (!hasValidExchange) {
      return {
        valid: false,
        reason: "NULL_MX_RECORD",
        message: `The domain "${normalizedDomain}" does not accept email (Null MX record).`,
      };
    }

    return { valid: true, records };
  } catch (err) {
    // ENOTFOUND / ENODATA / EBADNAME / NODATA: Definitive proof the domain has no MX records
    if (
      err.code === "ENOTFOUND" ||
      err.code === "ENODATA" ||
      err.code === "EBADNAME" ||
      err.code === "NODATA"
    ) {
      return {
        valid: false,
        reason: err.code,
        message: `The domain "${normalizedDomain}" cannot receive email (no MX records found).`,
      };
    }

    // Transient DNS network issues or timeouts: DO NOT BLOCK the user (fail open)
    console.warn(
      `[emailPrecheck] Transient DNS MX lookup error for domain "${normalizedDomain}": ${err.message}. Proceeding without blocking.`
    );
    return {
      valid: true,
      skipped: true,
      reason: "DNS_LOOKUP_TRANSIENT_ERROR",
      error: err.message,
    };
  }
};

/**
 * Full precheck pipeline for an email before sending OTP.
 *
 * @param {string} email
 * @param {object} [options]
 * @param {boolean} [options.overrideSuggestion=false]
 * @returns {Promise<{ valid: boolean, needsConfirmation?: boolean, suggestion?: string, suggestedDomain?: string, originalEmail?: string, message?: string, reason?: string }>}
 */
const validateEmailPrecheck = async (email, options = {}) => {
  const normalized = (email || "").trim().toLowerCase();
  const parts = normalized.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      valid: false,
      message: "Valid email address is required.",
    };
  }

  const [_, domain] = parts;

  // 1. Typo Check (unless user explicitly confirmed/overrode suggestion)
  if (!options.overrideSuggestion) {
    const typoResult = checkDomainTypo(normalized);
    if (typoResult && typoResult.hasTypo) {
      return {
        valid: false,
        needsConfirmation: true,
        suggestion: typoResult.suggestedEmail,
        suggestedDomain: typoResult.suggestedDomain,
        originalEmail: typoResult.originalEmail,
        message: typoResult.message,
      };
    }
  }

  // 2. DNS MX Record Check
  const mxResult = await checkMxRecord(domain);
  if (!mxResult.valid) {
    return {
      valid: false,
      reason: mxResult.reason,
      message:
        mxResult.message ||
        `The domain "${domain}" cannot receive emails. Please check your email address.`,
    };
  }

  return { valid: true };
};

module.exports = {
  COMMON_DOMAIN_TYPOS,
  checkDomainTypo,
  checkMxRecord,
  validateEmailPrecheck,
};
