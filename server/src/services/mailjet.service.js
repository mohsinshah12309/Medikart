/**
 * Mailjet Email Service — Monthly Refill Section.
 *
 * Dedicated service for all Monthly Refill email communications using Mailjet Send API v3.1:
 *   1. Monthly Refill Order Confirmation (sent upon placing an order from the Monthly Refill section).
 *   2. Scheduled 30-Day Monthly Refill Reminders (sent via monthlyRefillReminder.job).
 *
 * Environment variables:
 *   MAILJET_API_KEY
 *   MAILJET_API_SECRET
 *   MAILJET_SENDER_EMAIL
 *   MAILJET_SENDER_NAME
 *   STOREFRONT_URL
 */

const crypto = require("crypto");
const Mailjet = require("node-mailjet");

let _mailjetClient = null;

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
 * Send an email directly through Mailjet Send API v3.1.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} [options.toName] - Recipient name
 * @param {string} options.subject - Subject line
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
const sendMailjetEmail = async ({ to, toName, subject, text, html }) => {
  if (process.env.NODE_ENV === "test") {
    return { success: true, messageId: "mailjet-mock-id" };
  }

  const mailjet = getMailjetClient();
  if (!mailjet) {
    console.warn(`[Mailjet] API credentials not configured. Skipping email to ${to}.`);
    return { success: false, error: "MAILJET_CREDENTIALS_NOT_CONFIGURED" };
  }

  const senderEmail = process.env.MAILJET_SENDER_EMAIL || "medikart.com@gmail.com";
  const senderName = process.env.MAILJET_SENDER_NAME || "Medikart Monthly Refill";

  const entityRefId = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");

  try {
    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: senderName,
          },
          To: [
            {
              Email: to,
              Name: toName || "Customer",
            },
          ],
          Subject: subject,
          TextPart: text,
          HTMLPart: html || text,
          TrackOpens: "disabled",
          TrackClicks: "disabled",
          Headers: {
            "Auto-Submitted": "auto-generated",
            "X-Priority": "1 (Highest)",
            Importance: "high",
            "X-Entity-Ref-ID": entityRefId,
          },
        },
      ],
    });

    const status = result?.body?.Messages?.[0]?.Status;
    const messageId =
      result?.body?.Messages?.[0]?.To?.[0]?.MessageID ||
      result?.body?.Messages?.[0]?.MessageID ||
      "unknown";

    console.log(`[Mailjet] Email delivered to ${to} — subject: "${subject}" — status: ${status}`);
    return { success: true, messageId: String(messageId) };
  } catch (err) {
    const detail =
      err?.response?.data?.ErrorMessage ||
      err?.ErrorMessage ||
      err?.message ||
      "Unknown Mailjet error";

    console.error(`[Mailjet] Delivery failed to ${to}:`, detail);
    return { success: false, error: detail };
  }
};

/**
 * Send a dedicated Monthly Refill Order Confirmation email.
 *
 * @param {object} order - Mongoose Order document
 * @param {Date} nextReminderDate - Calculated next 30-day reminder date
 */
const sendMonthlyRefillOrderEmail = async (order, nextReminderDate = null) => {
  if (!order || !order.customer?.email) return;

  const customerName = order.customer.name || "Valued Customer";
  const formattedNextDate = nextReminderDate
    ? new Date(nextReminderDate).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "in 30 days";

  const storefrontUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:3000";
  const refillManageUrl = `${storefrontUrl}/refill`;

  const itemRows = (order.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #fef08a;">
        <td style="padding: 10px 14px; color: #1e293b; font-weight: 600; font-size: 14px;">${item.name}</td>
        <td style="padding: 10px 14px; color: #475569; text-align: center; font-weight: bold; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 10px 14px; color: #0f172a; text-align: right; font-weight: bold; font-size: 14px;">PKR ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const itemsText = (order.items || [])
    .map((item, idx) => `${idx + 1}. ${item.name} (Qty: ${item.quantity}) - PKR ${(item.price * item.quantity).toFixed(2)}`)
    .join("\n");

  const text = `Hello ${customerName},\n\n` +
    `Your Monthly Refill Order #${order.orderCode || order._id} has been successfully placed!\n\n` +
    `Refill Items:\n${itemsText}\n\n` +
    `Order Total: PKR ${(order.totals?.total || 0).toFixed(2)}\n` +
    `Delivery Address: ${order.customer.address}, ${order.customer.city}\n` +
    `Next Refill Reminder Date: ${formattedNextDate}\n\n` +
    `You can manage your monthly refill schedule anytime at: ${refillManageUrl}\n\n` +
    `Thank you for keeping your health on schedule with Medikart!\n` +
    `Medikart Monthly Refill Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fef08a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header Banner -->
      <div style="background-color: #fff850; padding: 24px; text-align: center; border-bottom: 2px solid #fae845;">
        <h1 style="color: #1a1a1a; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
          💊 Medikart Monthly Refill
        </h1>
        <p style="color: #451a03; margin: 6px 0 0 0; font-size: 14px; font-weight: bold;">
          Refill Order Placed & Schedule Confirmed
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #1a1a1a; margin-top: 0; line-height: 1.5;">
          Dear <strong>${customerName}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your monthly medicine refill order <strong>#${order.orderCode || order._id}</strong> has been received and is being prepared for fast delivery to your doorstep.
        </p>

        <!-- Refill Schedule Notice Card -->
        <div style="background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; padding: 14px 18px; margin: 18px 0; display: flex; align-items: center; gap: 10px;">
          <div>
            <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 3px;">📅 Next 30-Day Auto Reminder:</strong>
            <span style="color: #1e3a8a; font-size: 13px;">Your next scheduled refill reminder will be sent on <strong>${formattedNextDate}</strong> so you never run out of essential medicines.</span>
          </div>
        </div>

        <!-- Items Table -->
        <div style="background-color: #fffde0; border-radius: 12px; border: 1px solid #fef08a; padding: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #fde047;">
                <th style="padding: 8px 14px; text-align: left; color: #854d0e; font-size: 12px; text-transform: uppercase;">Medicine</th>
                <th style="padding: 8px 14px; text-align: center; color: #854d0e; font-size: 12px; text-transform: uppercase;">Qty</th>
                <th style="padding: 8px 14px; text-align: right; color: #854d0e; font-size: 12px; text-transform: uppercase;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>

        <!-- Order Summary -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px; font-size: 13px; color: #475569;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Subtotal:</span>
            <span>PKR ${(order.totals?.subtotal || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Delivery:</span>
            <span>PKR ${(order.totals?.deliveryCharge || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; color: #0f172a; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <span>Total Amount:</span>
            <span>PKR ${(order.totals?.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <!-- Delivery Address -->
        <div style="margin-top: 18px; padding: 12px 16px; background-color: #f8fafc; border-radius: 8px; font-size: 13px; color: #334155;">
          <strong>📍 Delivery Address:</strong> ${order.customer.address}, ${order.customer.city} • <strong>Payment:</strong> ${order.paymentMethod === "card" ? "Online Card" : "Cash on Delivery"}
        </div>

        <!-- Manage Refill CTA -->
        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${refillManageUrl}" style="background-color: #fff850; color: #1a1a1a; font-weight: 900; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 9999px; display: inline-block; border: 1px solid #fae845; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            ⚙️ View & Manage Refill Schedule
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
        &copy; ${new Date().getFullYear()} Medikart Pharmacy • Monthly Refill Program
      </div>
    </div>
  `;

  return sendMailjetEmail({
    to: order.customer.email,
    toName: customerName,
    subject: `Monthly Refill Confirmed — Medikart (#${order.orderCode || order._id})`,
    text,
    html,
  });
};

/**
 * Send a 30-day monthly refill reminder email to a customer.
 */
const sendRefillReminderEmail = async (customer, items = []) => {
  const customerId = customer?._id || customer?.id || "unknown";

  const senderName = process.env.MAILJET_SENDER_NAME || "Medikart Monthly Refill";
  const storefrontUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:3000";
  const refillUrl = `${storefrontUrl}/refill`;

  const itemsTextList = items
    .map((item, idx) => `${idx + 1}. ${item.name || "Medicine"} — Qty: ${item.quantity}`)
    .join("\n");

  const textPart = `Hello ${customer.name || "Valued Customer"},\n\n` +
    `This is a friendly reminder from Medikart Pharmacy that it's time to reorder your monthly medicines so you never run out.\n\n` +
    `Your Monthly Refill Items:\n${itemsTextList || "No items listed"}\n\n` +
    `Reorder with one click here: ${refillUrl}\n\n` +
    `Stay healthy,\n${senderName}`;

  const itemsHtmlRows = items
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #fef08a;">
          <td style="padding: 10px 14px; color: #1a1a1a; font-weight: 600; font-size: 14px;">${item.name || "Medicine"}</td>
          <td style="padding: 10px 14px; color: #475569; text-align: center; font-weight: bold; font-size: 14px;">${item.quantity}</td>
        </tr>
      `
    )
    .join("");

  const htmlPart = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fef08a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header Banner -->
      <div style="background-color: #fff850; padding: 24px; text-align: center; border-bottom: 2px solid #fae845;">
        <h1 style="color: #1a1a1a; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
          💊 Medikart Pharmacy
        </h1>
        <p style="color: #451a03; margin: 6px 0 0 0; font-size: 14px; font-weight: bold;">
          Monthly Refill Reminder
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #1a1a1a; margin-top: 0; line-height: 1.5;">
          Dear <strong>${customer.name || "Customer"}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          It has been approximately <strong>30 days</strong> since your last order. Keep your wellness on track — review your monthly medicine refill below and reorder with one click:
        </p>

        <!-- Items Table -->
        <div style="background-color: #fffde0; border-radius: 12px; border: 1px solid #fef08a; padding: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #fde047;">
                <th style="padding: 8px 14px; text-align: left; color: #854d0e; font-size: 12px; text-transform: uppercase;">Medicine</th>
                <th style="padding: 8px 14px; text-align: center; color: #854d0e; font-size: 12px; text-transform: uppercase;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtmlRows}
            </tbody>
          </table>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${refillUrl}" style="background-color: #fff850; color: #1a1a1a; font-weight: 900; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; display: inline-block; border: 1px solid #fae845; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            ⚡ Reorder Your Medicines Now
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; line-height: 1.4;">
          If you need to change quantities or update your delivery address, you can manage your refill anytime in your account.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
        &copy; ${new Date().getFullYear()} Medikart Pharmacy. All rights reserved.
      </div>
    </div>
  `;

  return sendMailjetEmail({
    to: customer.email,
    toName: customer.name || "Customer",
    subject: "Time to reorder your monthly medicines — Medikart",
    text: textPart,
    html: htmlPart,
  });
};

module.exports = {
  sendMailjetEmail,
  sendMonthlyRefillOrderEmail,
  sendRefillReminderEmail,
};
