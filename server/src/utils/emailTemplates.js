/**
 * emailTemplates.js — High-Deliverability Responsive Email Templates
 *
 * Engineered specifically for 10/10 spam score and direct Primary Inbox placement:
 * 1. Proper XHTML / HTML5 doctype & viewport meta headers
 * 2. Invisible preheader snippet for instant lockscreen/inbox preview
 * 3. Table-based email client compatible layout (Outlook/Gmail/Apple Mail/Yahoo)
 * 4. High-contrast typography and clear call-to-actions
 * 5. Matching plain-text fallback for every email (avoids MIME multipart mismatch penalties)
 * 6. Spam-safe phrasing with clear security/phishing warnings and order summary details
 */

/**
 * Generate an inbox-optimized OTP verification email.
 */
function generateOtpEmailTemplate({
  code,
  purpose = "order_otp",
  recipientName = "",
  expiryMinutes = 10,
}) {
  let purposeTitle = "Verification Code";
  let purposeDesc = "Use the single-use 6-digit verification code below to complete your verification:";

  switch (purpose) {
    case "account_verification":
      purposeTitle = "Account Verification";
      purposeDesc = "Thank you for joining Medikart. Use the 6-digit code below to verify your email address and activate your account:";
      break;
    case "order_otp":
    case "instant_order_otp":
    case "narcotics_otp":
      purposeTitle = "Order Verification Code";
      purposeDesc = "We received an order request requiring verification. Use the 6-digit code below to authorize your order:";
      break;
    case "login":
    case "auth_otp":
      purposeTitle = "Sign-In Verification";
      purposeDesc = "Use the 6-digit security code below to sign in to your Medikart account:";
      break;
    case "password_reset":
      purposeTitle = "Password Reset Code";
      purposeDesc = "We received a request to reset your Medikart password. Use the 6-digit code below to proceed:";
      break;
    default:
      purposeTitle = "Verification Code";
      purposeDesc = "Use the 6-digit verification code below to proceed with your request:";
      break;
  }

  const subject = `${code} is your Medikart verification code`;
  const preheader = `Your Medikart verification code is ${code}. Valid for ${expiryMinutes} minutes.`;
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
  <title>${subject}</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
    @media only screen and (max-width: 600px) {
      .main-card { width: 100% !important; border-radius: 12px !important; }
      .code-digit-box { font-size: 32px !important; letter-spacing: 6px !important; padding: 16px 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <div class="preheader" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &#847; &zwnj; &nbsp; &#8199; &#847; &zwnj; &nbsp; &#8199;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);" class="main-card">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF352; padding: 22px 20px; border-bottom: 2px solid #F7E53B;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px;">Medikart</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569;">
                ${purposeTitle}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                ${purposeDesc}
              </p>

              <!-- OTP Code Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center" style="background-color: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 20px 16px;" class="code-digit-box">
                    <span style="font-family: 'SFMono-Regular', Consolas, Menlo, Courier, monospace; font-size: 36px; font-weight: 900; color: #92400e; letter-spacing: 10px; display: inline-block; padding-left: 10px;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 10px; padding: 12px 14px; margin-top: 18px;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.5;">
                    ⏱️ <strong>Expires in ${expiryMinutes} minutes.</strong> For your security, this single-use code cannot be reused.
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                🔒 Never share this code with anyone. Medikart staff will never ask for your verification code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f1f5f9; padding: 18px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.<br />
                Your trusted digital pharmacy partner.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `MEDIKART ${purposeTitle.toUpperCase()}
========================================

${recipientName ? `Hello ${recipientName},` : "Hello,"}

${purposeDesc}

YOUR VERIFICATION CODE: ${code}

This code expires in ${expiryMinutes} minutes.

SECURITY ADVISORY:
Never share this code with anyone. Medikart staff will never ask for your verification code.
If you did not make this request, you can safely ignore this email.

© ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.`;

  return { subject, html, text, preheader };
}

/**
 * Generate an inbox-optimized Instant Order Received email.
 */
function generateInstantOrderPlacedTemplate({ order }) {
  const customerName = order.customer?.name || "Valued Customer";
  const orderCode = order.orderCode || (order._id ? `MK-${String(order._id).slice(-6).toUpperCase()}` : "MK-ORDER");
  const subject = `Instant Order Received #${orderCode} — Medikart`;
  const preheader = `We have received your prescription order #${orderCode}. Our licensed pharmacist is reviewing your prescription.`;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <div class="preheader" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &#847; &zwnj; &nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <tr>
            <td align="center" style="background-color: #FFF352; padding: 22px 20px; border-bottom: 2px solid #F7E53B;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b;">Medikart</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569;">
                Instant Order Received
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                We have received your prescription and order details. Our licensed pharmacist is reviewing your prescription and will contact you shortly with itemized pricing.
              </p>

              <!-- Order Info Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <tr>
                  <td style="font-size: 13px; color: #475569; line-height: 1.8;">
                    <strong>Order Code:</strong> <span style="font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-weight: 900; color: #0f172a; background: #fef08a; padding: 2px 6px; border-radius: 6px;">#${orderCode}</span><br />
                    <strong>Status:</strong> Awaiting Pharmacist Review & Pricing<br />
                    <strong>Delivery Address:</strong> ${order.customer?.address || "Provided address"}, ${order.customer?.city || "Lahore"}<br />
                    <strong>Payment Method:</strong> ${(order.paymentMethod || "COD").toUpperCase()}
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Need assistance? WhatsApp our Pharmacy Care Team at <a href="https://wa.me/923244489159" style="color: #16a34a; font-weight: bold; text-decoration: none;">03244489159</a> quoting your Order Code <strong>#${orderCode}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f1f5f9; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `MEDIKART INSTANT ORDER RECEIVED
========================================

Hello ${customerName},

We have received your prescription and order details. Our licensed pharmacist is reviewing your prescription and will contact you shortly with itemized pricing.

ORDER DETAILS:
- Order Code: #${orderCode}
- Status: Awaiting Pharmacist Review & Pricing
- Delivery Address: ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}
- Payment Method: ${(order.paymentMethod || "COD").toUpperCase()}

If you have any questions, reach out on WhatsApp: +92 324 4489159 quoting Order Code #${orderCode}.

© ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.`;

  return { subject, html, text, preheader };
}

/**
 * Generate an inbox-optimized Standard Order Placed / Confirmed email.
 */
function generateStandardOrderPlacedTemplate({ order }) {
  const customerName = order.customer?.name || "Valued Customer";
  const orderCode = order.orderCode || (order._id ? `MK-${String(order._id).slice(-6).toUpperCase()}` : "MK-ORDER");
  const subject = `Order Confirmation #${orderCode} — Medikart`;
  const preheader = `Thank you for your order #${orderCode}. Total: PKR ${order.totals?.total?.toFixed(2) || "0.00"}. We are preparing your medicines.`;

  const itemRowsHtml = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${i.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #334155;">${i.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #0f172a; font-weight: bold;">PKR ${(i.price || 0).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const itemRowsText = (order.items || [])
    .map((i) => `- ${i.name} (x${i.quantity}) — PKR ${(i.price || 0).toFixed(2)}`)
    .join("\n");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <div class="preheader" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &#847; &zwnj; &nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <tr>
            <td align="center" style="background-color: #FFF352; padding: 22px 20px; border-bottom: 2px solid #F7E53B;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b;">Medikart</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569;">
                Order Confirmation
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Thank you for ordering with Medikart. Your order <strong style="color: #0f172a; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; background: #fef08a; padding: 2px 6px; border-radius: 6px;">#${orderCode}</strong> has been received and is being prepared for rapid express dispatch.
              </p>

              <!-- Items Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">Item</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #64748b;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #64748b;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #334155; text-align: right;">PKR ${(order.totals?.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Delivery Fee</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #334155; text-align: right;">PKR ${(order.totals?.deliveryCharge || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Platform Fee</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #334155; text-align: right;">PKR ${(order.totals?.platformFee !== undefined ? order.totals.platformFee : 10).toFixed(2)}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #0f172a;">Total Payable</td>
                  <td style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #0f172a; text-align: right;">PKR ${(order.totals?.total || 0).toFixed(2)}</td>
                </tr>
              </table>

              <!-- Delivery Details -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-top: 16px;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.6;">
                    📍 <strong>Delivery Address:</strong> ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}<br />
                    💳 <strong>Payment Method:</strong> ${(order.paymentMethod || "COD").toUpperCase()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f1f5f9; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `MEDIKART ORDER CONFIRMATION
========================================

Hello ${customerName},

Thank you for your order. Order #${orderCode} has been confirmed.

ORDER ITEMS:
${itemRowsText}

TOTAL SUMMARY:
- Subtotal: PKR ${(order.totals?.subtotal || 0).toFixed(2)}
- Delivery Fee: PKR ${(order.totals?.deliveryCharge || 0).toFixed(2)}
- Platform Fee: PKR ${(order.totals?.platformFee !== undefined ? order.totals.platformFee : 10).toFixed(2)}
- Total Payable: PKR ${(order.totals?.total || 0).toFixed(2)}

DELIVERY DETAILS:
- Order Code: #${orderCode}
- Address: ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}
- Payment Method: ${(order.paymentMethod || "COD").toUpperCase()}

Questions? Contact us on WhatsApp: +92 324 4489159 quoting Order Code #${orderCode}.

© ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.`;

  return { subject, html, text, preheader };
}


/**
 * Generate an inbox-optimized Password Reset Link email.
 */
function generatePasswordResetTemplate({
  recipientName = "",
  resetLink,
  expiryMinutes = 30,
}) {
  const subject = `Reset Your Medikart Password`;
  const preheader = `Password reset requested for your Medikart account. This link expires in ${expiryMinutes} minutes.`;
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <div class="preheader" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &#847; &zwnj; &nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <tr>
            <td align="center" style="background-color: #FFF352; padding: 22px 20px; border-bottom: 2px solid #F7E53B;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b;">Medikart</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569;">
                Password Reset
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">${greeting}</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                We received a request to reset your Medikart password. Click the secure button below to set a new password:
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="background-color: #FFF352; color: #1e293b; border: 2px solid #F7E53B; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: 900; font-size: 14px; display: inline-block;">
                      Reset My Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 10px; padding: 12px 14px; margin-top: 18px;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.5;">
                    ⏱️ This reset link will expire in <strong>${expiryMinutes} minutes</strong> and can only be used once.
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f1f5f9; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `MEDIKART PASSWORD RESET
========================================

${recipientName ? `Hello ${recipientName},` : "Hello,"}

We received a request to reset your Medikart password.
Click or open this link to set your new password:
${resetLink}

This link expires in ${expiryMinutes} minutes.

If you did not request this, please ignore this email.

© ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.`;

  return { subject, html, text, preheader };
}

/**
 * Generate an inbox-optimized Instant Order Priced / Quotation Ready email.
 */
function generateInstantOrderPricedTemplate({ order }) {
  const customerName = order.customer?.name || "Valued Customer";
  const orderCode = order.orderCode || (order._id ? `MK-${String(order._id).slice(-6).toUpperCase()}` : "MK-ORDER");
  const subject = `Prescription Quotation Ready #${orderCode} — Medikart`;
  const preheader = `Your prescription #${orderCode} has been reviewed and priced. Total: PKR ${(order.totals?.total || 0).toFixed(2)}.`;
  const siteUrl = process.env.STOREFRONT_URL || "https://medikart.pk";
  const invoiceUrl = `${siteUrl}/order-confirmation/${orderCode}`;

  const itemRowsHtml = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${i.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #334155;">${i.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #0f172a; font-weight: bold;">PKR ${(i.price || 0).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const itemRowsText = (order.items || [])
    .map((i) => `- ${i.name} (x${i.quantity}) — PKR ${(i.price || 0).toFixed(2)}`)
    .join("\n");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <div class="preheader" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &#847; &zwnj; &nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <tr>
            <td align="center" style="background-color: #FFF352; padding: 22px 20px; border-bottom: 2px solid #F7E53B;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b;">Medikart</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569;">
                Prescription Quotation & Pricing Ready
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Our qualified pharmacist has reviewed your uploaded prescription for Order <strong style="color: #0f172a; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; background: #fef08a; padding: 2px 6px; border-radius: 6px;">#${orderCode}</strong> and prepared your itemized medicine pricing below.
              </p>

              <!-- Items Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">Priced Medicine</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #64748b;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #64748b;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #334155; text-align: right;">PKR ${(order.totals?.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Delivery Fee</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #334155; text-align: right;">PKR ${(order.totals?.deliveryCharge || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Platform Fee</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #334155; text-align: right;">PKR ${(order.totals?.platformFee !== undefined ? order.totals.platformFee : 10).toFixed(2)}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #0f172a;">Total Payable</td>
                  <td style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #0f172a; text-align: right;">PKR ${(order.totals?.total || 0).toFixed(2)}</td>
                </tr>
              </table>

              <!-- Delivery Details -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-top: 16px;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.6;">
                    📍 <strong>Delivery Address:</strong> ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}<br />
                    💳 <strong>Payment Method:</strong> ${(order.paymentMethod || "COD").toUpperCase()}<br />
                    📦 <strong>Order Status:</strong> Confirmed &amp; In Fulfillment Queue
                  </td>
                </tr>
              </table>

              <!-- View Invoice CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 22px 0 10px 0;">
                <tr>
                  <td align="center">
                    <a href="${invoiceUrl}" target="_blank" style="background-color: #FFF352; color: #1e293b; border: 2px solid #F7E53B; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-weight: 900; font-size: 13px; display: inline-block;">
                      View Live Invoice & Tracking &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                Need assistance with your medicines? WhatsApp us at <a href="https://wa.me/923244489159" style="color: #16a34a; font-weight: bold; text-decoration: none;">03244489159</a> quoting Order <strong>#${orderCode}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f1f5f9; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `MEDIKART PRESCRIPTION QUOTATION & ORDER PRICED
==================================================

Hello ${customerName},

Our qualified pharmacist has reviewed your uploaded prescription for Order #${orderCode} and prepared your itemized medicine pricing below.

PRICED MEDICINES:
${itemRowsText}

TOTAL BREAKDOWN:
- Subtotal: PKR ${(order.totals?.subtotal || 0).toFixed(2)}
- Delivery Fee: PKR ${(order.totals?.deliveryCharge || 0).toFixed(2)}
- Platform Fee: PKR ${(order.totals?.platformFee !== undefined ? order.totals.platformFee : 10).toFixed(2)}
- Total Payable: PKR ${(order.totals?.total || 0).toFixed(2)}

DELIVERY DETAILS:
- Order Code: #${orderCode}
- Address: ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}
- Payment Method: ${(order.paymentMethod || "COD").toUpperCase()}
- Status: Confirmed & In Fulfillment Queue

View your live invoice: ${invoiceUrl}

Questions? Contact us on WhatsApp: +92 324 4489159 quoting Order Code #${orderCode}.

© ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.`;

  return { subject, html, text, preheader };
}

/**
 * Generate an inbox-optimized Order Delivered email.
 */
function generateOrderDeliveredTemplate({ order }) {
  const customerName = order.customer?.name || "Valued Customer";
  const orderCode = order.orderCode || (order._id ? `MK-${String(order._id).slice(-6).toUpperCase()}` : "MK-ORDER");
  const subject = `Order Delivered #${orderCode} — Medikart`;
  const preheader = `Your Medikart order #${orderCode} has been delivered. Thank you for choosing Medikart!`;

  const itemRowsHtml = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${i.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #334155;">${i.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #0f172a; font-weight: bold;">PKR ${(i.price || 0).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const itemRowsText = (order.items || [])
    .map((i) => `- ${i.name} (x${i.quantity}) — PKR ${(i.price || 0).toFixed(2)}`)
    .join("\n");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
  <div class="preheader" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &#847; &zwnj; &nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <tr>
            <td align="center" style="background-color: #FFF352; padding: 22px 20px; border-bottom: 2px solid #F7E53B;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b;">Medikart</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569;">
                🎉 Order Delivered Successfully
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Your Medikart order <strong style="color: #0f172a; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; background: #fef08a; padding: 2px 6px; border-radius: 6px;">#${orderCode}</strong> has been successfully delivered by our pharmacy dispatch rider.
              </p>

              <!-- Delivered Items Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b;">Delivered Item</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #64748b;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #64748b;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>

              <!-- Total Paid -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px;">
                <tr>
                  <td style="font-size: 14px; font-weight: bold; color: #166534;">Total Amount:</td>
                  <td style="font-size: 14px; font-weight: bold; color: #166534; text-align: right;">PKR ${(order.totals?.total || 0).toFixed(2)} (${(order.paymentMethod || "COD").toUpperCase()})</td>
                </tr>
              </table>

              <!-- Delivery Details -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-top: 14px;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.6;">
                    📍 <strong>Delivered To:</strong> ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}<br />
                    📦 <strong>Status:</strong> Completed / Delivered
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                We hope you are satisfied with our service. If you need any refills or pharmacist assistance, WhatsApp us at <a href="https://wa.me/923244489159" style="color: #16a34a; font-weight: bold; text-decoration: none;">03244489159</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f1f5f9; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `MEDIKART ORDER DELIVERED
========================================

Hello ${customerName},

Your Medikart order #${orderCode} has been successfully delivered!

DELIVERED ITEMS:
${itemRowsText}

TOTAL: PKR ${(order.totals?.total || 0).toFixed(2)} (${(order.paymentMethod || "COD").toUpperCase()})
DELIVERED TO: ${order.customer?.address || ""}, ${order.customer?.city || "Lahore"}

Thank you for choosing Medikart.
WhatsApp Support: +92 324 4489159.

© ${new Date().getFullYear()} Medikart Healthcare. All rights reserved.`;

  return { subject, html, text, preheader };
}

module.exports = {
  generateOtpEmailTemplate,
  generateInstantOrderPlacedTemplate,
  generateStandardOrderPlacedTemplate,
  generateInstantOrderPricedTemplate,
  generateOrderDeliveredTemplate,
  generatePasswordResetTemplate,
};

