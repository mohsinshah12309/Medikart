/**
 * Phase 18 — Google Sheets Sync Tests (FR-SYS-03/04/05 / NFR-REL-01).
 *
 * All tests run fully offline — googleapis is mocked at module level.
 * No real network calls to Google ever happen.
 *
 * Test cases:
 *   1. Standard order enqueues exactly one row-append to "Standard Orders" tab.
 *   2. Instant order enqueues exactly one row-append to "Instant Orders" tab.
 *   3. Sheets API throws on first attempt — order still in MongoDB (DB read),
 *      sync retries rather than silently dropping.
 *   4. All retries exhausted — order intact in MongoDB, failure logged with
 *      order ID, no unhandled rejection.
 */

// ─── Load .env FIRST so MONGODB_URI is available for DB-connected tests ───────
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// ─── Mock googleapis BEFORE any module under test is required ─────────────────
jest.mock('googleapis', () => {
  const mockAppend = jest.fn();
  const mockGet = jest.fn();
  const mockSheets = {
    spreadsheets: { values: { append: mockAppend, get: mockGet } },
  };
  return {
    google: {
      auth: { JWT: jest.fn().mockImplementation(() => ({})) },
      sheets: jest.fn().mockReturnValue(mockSheets),
    },
    __mockAppend: mockAppend,
    __mockGet: mockGet,
  };
});

// ─── Imports ──────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const Order = require('../../src/modules/orders/order.model');
const sheetsSyncQueue = require('../../src/modules/integrations/sheetsSyncQueue');
const googleSheetsService = require('../../src/modules/integrations/googleSheets.service');
const { __mockAppend } = require('googleapis');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flush all pending microtasks and timers, then wait an extra real-time tick. */
const flushAsync = async (extraMs = 150) => {
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setTimeout(r, extraMs));
};

const SHEETS_OK = { data: { updates: { updatedRows: 1 } } };

const makeStandardOrder = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  type: 'standard',
  customer: {
    name: 'Ali Shah',
    email: 'ali@example.com',
    phone: '03001234567',
    address: '12 Test Street',
    city: 'Karachi',
  },
  items: [
    { name: 'Panadol', price: 50, quantity: 2 },
    { name: 'Brufen', price: 120, quantity: 1 },
  ],
  totals: { subtotal: 220, deliveryCharge: 100, total: 320 },
  paymentMethod: 'cod',
  paymentState: 'pending',
  status: 'pending',
  branchDescription: '',
  notes: '',
  createdAt: new Date('2026-08-26T12:00:00Z'),
  ...overrides,
});

const makeInstantOrder = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  type: 'instant',
  customer: {
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: '03009876543',
    address: '99 Gulshan',
    city: 'Lahore',
  },
  items: [],
  totals: { subtotal: 0, deliveryCharge: 150, total: 150 },
  paymentMethod: 'cod',
  paymentState: 'pending',
  status: 'awaiting-pharmacist-pricing',
  prescriptionUrl: '/api/v1/admin/prescriptions/rx-abc123.jpg',
  branchDescription: 'DHA Branch',
  notes: '',
  createdAt: new Date('2026-08-26T14:30:00Z'),
  ...overrides,
});

// ─── Global Setup / Teardown ──────────────────────────────────────────────────

beforeAll(async () => {
  // Connect to the configured test DB (MONGODB_URI from .env, loaded above)
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medikart_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  // Use 0 ms retry delays so retry tests finish instantly
  sheetsSyncQueue._setBaseDelayMsForTests(0);
}, 60000); // 60 s — Atlas cold-connect can take a moment

afterAll(async () => {
  sheetsSyncQueue._setBaseDelayMsForTests(5000);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}, 20000);

beforeEach(() => {
  jest.clearAllMocks();
  googleSheetsService._resetClient();

  // Google Sheets env (fake — no real network calls)
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'sa@test.iam.gserviceaccount.com';
  process.env.GOOGLE_SHEETS_PRIVATE_KEY =
    '-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n';
  process.env.GOOGLE_SHEETS_SHEET_ID = 'fake-sheet-id';
  process.env.GOOGLE_SHEETS_STANDARD_TAB = 'Standard Orders';
  process.env.GOOGLE_SHEETS_INSTANT_TAB = 'Instant Orders';

  // Default: API succeeds
  __mockAppend.mockResolvedValue(SHEETS_OK);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Phase 18 — Google Sheets Sync', () => {

  // ── Test 1 ────────────────────────────────────────────────────────────────
  test('Test 1: Standard order enqueues one row-append to "Standard Orders" with correct columns', async () => {
    const order = makeStandardOrder();

    sheetsSyncQueue.enqueueSheetSync(order);
    await flushAsync();

    expect(__mockAppend).toHaveBeenCalledTimes(1);

    const callArg = __mockAppend.mock.calls[0][0];
    const row = callArg.requestBody.values[0];

    expect(callArg.range).toContain('Standard Orders');
    expect(row[0]).toBe(order._id.toString());  // Order ID
    expect(row[2]).toBe('Ali Shah');            // Customer Name
    expect(row[3]).toBe('ali@example.com');     // Email
    expect(row[4]).toBe('03001234567');         // Phone
    expect(row[5]).toBe('12 Test Street');      // Address
    expect(row[6]).toBe('Karachi');             // City
    expect(row[7]).toContain('Panadol x2');     // Items summary
    expect(row[7]).toContain('Brufen x1');
    expect(row[8]).toBe(220);                   // Subtotal
    expect(row[9]).toBe(100);                   // Delivery Charge
    expect(row[10]).toBe(320);                  // Total
    expect(row[11]).toBe('cod');                // Payment Method
    expect(row[12]).toBe('pending');            // Payment Status
    expect(row[13]).toBe('pending');            // Order Status
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  test('Test 2: Instant order enqueues one row-append to "Instant Orders" with correct columns', async () => {
    const order = makeInstantOrder();

    sheetsSyncQueue.enqueueSheetSync(order);
    await flushAsync();

    expect(__mockAppend).toHaveBeenCalledTimes(1);

    const callArg = __mockAppend.mock.calls[0][0];
    const row = callArg.requestBody.values[0];

    expect(callArg.range).toContain('Instant Orders');
    expect(row[0]).toBe(order._id.toString());                        // Order ID
    expect(row[2]).toBe('Sara Ahmed');                                // Customer Name
    expect(row[3]).toBe('sara@example.com');                          // Email
    expect(row[7]).toContain('/api/v1/admin/prescriptions/rx-abc123.jpg'); // Prescription ref
    expect(row[8]).toBe('');                                          // Items Added (blank until priced)
    expect(row[9]).toBe(150);                                         // Total
    expect(row[10]).toBe('cod');                                      // Payment Method
    expect(row[13]).toBe('DHA Branch');                               // Branch
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  test('Test 3: Sheets API error on first attempt — order still saved in MongoDB and sync retries', async () => {
    await Order.deleteMany({ 'customer.email': 'retry@example.com' });

    // First call throws, second succeeds
    __mockAppend
      .mockRejectedValueOnce(new Error('429 Rate limit'))
      .mockResolvedValue(SHEETS_OK);

    // 1. Save order to MongoDB FIRST — exactly as the handler does
    const savedOrder = await Order.create({
      type: 'standard',
      customer: {
        name: 'Retry Customer',
        email: 'retry@example.com',
        phone: '03001111111',
        address: '1 Retry Lane',
        city: 'Islamabad',
      },
      items: [{ productId: new mongoose.Types.ObjectId(), name: 'Aspirin', price: 30, quantity: 1 }],
      totals: { subtotal: 30, deliveryCharge: 80, total: 110 },
      paymentMethod: 'cod',
      paymentState: 'pending',
      status: 'pending',
      requiresVerification: false,
    });

    // 2. Verify order is in MongoDB BEFORE any Sheets attempt
    const beforeSync = await Order.findById(savedOrder._id).lean();
    expect(beforeSync).not.toBeNull();
    expect(beforeSync._id.toString()).toBe(savedOrder._id.toString());

    // 3. Enqueue sync — fire-and-forget, as the real handler does
    sheetsSyncQueue.enqueueSheetSync(savedOrder);

    // 4. Flush — 0 ms retry delay means both attempts run synchronously in
    //    the microtask queue; just need enough ticks + a real-time gap.
    await flushAsync(300);

    // 5. appendRow was called at least twice (failed once, retried successfully)
    expect(__mockAppend.mock.calls.length).toBeGreaterThanOrEqual(2);

    // 6. Order is untouched in MongoDB — independent of Sheets outcome
    const afterSync = await Order.findById(savedOrder._id).lean();
    expect(afterSync).not.toBeNull();
    expect(afterSync.status).toBe('pending');

    await Order.deleteMany({ 'customer.email': 'retry@example.com' });
  }, 30000);

  // ── Test 4 ────────────────────────────────────────────────────────────────
  test('Test 4: All retries exhausted — order intact in MongoDB, failure logged with order ID, no unhandled exception', async () => {
    await Order.deleteMany({ 'customer.email': 'exhaust@example.com' });

    // Sheets always fails
    __mockAppend.mockRejectedValue(new Error('Sheets API permanently down'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy  = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let unhandledError = null;
    const unhandledHandler = (err) => { unhandledError = err; };
    process.on('unhandledRejection', unhandledHandler);

    // Save order to MongoDB first
    const savedOrder = await Order.create({
      type: 'instant',
      customer: {
        name: 'Exhaust Customer',
        email: 'exhaust@example.com',
        phone: '03002222222',
        address: '2 Failure Road',
        city: 'Faisalabad',
      },
      items: [],
      totals: { subtotal: 0, deliveryCharge: 120, total: 120 },
      paymentMethod: 'cod',
      paymentState: 'pending',
      status: 'awaiting-pharmacist-pricing',
      requiresVerification: false,
      prescriptionUrl: '/api/v1/admin/prescriptions/test-rx.jpg',
    });

    // Enqueue — fire-and-forget
    sheetsSyncQueue.enqueueSheetSync(savedOrder);

    // Wait for all 4 attempts (0 ms delays) to complete
    await flushAsync(500);

    // ── Assertions ──────────────────────────────────────────────────────────

    // 1. Exactly MAX_ATTEMPTS calls before giving up
    expect(__mockAppend.mock.calls.length).toBe(4);

    // 2. Order is perfectly intact in MongoDB
    const afterSync = await Order.findById(savedOrder._id).lean();
    expect(afterSync).not.toBeNull();
    expect(afterSync.status).toBe('awaiting-pharmacist-pricing');
    expect(afterSync.paymentState).toBe('pending');

    // 3. Failure logged with order ID
    const allErrors = consoleSpy.mock.calls.flat().join(' ');
    expect(allErrors).toMatch(/FAILED permanently/i);
    expect(allErrors).toContain(savedOrder._id.toString());

    // 4. No unhandled rejection
    expect(unhandledError).toBeNull();

    process.off('unhandledRejection', unhandledHandler);
    consoleSpy.mockRestore();
    warnSpy.mockRestore();

    await Order.deleteMany({ 'customer.email': 'exhaust@example.com' });
  }, 30000);
});
