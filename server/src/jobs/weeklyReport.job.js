/**
 * Weekly Report Job — Phase 19 (FR-SYS-06).
 *
 * Generates a weekly Excel report of all orders in the past 7 days (or a
 * configurable date range) and emails it as an attachment to a configured
 * recipient.
 *
 * Schedule: Monday 08:00 local time (configurable via REPORT_CRON_SCHEDULE).
 * Recipient: REPORT_RECIPIENT_EMAIL env var.
 *
 * Uses the `xlsx` library already present in package.json (Phase 9 — bulk
 * product import). No new Excel dependency introduced.
 *
 * Exports:
 *   generateWeeklyReport({ from, to }) → { buffer, filename }
 *   sendWeeklyReport({ from, to, recipient })
 *   scheduleWeeklyReport()
 *   runWeeklyReport()  — single on-demand invocation (for admin trigger endpoint)
 */

const XLSX = require('xlsx');
const cron = require('node-cron');
const Order = require('../modules/orders/order.model');
const smtp = require('../integrations/smtp');

// ─── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  'Order ID',
  'Date',
  'Type',
  'Customer Name',
  'Total (PKR)',
  'Payment Method',
  'Payment Status',
  'Order Status',
  'Branch',
];

/**
 * Map an Order document to a row array matching COLUMNS.
 *
 * @param {object} order - Mongoose order document (plain or lean)
 * @returns {Array}
 */
const orderToRow = (order) => [
  order._id.toString(),
  order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '',
  order.type || '',
  order.customer?.name || '',
  typeof order.totals?.total === 'number' ? order.totals.total : 0,
  order.paymentMethod || '',
  order.paymentState || '',
  order.status || '',
  order.branchDescription || '',
];

/**
 * Query orders within [from, to] and build an Excel workbook buffer.
 *
 * @param {{ from: Date, to: Date }} range
 * @returns {Promise<{ buffer: Buffer, filename: string }>}
 */
const generateWeeklyReport = async ({ from, to }) => {
  const orders = await Order.find({
    createdAt: { $gte: from, $lte: to },
  })
    .sort({ createdAt: -1 })
    .lean();

  const rows = orders.map(orderToRow);

  const worksheetData = [COLUMNS, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Column widths for readability
  worksheet['!cols'] = [
    { wch: 26 }, // Order ID
    { wch: 12 }, // Date
    { wch: 12 }, // Type
    { wch: 22 }, // Customer Name
    { wch: 14 }, // Total
    { wch: 16 }, // Payment Method
    { wch: 14 }, // Payment Status
    { wch: 22 }, // Order Status
    { wch: 20 }, // Branch
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Orders');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  const filename = `medikart-orders-${fromStr}-to-${toStr}.xlsx`;

  return { buffer, filename, count: orders.length };
};

/**
 * Generate the Excel file and email it to the configured recipient.
 *
 * @param {{ from?: Date, to?: Date, recipient?: string }} options
 */
const sendWeeklyReport = async ({ from, to, recipient } = {}) => {
  // Default window: last 7 complete days up to (and including) yesterday 23:59:59
  const now = new Date();
  const defaultTo = new Date(now);
  defaultTo.setHours(23, 59, 59, 999);
  defaultTo.setDate(defaultTo.getDate() - 1); // yesterday end

  const defaultFrom = new Date(defaultTo);
  defaultFrom.setDate(defaultFrom.getDate() - 6); // 7 days back
  defaultFrom.setHours(0, 0, 0, 0);

  const rangeFrom = from instanceof Date ? from : defaultFrom;
  const rangeTo   = to   instanceof Date ? to   : defaultTo;

  const reportRecipient =
    recipient ||
    process.env.REPORT_RECIPIENT_EMAIL ||
    process.env.SMTP_FROM ||
    'admin@medikart.pk';

  const { buffer, filename, count } = await generateWeeklyReport({
    from: rangeFrom,
    to: rangeTo,
  });

  const fromLabel = rangeFrom.toISOString().slice(0, 10);
  const toLabel   = rangeTo.toISOString().slice(0, 10);

  await smtp.sendEmail({
    to: reportRecipient,
    subject: `Medikart Weekly Order Report — ${fromLabel} to ${toLabel}`,
    text: `Please find attached the Medikart weekly order report for ${fromLabel} to ${toLabel}.\n\nTotal orders in range: ${count}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#0d9488;">Weekly Order Report — Medikart</h2>
        <p>Period: <strong>${fromLabel}</strong> to <strong>${toLabel}</strong></p>
        <p>Total orders in range: <strong>${count}</strong></p>
        <p>Please see the attached Excel file for the full breakdown.</p>
        <p style="color:#6b7280;font-size:0.875em;">This report was generated automatically by the Medikart weekly report job.</p>
      </div>`,
    attachments: [
      {
        filename,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  });

  console.log(
    `[weeklyReport] Report sent to ${reportRecipient} (${count} orders, ${fromLabel}→${toLabel})`
  );

  return { count, filename, recipient: reportRecipient };
};

/**
 * Run a single on-demand report invocation.
 * Used by the admin trigger endpoint (POST /api/v1/admin/reports/weekly/trigger).
 *
 * @param {{ from?: Date, to?: Date, recipient?: string }} options
 */
const runWeeklyReport = async (options = {}) => {
  return sendWeeklyReport(options);
};

let cronTask = null;

/**
 * Register the scheduled weekly report cron job.
 *
 * Default schedule: Monday at 08:00 (server local time).
 * Override via REPORT_CRON_SCHEDULE env var (standard 5-field cron expression).
 *
 * Call once at server startup (in app.js). Safe to call in test environments
 * because tests set NODE_ENV=test and this function skips scheduling in that case.
 */
const scheduleWeeklyReport = () => {
  if (process.env.NODE_ENV === 'test') {
    // Never register background jobs in the test environment — they would
    // leak timers and cause Jest to not exit cleanly.
    return null;
  }

  const schedule = process.env.REPORT_CRON_SCHEDULE || '0 8 * * 1'; // Mon 08:00

  cronTask = cron.schedule(schedule, async () => {
    console.log('[weeklyReport] Cron triggered — generating weekly order report');
    try {
      await sendWeeklyReport();
    } catch (err) {
      console.error('[weeklyReport] Cron job failed:', err.message);
    }
  });

  console.log(`[weeklyReport] Scheduled with cron expression: "${schedule}"`);
  return cronTask;
};

/**
 * Stops the weekly report cron job if it is running.
 */
const stopWeeklyReport = () => {
  if (cronTask) {
    cronTask.stop();
    console.log('[weeklyReport] Stopped weekly report cron job');
    cronTask = null;
  }
};

module.exports = {
  generateWeeklyReport,
  sendWeeklyReport,
  runWeeklyReport,
  scheduleWeeklyReport,
  stopWeeklyReport,
  // Exported for tests
  COLUMNS,
  orderToRow,
};
