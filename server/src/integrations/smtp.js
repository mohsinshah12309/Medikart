/**
 * Email Integration — Mailjet Send API v3.1 & SMTP Fallback Transporter.
 *
 * Enhanced for Primary Inbox Deliverability:
 * 1. Disables click-tracking & open-tracking beacons (prevents spam/phishing filters from flagging OTPs)
 * 2. Injects transactional RFC 3834 & priority headers (Auto-Submitted, X-Priority, Importance)
 * 3. Supports contextual Sender Names ("Medikart Verification" vs "Medikart Healthcare")
 * 4. Dual fallback support: Mailjet API v3.1 primary, Nodemailer / Brevo SMTP secondary fallback
 */

const crypto = require("crypto");
const Mailjet = require("node-mailjet");
const nodemailer = require("nodemailer");
const { AppError } = require("../utils/errors");

let _mailjetClient = null;
let _smtpTransporter = null;

/**
 * Lazily initialise and cache the Mailjet API client.
 */
function getMailjetClient() {
  if (_mailjetClient) return _mailjetClient;

  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  _mailjetClient = Mailjet.apiConnect(apiKey, apiSecret);
  return _mailjetClient;
}

/**
 * Lazily initialise and cache the Nodemailer SMTP transporter (e.g. Brevo or standard SMTP).
 */
function getSmtpTransporter() {
  if (_smtpTransporter) return _smtpTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  if (!host || !user || !pass) {
    return null;
  }

  _smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return _smtpTransporter;
}

/**
 * Send an email via Mailjet or SMTP with high-deliverability transactional headers.
 *
 * @param {Object}   options
 * @param {string}   options.to          - Recipient email address
 * @param {string}   options.subject     - Email subject line
 * @param {string}   options.text        - Plain-text body (required fallback)
 * @param {string}   [options.html]      - HTML body (used if provided)
 * @param {string}   [options.fromName]  - Optional contextual sender display name
 * @param {string}   [options.fromEmail] - Optional sender email override
 * @returns {Promise<{ messageId: string, accepted: string[] }>}
 */
const sendEmail = async ({ to, subject, text, html, fromName, fromEmail }) => {
  // ── Test environment: skip real network call ──────────────────────────────
  if (process.env.NODE_ENV === "test") {
    return { messageId: "test-mock-id", accepted: [to] };
  }

  const senderEmail =
    fromEmail ||
    process.env.MAILJET_SENDER_EMAIL ||
    process.env.SMTP_FROM ||
    "medikart.com@gmail.com";

  const senderName =
    fromName ||
    process.env.MAILJET_SENDER_NAME ||
    "Medikart Verification";

  const entityRefId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

  // High-deliverability headers to guarantee Primary Inbox categorization
  const deliverabilityHeaders = {
    "Auto-Submitted": "auto-generated",
    "X-Auto-Response-Suppress": "All",
    "X-Priority": "1 (Highest)",
    "Priority": "urgent",
    "Importance": "high",
    "X-MSMail-Priority": "High",
    "X-Entity-Ref-ID": entityRefId,
  };

  const mailjetClient = getMailjetClient();

  // 1. Primary path: Mailjet Send API v3.1 with inbox-optimized settings
  if (mailjetClient) {
    try {
      const result = await mailjetClient.post("send", { version: "v3.1" }).request({
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
            ReplyTo: {
              Email: senderEmail,
              Name: senderName,
            },
            Subject: subject,
            TextPart: text,
            HTMLPart: html || text,
            // Disable tracking redirects & pixels so spam filters don't flag transactional OTPs
            TrackOpens: "disabled",
            TrackClicks: "disabled",
            Headers: deliverabilityHeaders,
          },
        ],
      });

      const msgStatus = result?.body?.Messages?.[0]?.Status;
      const msgId =
        result?.body?.Messages?.[0]?.To?.[0]?.MessageID ||
        result?.body?.Messages?.[0]?.MessageID ||
        "unknown";

      console.log(
        `[smtp] Email delivered via Mailjet to ${to} — subject: "${subject}" — status: ${msgStatus}`
      );

      return { messageId: String(msgId), accepted: [to] };
    } catch (error) {
      const detail =
        error?.response?.data?.ErrorMessage ||
        error?.ErrorMessage ||
        error?.message ||
        "Unknown Mailjet error";

      console.warn(`[smtp] Mailjet delivery failed to ${to}: ${detail}. Attempting SMTP fallback...`);
    }
  }

  // 2. Secondary path: SMTP Transporter (Brevo / Relay)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        replyTo: senderEmail,
        subject,
        text,
        html: html || text,
        headers: deliverabilityHeaders,
      });

      console.log(
        `[smtp] Email delivered via SMTP fallback to ${to} — messageId: ${info.messageId}`
      );

      return { messageId: String(info.messageId), accepted: [to] };
    } catch (smtpErr) {
      console.error(`[smtp] SMTP fallback also failed to ${to}:`, smtpErr.message);
      throw new AppError(`Failed to send email: ${smtpErr.message}`, 500);
    }
  }

  // ── No credentials configured at all ──────────────────────────────────────
  if (!mailjetClient && !smtpTransporter) {
    console.warn(
      `[smtp] Neither Mailjet nor SMTP credentials configured — skipping email to ${to}. ` +
        "Set MAILJET_API_KEY & MAILJET_API_SECRET or SMTP_HOST & SMTP_USER in .env."
    );
    return { messageId: "no-credentials-skipped", accepted: [] };
  }

  throw new AppError("All email delivery methods failed.", 500);
};

module.exports = { sendEmail };
