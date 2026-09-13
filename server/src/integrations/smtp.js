/**
 * Email Integration — Mailjet Send API v3.1.
 *
 * Drop-in replacement for the previous nodemailer/SMTP transporter.
 * Exports the same `sendEmail({ to, subject, text, html, attachments })`
 * interface so all callers (customer.service.js, otp.service.js, etc.)
 * require zero changes.
 *
 * Environment variables (same keys already in .env):
 *   MAILJET_API_KEY        — Mailjet public API key
 *   MAILJET_API_SECRET     — Mailjet secret API key
 *   MAILJET_SENDER_EMAIL   — Verified sender address
 *   MAILJET_SENDER_NAME    — Display name shown in email clients
 *
 * Fallback behaviour:
 *   - NODE_ENV === "test" → skips real send, returns mock result (unchanged).
 *   - Missing credentials → logs a warning and returns mock result so the app
 *     boots cleanly in environments where email isn't configured yet.
 */

const Mailjet = require("node-mailjet");
const { AppError } = require("../utils/errors");

let _client = null;

/**
 * Lazily initialise and cache the Mailjet API client.
 * Returns null if credentials are not configured.
 */
function getClient() {
  if (_client) return _client;

  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  _client = Mailjet.apiConnect(apiKey, apiSecret);
  return _client;
}

/**
 * Send an email via the Mailjet Send API v3.1.
 *
 * @param {Object}   options
 * @param {string}   options.to          - Recipient email address
 * @param {string}   options.subject     - Email subject line
 * @param {string}   options.text        - Plain-text body (required fallback)
 * @param {string}   [options.html]      - HTML body (used if provided)
 * @param {Array}    [options.attachments] - Ignored (Mailjet attachments use
 *                                          a different format; extend as needed)
 * @returns {Promise<{ messageId: string, accepted: string[] }>}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // ── Test environment: skip real network call ──────────────────────────────
  if (process.env.NODE_ENV === "test") {
    return { messageId: "test-mock-id", accepted: [to] };
  }

  const client = getClient();

  // ── Credentials not configured: warn but do not crash the app ─────────────
  if (!client) {
    console.warn(
      `[smtp] Mailjet credentials not configured — skipping email to ${to}. ` +
        "Set MAILJET_API_KEY and MAILJET_API_SECRET in .env to enable email delivery."
    );
    return { messageId: "no-credentials-skipped", accepted: [] };
  }

  const senderEmail =
    process.env.MAILJET_SENDER_EMAIL || "noreply@medikart.pk";
  const senderName =
    process.env.MAILJET_SENDER_NAME || "Medikart";

  try {
    const result = await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: senderName,
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          TextPart: text,
          HTMLPart: html || text,
        },
      ],
    });

    const msgStatus = result?.body?.Messages?.[0]?.Status;
    const msgId =
      result?.body?.Messages?.[0]?.To?.[0]?.MessageID ||
      result?.body?.Messages?.[0]?.MessageID ||
      "unknown";

    console.log(
      `[smtp] Email sent via Mailjet to ${to} — subject: "${subject}" — status: ${msgStatus}`
    );

    return { messageId: String(msgId), accepted: [to] };
  } catch (error) {
    const detail =
      error?.response?.data?.ErrorMessage ||
      error?.ErrorMessage ||
      error?.message ||
      "Unknown Mailjet error";

    console.error(`[smtp] Mailjet delivery failed to ${to}:`, detail);
    throw new AppError(`Failed to send email: ${detail}`, 500);
  }
};

module.exports = { sendEmail };
