/**
 * Sheets Sync Queue — Phase 18 (FR-SYS-05 / NFR-REL-01).
 *
 * Resilience contract:
 *   1. Order placement saves to MongoDB FIRST, then enqueues a sync job.
 *   2. The sync job runs OUTSIDE the request/response cycle (non-blocking fire-and-forget).
 *   3. Transient Sheets API errors are retried with exponential backoff.
 *   4. When all retries are exhausted the failure is logged clearly (with order ID)
 *      and the job is dropped cleanly — no unhandled exception, no impact on the order.
 *
 * Row-column mappings:
 *
 *   Standard Orders tab:
 *     Order ID | Date | Customer Name | Email | Phone | Address | City |
 *     Items | Subtotal | Delivery Charge | Total | Payment Method |
 *     Payment Status | Order Status | Branch | Notes
 *
 *   Instant Orders tab:
 *     Order ID | Date | Customer Name | Email | Phone | Address | City |
 *     Prescription | Items Added | Total | Payment Method |
 *     Payment Status | Order Status | Branch | Notes
 */

const { appendRow } = require('./googleSheets.service');

// ── Config ────────────────────────────────────────────────────────────────────

const STANDARD_TAB =
  process.env.GOOGLE_SHEETS_STANDARD_TAB || 'Standard Orders';
const INSTANT_TAB = process.env.GOOGLE_SHEETS_INSTANT_TAB || 'Instant Orders';

/** Maximum number of attempts (initial + retries). */
const MAX_ATTEMPTS = 4;

/**
 * Base delay in ms for the first retry.
 * Subsequent retries double: 5s → 10s → 20s → give up.
 * In tests, override via _setBaseDelayMsForTests().
 */
let BASE_DELAY_MS = 5_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a Date as "DD-MMM-YYYY, HH:mm" (e.g. "26-Aug-2026, 17:30").
 */
const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = months[d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mmm}-${yyyy}, ${hh}:${mm}`;
};

/**
 * Summarise an items array as "Name x2, Other x1" (truncated).
 */
const summariseItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items.map((i) => `${i.name} x${i.quantity}`).join(', ');
};

/**
 * Sleep for `ms` milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Row builders ──────────────────────────────────────────────────────────────

/**
 * Build a Standard Orders row from a saved order document.
 */
const buildStandardRow = (order) => [
  order._id.toString(),
  formatDate(order.createdAt || new Date()),
  order.customer?.name ?? '',
  order.customer?.email ?? '',
  order.customer?.phone ?? '',
  order.customer?.address ?? '',
  order.customer?.city ?? '',
  summariseItems(order.items),
  order.totals?.subtotal ?? 0,
  order.totals?.deliveryCharge ?? 0,
  order.totals?.total ?? 0,
  order.paymentMethod ?? '',
  order.paymentState ?? '',
  order.status ?? '',
  order.branchDescription ?? '',
  order.notes ?? '',
];

/**
 * Build an Instant Orders row from a saved order document.
 * prescriptionUrl is stored as the API path reference, not the file itself.
 */
const buildInstantRow = (order) => [
  order._id.toString(),
  formatDate(order.createdAt || new Date()),
  order.customer?.name ?? '',
  order.customer?.email ?? '',
  order.customer?.phone ?? '',
  order.customer?.address ?? '',
  order.customer?.city ?? '',
  order.prescriptionUrl ? `yes (${order.prescriptionUrl})` : 'no',
  summariseItems(order.items),    // blank until pharmacist prices the order
  order.totals?.total ?? 0,
  order.paymentMethod ?? '',
  order.paymentState ?? '',
  order.status ?? '',
  order.branchDescription ?? '',
  order.notes ?? '',
];

// ── Retry runner ──────────────────────────────────────────────────────────────

const activeJobs = new Set();
let shutdownInProgress = false;

/**
 * Execute `fn` with exponential-backoff retry.
 * On permanent failure, logs the error and resolves cleanly — never throws.
 *
 * @param {Function} fn        - async function to execute
 * @param {string}   label     - human-readable label for log messages
 */
const runWithRetry = async (fn, label) => {
  let delay = BASE_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (shutdownInProgress) {
      console.log(`[sheetsSync] Shutdown in progress. Aborting job: ${label}`);
      return;
    }

    try {
      await fn();
      if (attempt > 1) {
        console.log(`[sheetsSync] ${label} succeeded on attempt ${attempt}`);
      }
      return; // success
    } catch (err) {
      if (shutdownInProgress) {
        console.log(`[sheetsSync] Shutdown in progress. Aborting retry for job: ${label}`);
        return;
      }

      const isLast = attempt === MAX_ATTEMPTS;
      if (isLast) {
        // All retries exhausted — log and give up cleanly.
        console.error(
          `[sheetsSync] FAILED permanently after ${MAX_ATTEMPTS} attempts — ${label}: ${err.message}`,
        );
        return; // resolve without throwing
      }
      console.warn(
        `[sheetsSync] Attempt ${attempt}/${MAX_ATTEMPTS} failed for ${label}: ${err.message}. Retrying in ${delay}ms…`,
      );
      await sleep(delay);
      delay *= 2; // exponential backoff
    }
  }
};

// ── Public queue interface ────────────────────────────────────────────────────

/**
 * Enqueue a Google Sheets sync job for a saved order.
 *
 * MUST be called AFTER the order is persisted to MongoDB.
 * Returns immediately — the sync happens asynchronously; nothing about the
 * order's own lifecycle depends on it.
 *
 * @param {object} order - saved Mongoose order document
 */
const enqueueSheetSync = (order) => {
  if (shutdownInProgress) {
    console.warn(`[sheetsSync] Cannot enqueue sync job. Shutdown in progress.`);
    return;
  }

  const orderId = order._id?.toString() ?? 'unknown';
  const isInstant = order.type === 'instant';
  const tabName = isInstant ? INSTANT_TAB : STANDARD_TAB;
  const rowValues = isInstant ? buildInstantRow(order) : buildStandardRow(order);

  const label = `order ${orderId} → "${tabName}"`;

  // Fire-and-forget — tracked locally for graceful shutdown
  const promise = runWithRetry(() => appendRow(tabName, rowValues), label)
    .catch((err) => {
      console.error(`[sheetsSync] Unexpected error in retry runner for ${label}: ${err.message}`);
    })
    .finally(() => {
      activeJobs.delete(promise);
    });

  activeJobs.add(promise);
};

/**
 * Stop accepting new sync jobs, and wait for any active syncs to complete.
 * Resolves within a timeout to avoid hanging shutdown.
 *
 * @param {number} timeoutMs - maximum time to wait in milliseconds
 */
const waitForActiveJobs = async (timeoutMs = 5000) => {
  shutdownInProgress = true;
  if (activeJobs.size === 0) {
    return;
  }

  console.log(`[sheetsSync] Waiting for ${activeJobs.size} active Google Sheets sync jobs to drain...`);
  
  const allCompleted = Promise.all(Array.from(activeJobs));
  let timeoutHandle;
  const timeoutPromise = new Promise((resolve) => {
    timeoutHandle = setTimeout(() => {
      console.warn(`[sheetsSync] Graceful sync drain timed out after ${timeoutMs}ms. Dropping remaining active jobs.`);
      resolve();
    }, timeoutMs);
  });

  await Promise.race([allCompleted, timeoutPromise]);
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
};

module.exports = {
  enqueueSheetSync,
  waitForActiveJobs,
  // Exported for unit tests only:
  buildStandardRow,
  buildInstantRow,
  formatDate,
  STANDARD_TAB,
  INSTANT_TAB,
  /** Override retry base delay for tests — never call in production code. */
  _setBaseDelayMsForTests: (ms) => { BASE_DELAY_MS = ms; },
  /** Reset status for testing */
  _resetStatus: () => {
    shutdownInProgress = false;
    activeJobs.clear();
  }
};
