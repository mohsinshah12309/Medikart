/**
 * SMTP Email Integration — Phase 12.
 *
 * Uses nodemailer transport configured from environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 *
 * Wraps email delivery in a try-catch to throw a typed error without
 * crashing or leaking credentials.
 */

const nodemailer = require("nodemailer");
const { AppError } = require("../utils/errors");

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "localhost";
    const port = parseInt(process.env.SMTP_PORT || "2525", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const auth = user && pass ? { user, pass } : undefined;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth,
      // For development/mailtrap local testing:
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

/**
 * Sends an email using the configured SMTP transport.
 *
 * @param {Object} options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject line
 * @param {String} options.text - Plain text content
 * @param {String} [options.html] - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.NODE_ENV === "test") {
    // In test environment, skip external network call to prevent third-party SMTP rate limits
    return { messageId: "test-mock-id", accepted: [to] };
  }

  try {
    const from = process.env.SMTP_FROM || "noreply@medikart.pk";
    const mailOptions = {
      from,
      to,
      subject,
      text,
      html: html || text,
    };

    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Email delivery failed:", error.message);
    throw new AppError(`Failed to send email: ${error.message}`, 500);
  }
};


module.exports = {
  sendEmail,
};
