/**
 * Email Integration — Intelligent Multi-Provider Router.
 *
 * Implements dedicated traffic segregation with automatic cross-provider fallback:
 * 1. Google SMTP: OTP Verification & Order Placed Receipts (Highest Primary Inbox Deliverability).
 * 2. Brevo SMTP: Order Confirmation & Shipping Updates (Authenticated Domain Relay).
 * 3. Mailjet API: Password Resets, Order Cancellations & Chronic Refill Alerts.
 *
 * High Availability:
 * - If the designated primary provider fails or hits daily quota, it automatically
 *   cascades to the remaining available providers so zero emails are dropped.
 */

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Mailjet = require("node-mailjet");
const { AppError } = require("../utils/errors");

let _gmailTransporter = null;
let _brevoTransporter = null;
let _mailjetClient = null;

/**
 * Lazily initialize and cache the Google Gmail SMTP transporter.
 */
function getGmailTransporter() {
  if (_gmailTransporter) return _gmailTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  _gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return _gmailTransporter;
}

/**
 * Lazily initialize and cache the Brevo SMTP transporter.
 */
function getBrevoTransporter() {
  if (_brevoTransporter) return _brevoTransporter;

  const host = process.env.BREVO_HOST || process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const user = process.env.BREVO_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_PASS || process.env.SMTP_PASS;
  const port = parseInt(process.env.BREVO_PORT || process.env.SMTP_PORT || "587", 10);

  if (!host || !user || !pass) {
    return null;
  }

  _brevoTransporter = nodemailer.createTransport({
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

  return _brevoTransporter;
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
 * Send via Google SMTP Transporter.
 */
async function sendViaGmail({ to, subject, text, html, senderName, headers }) {
  const transporter = getGmailTransporter();
  if (!transporter) throw new Error("Google SMTP credentials not configured");

  const fromEmail = process.env.GMAIL_USER || "medikart.com@gmail.com";
  const info = await transporter.sendMail({
    from: `"${senderName}" <${fromEmail}>`,
    to,
    replyTo: fromEmail,
    subject,
    text,
    html: html || text,
    headers,
  });

  console.log(`[smtp:google] Delivered via Google SMTP to ${to} — messageId: ${info.messageId}`);
  return { messageId: String(info.messageId), accepted: [to], provider: "google" };
}

/**
 * Send via Brevo SMTP Relay.
 */
async function sendViaBrevo({ to, subject, text, html, senderName, headers, fromEmail }) {
  const transporter = getBrevoTransporter();
  if (!transporter) throw new Error("Brevo SMTP credentials not configured");

  const sender = fromEmail || process.env.BREVO_FROM || process.env.SMTP_FROM || "noreply@medikart.pk";
  const info = await transporter.sendMail({
    from: `"${senderName}" <${sender}>`,
    to,
    replyTo: sender,
    subject,
    text,
    html: html || text,
    headers,
  });

  console.log(`[smtp:brevo] Delivered via Brevo SMTP to ${to} — messageId: ${info.messageId}`);
  return { messageId: String(info.messageId), accepted: [to], provider: "brevo" };
}

/**
 * Send via Mailjet API v3.1.
 */
async function sendViaMailjet({ to, subject, text, html, senderName, headers, fromEmail }) {
  const client = getMailjetClient();
  if (!client) throw new Error("Mailjet API credentials not configured");

  const sender = fromEmail || process.env.MAILJET_SENDER_EMAIL || process.env.SMTP_FROM || "noreply@medikart.pk";
  const result = await client.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: sender,
          Name: senderName,
        },
        To: [{ Email: to }],
        ReplyTo: {
          Email: sender,
          Name: senderName,
        },
        Subject: subject,
        TextPart: text,
        HTMLPart: html || text,
        TrackOpens: "disabled",
        TrackClicks: "disabled",
        Headers: headers,
      },
    ],
  });

  const msgStatus = result?.body?.Messages?.[0]?.Status;
  const msgId = result?.body?.Messages?.[0]?.To?.[0]?.MessageID || result?.body?.Messages?.[0]?.MessageID || "unknown";

  console.log(`[smtp:mailjet] Delivered via Mailjet API to ${to} — status: ${msgStatus} — messageId: ${msgId}`);
  return { messageId: String(msgId), accepted: [to], provider: "mailjet" };
}

/**
 * Multi-Provider Email Router Dispatcher.
 *
 * @param {Object}   options
 * @param {string}   options.to          - Recipient email address
 * @param {string}   options.subject     - Email subject line
 * @param {string}   options.text        - Plain-text body
 * @param {string}   [options.html]      - HTML body
 * @param {string}   [options.fromName]  - Sender display name
 * @param {string}   [options.fromEmail] - Sender email override
 * @param {string}   [options.purpose]   - 'otp' | 'order_placed' | 'order_confirmed' | 'order_cancelled' | 'password_reset' | 'refill'
 * @returns {Promise<{ messageId: string, accepted: string[], provider: string }>}
 */
const sendEmail = async ({ to, subject, text, html, fromName, fromEmail, purpose = "general" }) => {
  if (process.env.NODE_ENV === "test") {
    return { messageId: "test-mock-id", accepted: [to], provider: "mock" };
  }

  const senderName = fromName || "Medikart Pharmacy";
  const entityRefId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

  // Clean, spam-safe transactional headers (no spam-score penalty headers)
  const transactionalHeaders = {
    "X-Entity-Ref-ID": entityRefId,
  };

  const payload = { to, subject, text, html, senderName, fromEmail, headers: transactionalHeaders };

  // Define multi-provider routing hierarchy based on traffic segregation rules:
  // 1. OTP & Order Placed -> Google SMTP (primary) -> Brevo -> Mailjet
  // 2. Order Confirmed / Shipped -> Brevo SMTP (primary) -> Google SMTP -> Mailjet
  // 3. Password Reset / Order Cancelled / Refill -> Mailjet (primary) -> Brevo -> Google SMTP
  let providersQueue = [];

  const normPurpose = String(purpose).toLowerCase();
  if (normPurpose.includes("otp") || normPurpose.includes("order_placed") || normPurpose.includes("placed")) {
    providersQueue = [
      { name: "google", fn: () => sendViaGmail(payload) },
      { name: "brevo", fn: () => sendViaBrevo(payload) },
      { name: "mailjet", fn: () => sendViaMailjet(payload) },
    ];
  } else if (normPurpose.includes("confirm") || normPurpose.includes("ship")) {
    providersQueue = [
      { name: "brevo", fn: () => sendViaBrevo(payload) },
      { name: "google", fn: () => sendViaGmail(payload) },
      { name: "mailjet", fn: () => sendViaMailjet(payload) },
    ];
  } else if (normPurpose.includes("password") || normPurpose.includes("cancel") || normPurpose.includes("refill")) {
    providersQueue = [
      { name: "mailjet", fn: () => sendViaMailjet(payload) },
      { name: "brevo", fn: () => sendViaBrevo(payload) },
      { name: "google", fn: () => sendViaGmail(payload) },
    ];
  } else {
    // Default fallback order
    providersQueue = [
      { name: "google", fn: () => sendViaGmail(payload) },
      { name: "brevo", fn: () => sendViaBrevo(payload) },
      { name: "mailjet", fn: () => sendViaMailjet(payload) },
    ];
  }

  const errors = [];
  for (const provider of providersQueue) {
    try {
      const result = await provider.fn();
      return result;
    } catch (err) {
      console.warn(`[smtp:${provider.name}] Attempt failed for ${to} (${purpose}): ${err.message}. Trying next provider...`);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  console.error(`[smtp] All email delivery providers failed for ${to}:`, errors);
  throw new AppError(`All email delivery methods failed (${errors.join("; ")})`, 500);
};

module.exports = {
  sendEmail,
  sendViaGmail,
  sendViaBrevo,
  sendViaMailjet,
};
