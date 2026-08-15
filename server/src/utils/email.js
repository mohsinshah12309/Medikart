/**
 * Email utility — Phase 6.
 *
 * Reusable nodemailer SMTP transport. Reads credentials from .env — never
 * hardcoded. Used by:
 *   - Phase 6  : admin password reset
 *   - Phase 12 : customer OTP (will import sendEmail from here)
 *
 * sendEmail() throws on transport failure so the caller can decide how to
 * handle it (log + silently succeed for forgot-password enumeration safety,
 * or propagate the error for critical flows).
 */

const nodemailer = require("nodemailer");

// Build transport once at module load time; reused across calls.
// All config comes from .env — never fall back to hardcoded defaults.
const createTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP configuration is incomplete. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env"
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

/**
 * Send an email.
 *
 * @param {object} options
 * @param {string} options.to      - recipient email
 * @param {string} options.subject - email subject line
 * @param {string} options.html    - HTML body
 * @param {string} [options.text]  - plain-text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transport = createTransport();

  const from = process.env.SMTP_FROM || "noreply@medikart.pk";

  await transport.sendMail({ from, to, subject, html, text });
};

module.exports = { sendEmail };
