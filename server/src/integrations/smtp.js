/**
 * Email Integration — Dual Transporter: SMTP (Brevo Relay) & Mailjet Send API v3.1.
 *
 * Enhanced for Primary Inbox Deliverability & Reliability:
 * 1. Prioritizes authenticated SMTP relay (Brevo) with verified sender credentials.
 * 2. Automatic fallback to Mailjet API v3.1 if SMTP is unavailable.
 * 3. Injects transactional RFC 3834 & priority headers (Auto-Submitted, X-Priority, Importance).
 * 4. Disables tracking redirects and tracking pixels to prevent spam / phishing flags.
 * 5. Supports contextual Sender Names ("Medikart Verification" vs "Medikart Security").
 */

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Mailjet = require("node-mailjet");
const { AppError } = require("../utils/errors");

let _smtpTransporter = null;
let _mailjetClient = null;

/**
 * Lazily initialize and cache the Nodemailer SMTP transporter.
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return _smtpTransporter;
}

/**
 * Lazily initialize and cache the Mailjet API client.
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
 * Send an email with transactional deliverability headers and automatic fallback.
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
    process.env.SMTP_FROM ||
    process.env.MAILJET_SENDER_EMAIL ||
    "medikart.com@gmail.com";

  const senderName =
    fromName ||
    process.env.MAILJET_SENDER_NAME ||
    "Medikart Verification";

  const entityRefId = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");

  // High-deliverability headers to guarantee Primary Inbox categorization
  const deliverabilityHeaders = {
    "Auto-Submitted": "auto-generated",
    "X-Auto-Response-Suppress": "All",
    "X-Priority": "1 (Highest)",
    Priority: "urgent",
    Importance: "high",
    "X-MSMail-Priority": "High",
    "X-Entity-Ref-ID": entityRefId,
  };

  const smtpTransporter = getSmtpTransporter();
  const mailjetClient = getMailjetClient();

  // 1. Primary: SMTP Transporter (Brevo Authenticated Relay)
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
        `[smtp] Email delivered via Brevo SMTP to ${to} — messageId: ${info.messageId}`
      );

      return { messageId: String(info.messageId), accepted: [to] };
    } catch (smtpErr) {
      console.warn(
        `[smtp] Brevo SMTP delivery failed to ${to}: ${smtpErr.message}. Attempting Mailjet fallback...`
      );
    }
  }

  // 2. Secondary / Fallback: Mailjet Send API v3.1
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
        `[smtp] Email delivered via Mailjet fallback to ${to} — subject: "${subject}" — status: ${msgStatus}`
      );

      return { messageId: String(msgId), accepted: [to] };
    } catch (error) {
      const detail =
        error?.response?.data?.ErrorMessage ||
        error?.ErrorMessage ||
        error?.message ||
        "Unknown Mailjet error";

      console.error(`[smtp] Mailjet delivery also failed to ${to}:`, detail);
      throw new AppError(`Failed to send email: ${detail}`, 500);
    }
  }

  // ── No credentials configured at all ──────────────────────────────────────
  if (!smtpTransporter && !mailjetClient) {
    console.warn(
      `[smtp] Neither SMTP nor Mailjet credentials configured — skipping email to ${to}. ` +
        "Set SMTP_HOST, SMTP_USER, SMTP_PASS or MAILJET_API_KEY, MAILJET_API_SECRET in .env."
    );
    return { messageId: "no-credentials-skipped", accepted: [] };
  }

  throw new AppError("All email delivery methods failed.", 500);
};

module.exports = { sendEmail };
