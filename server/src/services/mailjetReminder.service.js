/**
 * Mailjet Reminder Service — Scheduled 30-Day Monthly Refill Notifications.
 *
 * Fully separate from the existing OTP/verification email transporter.
 * Sends Mailjet Send API v3.1 transactional messages.
 *
 * Environment variables:
 *   MAILJET_API_KEY
 *   MAILJET_API_SECRET
 *   MAILJET_SENDER_EMAIL
 *   MAILJET_SENDER_NAME
 *   STOREFRONT_URL (optional fallback for CTA links)
 */

const Mailjet = require("node-mailjet");

/**
 * Get or initialize Mailjet API client.
 */
const getClient = () => {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  return Mailjet.apiConnect(apiKey, apiSecret);
};

/**
 * Send a 30-day monthly refill reminder email to a customer.
 *
 * @param {object} customer - Customer object with email, name, _id/id
 * @param {Array} items - List of populated refill items ({ name, quantity, effectivePrice, ... })
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
const sendRefillReminderEmail = async (customer, items = []) => {
  const customerId = customer?._id || customer?.id || "unknown";

  try {
    const senderEmail =
      process.env.MAILJET_SENDER_EMAIL || "medikart.com@gmail.com";
    const senderName =
      process.env.MAILJET_SENDER_NAME || "Medikart Pharmacy";
    const storefrontUrl =
      process.env.STOREFRONT_URL ||
      process.env.NEXT_PUBLIC_STOREFRONT_URL ||
      "https://medikart.pk";
    const refillUrl = `${storefrontUrl}/refill`;

    // Format plain text item list
    const itemsTextList = items
      .map((item, idx) => `${idx + 1}. ${item.name || "Medicine"} — Qty: ${item.quantity}`)
      .join("\n");

    const textPart = `Hello ${customer.name || "Valued Customer"},\n\n` +
      `This is a friendly reminder from Medikart Pharmacy that it's time to reorder your monthly medicines so you never run out.\n\n` +
      `Your Monthly Refill Items:\n${itemsTextList || "No items listed"}\n\n` +
      `Reorder with one click here: ${refillUrl}\n\n` +
      `Stay healthy,\n${senderName}`;

    // Format HTML table
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

    const mailjet = getClient();
    if (!mailjet) {
      console.warn(
        `[MailjetReminder] Mailjet API credentials not configured. Skipping email to customerId: ${customerId} (${customer.email})`
      );
      return {
        success: false,
        error: "MAILJET_CREDENTIALS_NOT_CONFIGURED",
      };
    }

    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: senderName,
          },
          To: [
            {
              Email: customer.email,
              Name: customer.name || "Customer",
            },
          ],
          Subject: "Time to reorder your monthly medicines",
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    });

    const status = result?.body?.Messages?.[0]?.Status;
    console.log(
      `[MailjetReminder] Email sent successfully to customerId: ${customerId} (${customer.email}), status: ${status}`
    );

    return {
      success: true,
      result: result.body,
    };
  } catch (err) {
    // Must never throw to avoid breaking the cron batch
    console.error(
      `[MailjetReminder] Failed to send refill reminder to customerId: ${customerId} (${customer?.email}):`,
      err.message || err
    );
    return {
      success: false,
      error: err.message || "Failed to send email",
    };
  }
};

module.exports = {
  sendRefillReminderEmail,
};
