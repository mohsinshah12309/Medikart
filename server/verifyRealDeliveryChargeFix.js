// verifyRealDeliveryChargeFix.js
// Verification Script for Standard Order Delivery Charge Fix (No direct city seeding)

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Otp = require('./src/modules/otp/otp.model');

const BACKEND_URL = 'http://127.0.0.1:5000/api/v1';
const ADMIN_EMAIL = 'alishahmohsin938@gmail.com';
const ADMIN_PASS = 'medikart@03314170744Abdullah';
const TEST_EMAIL = 'teste2e@example.com';

async function logStep(name, url, method, body, response, status) {
  console.log(`\n========================================`);
  console.log(`STEP: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`METHOD: ${method}`);
  if (body) {
    console.log(`REQUEST BODY:`, JSON.stringify(body, null, 2));
  }
  console.log(`RESPONSE STATUS: ${status}`);
  console.log(`RESPONSE BODY:`, JSON.stringify(response, null, 2));
  console.log(`========================================`);
}

async function seedOtp() {
  const codeHash = await bcrypt.hash('123456', 10);
  await Otp.findOneAndUpdate(
    { email: TEST_EMAIL },
    { 
      email: TEST_EMAIL, 
      codeHash, 
      expiresAt: new Date(Date.now() + 15*60*1000), 
      verified: false, 
      invalidated: false, 
      attempts: 0 
    },
    { upsert: true }
  );
  console.log(`[DB SEED] OTP '123456' seeded directly for ${TEST_EMAIL}`);
}

async function runVerification() {
  console.log('=== Starting Real REST-only Delivery Charge Verification ===\n');

  try {
    // Connect to MongoDB for OTP seeding helper
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Connected to MongoDB for helper.');

    // 1. Admin Login (Retrieve JWT)
    const loginUrl = `${BACKEND_URL}/auth/admin/login`;
    const loginBody = { email: ADMIN_EMAIL, password: ADMIN_PASS };
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginBody)
    });
    const loginJson = await loginRes.json();
    await logStep('1. Admin Login', loginUrl, 'POST', loginBody, loginJson, loginRes.status);

    const adminToken = loginJson.data?.token || loginJson.token;
    if (!adminToken) {
      throw new Error('Admin login failed; no token returned.');
    }

    // 2. Retrieve existing cities list to clean up Lahore and Karachi
    const listCitiesUrl = `${BACKEND_URL}/admin/cities`;
    const listCitiesRes = await fetch(listCitiesUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const listCitiesJson = await listCitiesRes.json();
    await logStep('2. List Admin Cities for Cleanup', listCitiesUrl, 'GET', null, listCitiesJson, listCitiesRes.status);

    const cities = listCitiesJson.data?.cities || [];
    for (const city of cities) {
      if (city.name === 'Lahore' || city.name === 'Karachi') {
        const deleteUrl = `${BACKEND_URL}/admin/cities/${city._id}`;
        const deleteRes = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log(`[CLEANUP] Deleted existing city: ${city.name} (Status: ${deleteRes.status})`);
      }
    }

    // 3. Configure Lahore via Admin API
    const createLahoreUrl = `${BACKEND_URL}/admin/cities`;
    const createLahoreBody = { name: 'Lahore', deliveryCharge: 250, active: true };
    const createLahoreRes = await fetch(createLahoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(createLahoreBody)
    });
    const createLahoreJson = await createLahoreRes.json();
    await logStep('3. Configure Lahore via Admin API (250 PKR)', createLahoreUrl, 'POST', createLahoreBody, createLahoreJson, createLahoreRes.status);

    // 4. Configure Karachi via Admin API
    const createKarachiUrl = `${BACKEND_URL}/admin/cities`;
    const createKarachiBody = { name: 'Karachi', deliveryCharge: 150, active: true };
    const createKarachiRes = await fetch(createKarachiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(createKarachiBody)
    });
    const createKarachiJson = await createKarachiRes.json();
    await logStep('4. Configure Karachi via Admin API (150 PKR)', createKarachiUrl, 'POST', createKarachiBody, createKarachiJson, createKarachiRes.status);

    // 5. Fetch public active cities dropdown list (storefront API)
    const storefrontCitiesUrl = `${BACKEND_URL}/cities`;
    const storefrontCitiesRes = await fetch(storefrontCitiesUrl);
    const storefrontCitiesJson = await storefrontCitiesRes.json();
    await logStep('5. Fetch Storefront Dropdown Cities List', storefrontCitiesUrl, 'GET', null, storefrontCitiesJson, storefrontCitiesRes.status);

    const storefrontCityNames = (storefrontCitiesJson.data?.cities || []).map(c => c.name);
    console.log(`[VERIFICATION] Storefront cities list has Lahore? ${storefrontCityNames.includes('Lahore')}`);
    console.log(`[VERIFICATION] Storefront cities list has Karachi? ${storefrontCityNames.includes('Karachi')}`);
    if (!storefrontCityNames.includes('Lahore') || !storefrontCityNames.includes('Karachi')) {
      throw new Error('Newly created cities are missing from public storefront list.');
    }

    // 6. Find standard product for testing
    const productsRes = await fetch(`${BACKEND_URL}/products`);
    const productsJson = await productsRes.json();
    const standardProduct = (productsJson.data?.products || []).find(p => !p.isNarcotic && p.stockStatus === 'in_stock');
    if (!standardProduct) {
      throw new Error('No active standard product found in DB. Run testPhase23.js first.');
    }
    console.log(`[INFO] Using standard product: ${standardProduct.name} (ID: ${standardProduct._id})`);

    // 7. Seed OTP for Lahore checkout
    await seedOtp();

    // 8. Place standard order with Lahore and check deliveryCharge
    const checkoutUrl = `${BACKEND_URL}/orders/standard`;
    const checkoutLahoreBody = {
      customer: {
        name: 'E2E Lahore Guest',
        email: TEST_EMAIL,
        phone: '03310000000',
        address: 'Gulberg, Lahore',
        city: 'Lahore'
      },
      items: [{ productId: standardProduct._id, quantity: 1 }],
      paymentMethod: 'cod',
      otp: { email: TEST_EMAIL, code: '123456' }
    };
    const checkoutLahoreRes = await fetch(checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutLahoreBody)
    });
    const checkoutLahoreJson = await checkoutLahoreRes.json();
    await logStep('8. Place Standard Order (Lahore)', checkoutUrl, 'POST', checkoutLahoreBody, checkoutLahoreJson, checkoutLahoreRes.status);

    const chargeLahore = checkoutLahoreJson.data?.order?.totals?.deliveryCharge;
    console.log(`[VERIFICATION] Lahore Delivery Charge: PKR ${chargeLahore} (Expected: 250)`);
    if (chargeLahore !== 250) {
      throw new Error(`Expected delivery charge 250 for Lahore, got ${chargeLahore}`);
    }

    // 9. Seed OTP for Karachi checkout
    await seedOtp();

    // 10. Place standard order with Karachi and check deliveryCharge
    const checkoutKarachiBody = {
      customer: {
        name: 'E2E Karachi Guest',
        email: TEST_EMAIL,
        phone: '03310000000',
        address: 'DHA, Karachi',
        city: 'Karachi'
      },
      items: [{ productId: standardProduct._id, quantity: 1 }],
      paymentMethod: 'cod',
      otp: { email: TEST_EMAIL, code: '123456' }
    };
    const checkoutKarachiRes = await fetch(checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutKarachiBody)
    });
    const checkoutKarachiJson = await checkoutKarachiRes.json();
    await logStep('10. Place Standard Order (Karachi)', checkoutUrl, 'POST', checkoutKarachiBody, checkoutKarachiJson, checkoutKarachiRes.status);

    const chargeKarachi = checkoutKarachiJson.data?.order?.totals?.deliveryCharge;
    console.log(`[VERIFICATION] Karachi Delivery Charge: PKR ${chargeKarachi} (Expected: 150)`);
    if (chargeKarachi !== 150) {
      throw new Error(`Expected delivery charge 150 for Karachi, got ${chargeKarachi}`);
    }

    // 11. Seed OTP for Multan checkout
    await seedOtp();

    // 12. Place standard order with unconfigured city (Multan) and verify 500 PKR fallback
    const checkoutMultanBody = {
      customer: {
        name: 'E2E Multan Guest',
        email: TEST_EMAIL,
        phone: '03310000000',
        address: 'Cantt, Multan',
        city: 'Multan'
      },
      items: [{ productId: standardProduct._id, quantity: 1 }],
      paymentMethod: 'cod',
      otp: { email: TEST_EMAIL, code: '123456' }
    };
    const checkoutMultanRes = await fetch(checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutMultanBody)
    });
    const checkoutMultanJson = await checkoutMultanRes.json();
    await logStep('12. Place Standard Order (Multan - Fallback)', checkoutUrl, 'POST', checkoutMultanBody, checkoutMultanJson, checkoutMultanRes.status);

    const chargeMultan = checkoutMultanJson.data?.order?.totals?.deliveryCharge;
    console.log(`[VERIFICATION] Multan Delivery Charge: PKR ${chargeMultan} (Expected: 500)`);
    if (chargeMultan !== 500) {
      throw new Error(`Expected delivery charge 500 for Multan, got ${chargeMultan}`);
    }

    console.log('\n✅ ALL REAL REST-ONLY DELIVERY CHARGE VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ E2E Real Delivery Charge Verification failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runVerification();
