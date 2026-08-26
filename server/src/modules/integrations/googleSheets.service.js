/**
 * Google Sheets Integration Service — Phase 18 (FR-SYS-03/04/05).
 *
 * Authenticates via JWT (Service Account) and exposes:
 *   appendRow(tabName, rowValues)  — appends a single row to the configured sheet
 *   testConnection()               — reads header row of both tabs; use to smoke-test setup
 *
 * Auth env vars:
 *   GOOGLE_SHEETS_CLIENT_EMAIL   — service account email
 *   GOOGLE_SHEETS_PRIVATE_KEY    — PEM private key (newlines as \n in .env)
 *   GOOGLE_SHEETS_SHEET_ID       — target spreadsheet ID
 */

const { google } = require('googleapis');

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Build and return an authenticated Google Sheets API client.
 * Lazy-initialised so it is only constructed on first use.
 */
let _sheetsClient = null;

const getSheetsClient = () => {
  if (_sheetsClient) return _sheetsClient;

  /**
   * Clean an env string that dotenv may have parsed with surrounding quotes
   * and/or trailing commas (e.g. GOOGLE_SHEETS_CLIENT_EMAIL="...", ).
   * Strips leading/trailing whitespace, surrounding double-quotes,
   * trailing backslash-quote artifacts, and trailing commas — repeatedly
   * until the value is stable.
   */
  const cleanEnv = (raw = '') => {
    let v = raw.trim();
    let prev;
    do {
      prev = v;
      v = v
        .replace(/^"+|"+$/g, '') // surrounding or trailing double-quotes
        .replace(/\\+"+$/g, '')   // trailing backslash+quote: \", \\"
        .replace(/,+$/, '')      // trailing comma
        .trim();
    } while (v !== prev);
    return v;
  };

  const clientEmail = cleanEnv(process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  // .env may also store the key with literal \n — replace with real newlines
  const privateKey = cleanEnv(process.env.GOOGLE_SHEETS_PRIVATE_KEY).replace(
    /\\n/g,
    '\n',
  );

  if (!clientEmail || !privateKey) {
    throw new Error(
      '[googleSheets] GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY must be set',
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  _sheetsClient = google.sheets({ version: 'v4', auth });
  return _sheetsClient;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Append a single row to a named tab (worksheet) in the configured spreadsheet.
 *
 * @param {string}   tabName    - exact tab name as it appears in Sheets, e.g. "Standard Orders"
 * @param {Array}    rowValues  - flat array of cell values for the new row
 * @returns {Promise<object>}  - Sheets API response
 */
const appendRow = async (tabName, rowValues) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('[googleSheets] GOOGLE_SHEETS_SHEET_ID must be set');
  }

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });

  return response.data;
};

/**
 * Smoke-test: read the first row (header) of both configured tabs.
 * Logs what it finds so any typo in tab names is immediately visible.
 *
 * @returns {Promise<{ standardHeaders: string[], instantHeaders: string[] }>}
 */
const testConnection = async () => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
  const standardTab =
    process.env.GOOGLE_SHEETS_STANDARD_TAB || 'Standard Orders';
  const instantTab = process.env.GOOGLE_SHEETS_INSTANT_TAB || 'Instant Orders';

  if (!spreadsheetId) {
    throw new Error('[googleSheets] GOOGLE_SHEETS_SHEET_ID must be set');
  }

  const sheets = getSheetsClient();

  const [standardRes, instantRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${standardTab}'!1:1`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${instantTab}'!1:1`,
    }),
  ]);

  const standardHeaders = standardRes.data.values?.[0] ?? [];
  const instantHeaders = instantRes.data.values?.[0] ?? [];

  console.log('[googleSheets] testConnection OK');
  console.log(`  Standard Orders tab ("${standardTab}") header row:`, standardHeaders);
  console.log(`  Instant Orders tab  ("${instantTab}") header row:`, instantHeaders);

  return { standardHeaders, instantHeaders };
};

/**
 * Reset the cached client — only used in tests.
 * @internal
 */
const _resetClient = () => {
  _sheetsClient = null;
};

module.exports = { appendRow, testConnection, _resetClient };
