/**
 * Phase 19 — Weekly Report Tests (FR-SYS-06).
 *
 * Tests:
 *   1. generateWeeklyReport returns a valid Excel buffer with the correct
 *      row count matching a direct MongoDB query for the same date range.
 *   2. Excel headers match the expected COLUMNS definition.
 *   3. Orders outside the date window are excluded from the report.
 *   4. sendWeeklyReport calls smtp.sendEmail exactly once with an attachment
 *      (mocked — no real email sent).
 *   5. sendWeeklyReport with zero orders in range still sends one email.
 */

jest.setTimeout(60000);

// ─── Load env FIRST (MONGODB_URI) ─────────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// ─── Mock SMTP BEFORE any module requiring it is loaded ───────────────────────
jest.mock('../../src/integrations/smtp', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-report-id' }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Order = require('../../src/modules/orders/order.model');
const {
  generateWeeklyReport,
  sendWeeklyReport,
  COLUMNS,
} = require('../../src/jobs/weeklyReport.job');
const smtp = require('../../src/integrations/smtp');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal valid order document object for Order.create().
 */
const makeOrderDoc = (overrides = {}) => ({
  type: 'standard',
  customer: {
    name: 'Report Test Customer',
    email: 'report@test.com',
    phone: '03001234567',
    address: '1 Report Street',
    city: 'Karachi',
  },
  items: [
    {
      productId: new mongoose.Types.ObjectId(),
      name: 'Test Medicine',
      price: 100,
      quantity: 2,
    },
  ],
  totals: { subtotal: 200, deliveryCharge: 250, total: 450 },
  paymentMethod: 'cod',
  paymentState: 'pending',
  status: 'pending',
  requiresVerification: false,
  ...overrides,
});

// ─── Global Setup / Teardown ──────────────────────────────────────────────────

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medikart_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  // Clean up any leftover report test data
  await Order.deleteMany({ 'customer.email': 'report@test.com' });
}, 60000);

afterAll(async () => {
  await Order.deleteMany({ 'customer.email': 'report@test.com' });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}, 20000);

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Phase 19 — Weekly Report Job', () => {

  // ── Test 1: Row count matches MongoDB query ────────────────────────────────
  test('1. generateWeeklyReport: Excel row count matches MongoDB count for the same date range', async () => {
    // Clean slate
    await Order.deleteMany({ 'customer.email': 'report@test.com' });

    // Define a precise window
    const windowFrom = new Date('2026-08-01T00:00:00.000Z');
    const windowTo   = new Date('2026-08-07T23:59:59.999Z');

    // Insert 3 orders inside the window
    await Order.create([
      makeOrderDoc({ createdAt: new Date('2026-08-02T10:00:00Z') }),
      makeOrderDoc({ createdAt: new Date('2026-08-04T15:30:00Z'), type: 'instant', items: [], totals: { subtotal: 0, deliveryCharge: 150, total: 150 } }),
      makeOrderDoc({ createdAt: new Date('2026-08-06T08:00:00Z'), type: 'narcotics' }),
    ]);

    // Insert 2 orders OUTSIDE the window (should not appear in the report)
    await Order.create([
      makeOrderDoc({ createdAt: new Date('2026-07-31T23:59:00Z') }), // before window
      makeOrderDoc({ createdAt: new Date('2026-08-08T00:01:00Z') }), // after window
    ]);

    // Direct MongoDB count for the same window
    const dbCount = await Order.countDocuments({
      'customer.email': 'report@test.com',
      createdAt: { $gte: windowFrom, $lte: windowTo },
    });
    expect(dbCount).toBe(3);

    // Generate report
    const { buffer, count } = await generateWeeklyReport({ from: windowFrom, to: windowTo });

    // Returned count must match MongoDB count
    expect(count).toBe(3);
    expect(count).toBe(dbCount);

    // Parse the Excel and verify the data rows (header row + data rows)
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // rows[0] = header, rows[1..n] = data
    const dataRows = rows.slice(1).filter((r) => r.length > 0);
    expect(dataRows.length).toBe(3);
  });

  // ── Test 2: Excel headers match COLUMNS ────────────────────────────────────
  test('2. generateWeeklyReport: Excel first row matches expected column headers', async () => {
    await Order.deleteMany({ 'customer.email': 'report@test.com' });

    const from = new Date('2026-08-10T00:00:00Z');
    const to   = new Date('2026-08-10T23:59:59Z');

    await Order.create(makeOrderDoc({ createdAt: new Date('2026-08-10T12:00:00Z') }));

    const { buffer } = await generateWeeklyReport({ from, to });

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // First row is the header
    expect(rows[0]).toEqual(COLUMNS);
  });

  // ── Test 3: Out-of-range orders excluded ───────────────────────────────────
  test('3. generateWeeklyReport: orders outside the date window are excluded', async () => {
    await Order.deleteMany({ 'customer.email': 'report@test.com' });

    const from = new Date('2026-08-15T00:00:00Z');
    const to   = new Date('2026-08-15T23:59:59Z');

    // One inside, two outside
    await Order.create([
      makeOrderDoc({ createdAt: new Date('2026-08-15T10:00:00Z') }), // inside
      makeOrderDoc({ createdAt: new Date('2026-08-14T23:59:59Z') }), // just before
      makeOrderDoc({ createdAt: new Date('2026-08-16T00:00:01Z') }), // just after
    ]);

    const { count, buffer } = await generateWeeklyReport({ from, to });

    expect(count).toBe(1);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1).filter((r) => r.length > 0);
    expect(dataRows.length).toBe(1);
  });

  // ── Test 4: sendWeeklyReport calls smtp.sendEmail exactly once with an attachment ──
  test('4. sendWeeklyReport: calls smtp.sendEmail exactly once, with a non-empty xlsx attachment', async () => {
    await Order.deleteMany({ 'customer.email': 'report@test.com' });

    const from = new Date('2026-08-20T00:00:00Z');
    const to   = new Date('2026-08-20T23:59:59Z');

    await Order.create(makeOrderDoc({ createdAt: new Date('2026-08-20T09:00:00Z') }));

    process.env.REPORT_RECIPIENT_EMAIL = 'admin@medikart.pk';

    await sendWeeklyReport({ from, to, recipient: 'admin@medikart.pk' });

    // Exactly one email
    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);

    const callArg = smtp.sendEmail.mock.calls[0][0];

    // Sent to the right recipient
    expect(callArg.to).toBe('admin@medikart.pk');

    // Subject contains the date range
    expect(callArg.subject).toContain('2026-08-20');

    // Has an attachment that is a non-empty Buffer
    expect(callArg.attachments).toBeDefined();
    expect(callArg.attachments.length).toBeGreaterThanOrEqual(1);
    const attachment = callArg.attachments[0];
    expect(attachment.filename).toMatch(/\.xlsx$/);
    expect(Buffer.isBuffer(attachment.content)).toBe(true);
    expect(attachment.content.length).toBeGreaterThan(0);
  });

  // ── Test 5: Zero-order report still sends one email ───────────────────────
  test('5. sendWeeklyReport: sends exactly one email even when there are zero orders in range', async () => {
    await Order.deleteMany({ 'customer.email': 'report@test.com' });

    // A window guaranteed to contain no orders
    const from = new Date('2020-01-01T00:00:00Z');
    const to   = new Date('2020-01-07T23:59:59Z');

    await sendWeeklyReport({ from, to, recipient: 'admin@medikart.pk' });

    expect(smtp.sendEmail).toHaveBeenCalledTimes(1);

    const callArg = smtp.sendEmail.mock.calls[0][0];
    expect(callArg.attachments[0].content.length).toBeGreaterThan(0); // still a valid xlsx

    // Confirm zero rows returned
    const { buffer } = await generateWeeklyReport({ from, to });
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1).filter((r) => r.length > 0);
    expect(dataRows.length).toBe(0);
  });
});
