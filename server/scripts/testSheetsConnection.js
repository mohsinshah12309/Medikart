/**
 * One-off smoke test for the Google Sheets connection (Phase 18).
 * Reads the header row of both configured tabs and prints them.
 *
 * Run from server/ directory:
 *   node scripts/testSheetsConnection.js
 */
require('dotenv').config();
const path = require('path');
const { testConnection } = require(path.join(__dirname, '../src/modules/integrations/googleSheets.service'));

testConnection()
  .then(({ standardHeaders, instantHeaders }) => {
    console.log('\n=== Smoke Test Result ===');
    console.log('Standard Orders tab headers:', JSON.stringify(standardHeaders));
    console.log('Instant Orders tab headers: ', JSON.stringify(instantHeaders));
    console.log('\n✅ Connection verified successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Connection test FAILED:', err.message);
    process.exit(1);
  });
