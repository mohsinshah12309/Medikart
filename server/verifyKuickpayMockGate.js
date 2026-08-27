// verifyKuickpayMockGate.js
// Verification for the hardened Kuickpay mock gating logic

require('dotenv').config({ path: './.env' });
const kuickpayProvider = require('./src/modules/payments/providers/kuickpay.provider');

async function testProvider() {
  console.log('=== Starting Kuickpay Mock Gate Gating Verification ===\n');

  const dummyOrder = {
    _id: '6a8f8bfeabbc66ed1255ae44',
    totals: { total: 500 },
    customer: { email: 'customer@test.com' }
  };

  // 1. Test Mock Path explicitly enabled
  console.log('[TEST 1] Testing with PAYMENTS_MOCK_MODE=true');
  process.env.PAYMENTS_MOCK_MODE = 'true';
  try {
    const result = await kuickpayProvider.initiateCharge(dummyOrder);
    console.log('Result:', result);
    if (result.transactionId && result.redirectUrl.includes('transactionId=')) {
      console.log('✅ TEST 1 PASSED: Mock mode successfully triggered.');
    } else {
      throw new Error('Test 1 failed: mock charge was not triggered correctly.');
    }
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.message);
    process.exit(1);
  }

  // 2. Test Real Path explicitly disabled (mock mode false)
  console.log('\n[TEST 2] Testing with PAYMENTS_MOCK_MODE=false');
  process.env.PAYMENTS_MOCK_MODE = 'false';
  // Set baseUrl so it tries to hit a real endpoint
  process.env.KUICKPAY_BASE_URL = 'http://127.0.0.1:9999'; 
  try {
    const result = await kuickpayProvider.initiateCharge(dummyOrder);
    console.error('❌ TEST 2 FAILED: Real path did not attempt Axios request, returned mock instead.', result);
    process.exit(1);
  } catch (err) {
    // It should throw an Axios connection or DNS error because the server/host is not real/active
    console.log('Result error (expected since mock is bypassed):', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('connect') || err.message.includes('ENOTFOUND')) {
      console.log('✅ TEST 2 PASSED: Bypassed mock and successfully attempted real Axios connection/DNS lookup.');
    } else {
      console.error('❌ TEST 2 FAILED with unexpected error:', err.message);
      process.exit(1);
    }
  }

  console.log('\n✅ ALL MOCK GATING TESTS PASSED!');
  process.exit(0);
}

testProvider();
