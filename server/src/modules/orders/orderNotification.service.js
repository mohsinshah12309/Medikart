const smtp = require("../../integrations/smtp");
const {
  generateInstantOrderPricedTemplate,
  generateOrderDeliveredTemplate,
} = require("../../utils/emailTemplates");

/**
 * Order Notification Service (SRP)
 * Encapsulates all transactional customer email dispatches for order events.
 */

/**
 * Sends a detailed cancellation email with admin reason note to the customer.
 * @param {object} order
 */
const sendOrderCancellationEmail = async (order) => {
  const isRefundPending = order.cancellation?.refundStatus === "refund_pending";
  const reasonNote = order.cancellation?.reason || "Cancelled by store administration.";
  const orderTotal = order.totals?.total !== undefined ? order.totals.total : 0;
  
  let refundNoteHtml = "";
  let refundNoteText = "";

  if (isRefundPending) {
    refundNoteHtml = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <strong style="color:#1e40af;font-size:13px;display:block;margin-bottom:4px;">💳 Refund Notice:</strong>
        <span style="color:#1e3a8a;font-size:13px;line-height:1.5;">Since your order was paid online, your refund of <strong>PKR ${orderTotal.toFixed(2)}</strong> has been initiated and will be processed manually to your account within <strong>3-5 business days</strong>.</span>
      </div>`;
    refundNoteText = ` Since your order was paid online, your refund of PKR ${orderTotal.toFixed(2)} has been initiated and will be processed within 3-5 business days.`;
  } else {
    refundNoteHtml = `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #94a3b8;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <span style="color:#475569;font-size:13px;">Since this was a Cash on Delivery (COD) order, no payment was deducted or charged.</span>
      </div>`;
    refundNoteText = " Since this was a Cash on Delivery order, no payment was deducted.";
  }

  const itemRows = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#475569;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;font-weight:bold;color:#0f172a;">PKR ${i.price ? i.price.toFixed(2) : "0.00"}</td>
      </tr>`
    )
    .join("");

  const itemsTableHtml = order.items && order.items.length > 0 ? `
    <h3 style="margin-top:24px;margin-bottom:8px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Cancelled Items</h3>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px 0;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${order.totals?.total !== undefined ? `
    <table style="width:100%;margin-top:4px;">
      <tr style="font-weight:bold;font-size:14px;color:#0f172a;">
        <td style="padding:4px 0;">Order Total Amount</td>
        <td style="padding:4px 0;text-align:right;font-size:16px;">PKR ${orderTotal.toFixed(2)}</td>
      </tr>
    </table>` : ''}
  ` : '';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
      <!-- Header with branding -->
      <div style="border-bottom:2px solid #fef08a;padding-bottom:16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
        <h1 style="color:#0f172a;font-size:22px;margin:0;font-weight:900;">Medikart</h1>
        <span style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:bold;padding:3px 8px;border-radius:999px;text-transform:uppercase;margin-left:auto;">Order Cancelled</span>
      </div>

      <p style="font-size:15px;color:#1e293b;margin:0 0 12px 0;">Hello <strong>${order.customer.name}</strong>,</p>
      <p style="font-size:14px;color:#475569;margin:0 0 16px 0;line-height:1.6;">
        We regret to inform you that your order <strong>#${order._id}</strong> has been cancelled by our pharmacy team.
      </p>

      <!-- Prominent Reason Note Box -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:10px;padding:14px 18px;margin:18px 0;">
        <strong style="color:#92400e;display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">📝 Reason for Cancellation:</strong>
        <div style="color:#78350f;font-size:14px;line-height:1.5;font-weight:600;">
          ${reasonNote}
        </div>
      </div>

      ${refundNoteHtml}

      ${itemsTableHtml}

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0;">

      <!-- Support Footer -->
      <div style="font-size:12px;color:#64748b;line-height:1.6;">
        <p style="margin:0 0 6px 0;">If you have any questions or require assistance reordering, please reach out to us:</p>
        <p style="margin:0;">
          ✉️ Email: <a href="mailto:support@medikart.pk" style="color:#0284c7;text-decoration:none;">support@medikart.pk</a> | 
          💬 WhatsApp: <a href="https://wa.me/923244489159" style="color:#16a34a;text-decoration:none;">03244489159</a>
        </p>
      </div>
    </div>`;

  await smtp.sendEmail({
    to: order.customer.email,
    subject: `Order Cancelled — Medikart (#${order._id})`,
    html,
    text: `Hello ${order.customer.name},\n\nYour order #${order._id} has been cancelled.\nReason: ${reasonNote}\n${refundNoteText}\n\nIf you have any questions, please contact us at support@medikart.pk or WhatsApp: 03244489159.\n\nTeam Medikart`,
    purpose: "order_cancelled",
    fromName: "Medikart Support",
  });
};

/**
 * Sends an email to the customer when their instant prescription order is priced.
 * @param {object} order
 */
const sendInstantOrderPricedEmail = async (order) => {
  const template = generateInstantOrderPricedTemplate({ order });
  await smtp.sendEmail({
    to: order.customer.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    purpose: "order_confirmed",
    fromName: "Medikart Orders",
  });
};

/**
 * Sends an email to the customer when their order is marked as delivered.
 * @param {object} order
 */
const sendOrderDeliveredEmail = async (order) => {
  const template = generateOrderDeliveredTemplate({ order });
  await smtp.sendEmail({
    to: order.customer.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    purpose: "order_confirmed",
    fromName: "Medikart Orders",
  });
};

module.exports = {
  sendOrderCancellationEmail,
  sendInstantOrderPricedEmail,
  sendOrderDeliveredEmail,
};
