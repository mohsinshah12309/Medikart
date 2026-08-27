// testPhase26.js
// E2E Test Suite for Phase 26 Customer Storefront: Instant Orders, Narcotics checkout, Card checkout redirect, and Chatbot.

const path = require("path");
const fs = require("fs");
const serverNodeModules = path.join(__dirname, "server", "node_modules");

require(path.join(serverNodeModules, "dotenv")).config({
  path: path.join(__dirname, "server", ".env"),
});

const BACKEND_URL = 'http://127.0.0.1:5000/api/v1';
const TEST_EMAIL_INSTANT = 'teste2e-ph26-instant@example.com';
const TEST_EMAIL_NARCOTICS = 'teste2e-ph26-narcotics@example.com';
const TEST_EMAIL_CARD = 'teste2e-ph26-card@example.com';
const TEMP_RX_PATH = path.join(__dirname, "temp-rx.jpg");

async function logStep(name, url, method, body, response, status) {
  console.log(`\n========================================`);
  console.log(`STEP: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`METHOD: ${method}`);
  if (body) {
    console.log(`REQUEST BODY:`, typeof body === 'object' ? JSON.stringify(body, null, 2) : body);
  }
  console.log(`RESPONSE STATUS: ${status}`);
  console.log(`RESPONSE BODY:`, JSON.stringify(response, null, 2));
  console.log(`========================================`);
}

async function runE2ETest() {
  console.log('=== Starting Phase 26 E2E Storefront & Delivery Bug Test ===\n');

  // Create temporary prescription file
  const dummyBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  fs.writeFileSync(TEMP_RX_PATH, dummyBuffer);

  try {
    // 0. Seed test products and clean cities
    // Ensure we have active cities
    console.log("[INFO] Restoring Lahore and Karachi in database...");
    const mongoose = require(path.join(serverNodeModules, "mongoose"));
    await mongoose.connect(process.env.MONGODB_URI);
    
    const City = require(path.join(__dirname, "server", "src", "modules", "cities", "city.model"));
    const Product = require(path.join(__dirname, "server", "src", "modules", "products", "product.model"));
    const Otp = require(path.join(__dirname, "server", "src", "modules", "otp", "otp.model"));
    const bcrypt = require(path.join(serverNodeModules, "bcryptjs"));

    await City.findOneAndUpdate({ name: 'Lahore' }, { name: 'Lahore', deliveryCharge: 250, active: true }, { upsert: true });
    await City.findOneAndUpdate({ name: 'Karachi' }, { name: 'Karachi', deliveryCharge: 150, active: true }, { upsert: true });
    
    // Seed OTP 123456 for the three test emails
    const codeHash = await bcrypt.hash('123456', 10);
    const emailsToSeed = [TEST_EMAIL_INSTANT, TEST_EMAIL_NARCOTICS, TEST_EMAIL_CARD];
    for (const email of emailsToSeed) {
      await Otp.findOneAndUpdate(
        { email },
        { email, codeHash, expiresAt: new Date(Date.now() + 15*60*1000), verified: false, invalidated: false, attempts: 0 },
        { upsert: true }
      );
    }
    console.log("[INFO] Cities and OTPs seeded.");

    // Find a narcotics product and a standard product
    const narcoticsProduct = await Product.findOne({ isNarcotic: true, active: true });
    const standardProduct = await Product.findOne({ isNarcotic: false, active: true, stockStatus: 'in_stock' });

    if (!narcoticsProduct) {
      throw new Error("No active narcotic product found in database. Make sure testPhase23.js ran.");
    }
    if (!standardProduct) {
      throw new Error("No active standard in-stock product found in database. Make sure testPhase23.js ran.");
    }

    await mongoose.connection.close();

    // 1. Request OTP for Guest Checkout (Pre-seeded in DB for E2E consistency)
    console.log(`\n========================================`);
    console.log(`STEP: 1. Request OTP for Checkout`);
    console.log(`[INFO] OTP '123456' pre-seeded directly in MongoDB for emails`);
    console.log(`========================================`);

    const otpCode = '123456'; // Default bypass OTP for test mode

    // 2. Submit Guest Instant Order (with prescription upload)
    console.log("\n[TEST] 2. Placing Instant Prescription Order...");
    const formDataInstant = new FormData();
    formDataInstant.append('customer', JSON.stringify({
      name: 'Instant Guest Customer',
      email: TEST_EMAIL_INSTANT,
      phone: '03001234567',
      address: 'Plot 42, Sector G, Islamabad',
      city: 'Lahore'
    }));
    formDataInstant.append('paymentMethod', 'cod');
    formDataInstant.append('otp', JSON.stringify({ email: TEST_EMAIL_INSTANT, code: otpCode }));
    formDataInstant.append('branchDescription', 'Need 2 packs of Panadol and 1 box of Acefyl syrup.');
    
    // Attach dummy file
    const fileStream = fs.readFileSync(TEMP_RX_PATH);
    const fileBlob = new Blob([fileStream], { type: 'image/jpeg' });
    formDataInstant.append('prescription', fileBlob, 'temp-rx.jpg');

    const instantRes = await fetch(`${BACKEND_URL}/orders/instant`, {
      method: 'POST',
      body: formDataInstant
    });
    const instantJson = await instantRes.json();
    await logStep('2. Place Instant Order (Prescription Upload)', `${BACKEND_URL}/orders/instant`, 'POST', '[FormData]', instantJson, instantRes.status);

    if (instantRes.status !== 201) {
      throw new Error(`Instant order checkout failed with status ${instantRes.status}`);
    }

    const instantOrderId = instantJson.data?.order?._id || instantJson._id;
    console.log(`✅ Success: Instant order created with ID: ${instantOrderId}`);

    // 3. Narcotics checkout validations
    // A. Card payment must fail for narcotics
    console.log("\n[TEST] 3A. Placing Narcotics Order with CARD (should fail)...");
    const formDataNarcCard = new FormData();
    formDataNarcCard.append('customer', JSON.stringify({
      name: 'Narcotics Guest Customer',
      email: TEST_EMAIL_NARCOTICS,
      phone: '03001234567',
      address: 'Plot 42, Gulberg',
      city: 'Lahore'
    }));
    formDataNarcCard.append('items', JSON.stringify([{ productId: narcoticsProduct._id.toString(), quantity: 1 }]));
    formDataNarcCard.append('paymentMethod', 'card'); // Invalid
    formDataNarcCard.append('otp', JSON.stringify({ email: TEST_EMAIL_NARCOTICS, code: otpCode }));
    formDataNarcCard.append('prescription', fileBlob, 'temp-rx.jpg');

    const narcCardRes = await fetch(`${BACKEND_URL}/orders/narcotics`, {
      method: 'POST',
      body: formDataNarcCard
    });
    const narcCardJson = await narcCardRes.json();
    await logStep('3A. Place Narcotics Order with CARD (Rejected)', `${BACKEND_URL}/orders/narcotics`, 'POST', '[FormData]', narcCardJson, narcCardRes.status);
    
    if (narcCardRes.status !== 400) {
      throw new Error(`Expected status 400 for narcotics card payment, got ${narcCardRes.status}`);
    }
    console.log("✅ Success: Narcotics card payment blocked as expected.");

    // B. Place narcotics order without prescription file (should fail)
    console.log("\n[TEST] 3B. Placing Narcotics Order without prescription (should fail)...");
    const formDataNarcNoRx = new FormData();
    formDataNarcNoRx.append('customer', JSON.stringify({
      name: 'Narcotics Guest Customer',
      email: TEST_EMAIL_NARCOTICS,
      phone: '03001234567',
      address: 'Plot 42, Gulberg',
      city: 'Lahore'
    }));
    formDataNarcNoRx.append('items', JSON.stringify([{ productId: narcoticsProduct._id.toString(), quantity: 1 }]));
    formDataNarcNoRx.append('paymentMethod', 'cod');
    formDataNarcNoRx.append('otp', JSON.stringify({ email: TEST_EMAIL_NARCOTICS, code: otpCode }));

    const narcNoRxRes = await fetch(`${BACKEND_URL}/orders/narcotics`, {
      method: 'POST',
      body: formDataNarcNoRx
    });
    const narcNoRxJson = await narcNoRxRes.json();
    await logStep('3B. Place Narcotics Order without Rx (Rejected)', `${BACKEND_URL}/orders/narcotics`, 'POST', '[FormData]', narcNoRxJson, narcNoRxRes.status);
    
    if (narcNoRxRes.status !== 400) {
      throw new Error(`Expected status 400 for narcotics checkout without prescription, got ${narcNoRxRes.status}`);
    }
    console.log("Keep Rx Items to Checkout allowed but requires file upload.");

    // C. Place narcotics order with COD and prescription (should succeed)
    console.log("\n[TEST] 3C. Placing Narcotics Order with COD and Rx (should succeed)...");
    const formDataNarcSuccess = new FormData();
    formDataNarcSuccess.append('customer', JSON.stringify({
      name: 'Narcotics Guest Customer',
      email: TEST_EMAIL_NARCOTICS,
      phone: '03001234567',
      address: 'Plot 42, Gulberg',
      city: 'Lahore'
    }));
    formDataNarcSuccess.append('items', JSON.stringify([{ productId: narcoticsProduct._id.toString(), quantity: 1 }]));
    formDataNarcSuccess.append('paymentMethod', 'cod');
    formDataNarcSuccess.append('otp', JSON.stringify({ email: TEST_EMAIL_NARCOTICS, code: otpCode }));
    formDataNarcSuccess.append('prescription', fileBlob, 'temp-rx.jpg');

    const narcSuccessRes = await fetch(`${BACKEND_URL}/orders/narcotics`, {
      method: 'POST',
      body: formDataNarcSuccess
    });
    const narcSuccessJson = await narcSuccessRes.json();
    await logStep('3C. Place Narcotics Order (COD + Rx Upload)', `${BACKEND_URL}/orders/narcotics`, 'POST', '[FormData]', narcSuccessJson, narcSuccessRes.status);

    if (narcSuccessRes.status !== 201) {
      throw new Error(`Narcotics success order checkout failed with status ${narcSuccessRes.status}`);
    }
    console.log("✅ Success: Narcotics order placed successfully via COD + Rx.");

    // 4. Hosted checkout redirect for standard card payment
    console.log("\n[TEST] 4. Placing Standard Order with CARD & initiating payment...");
    const standardCheckoutRes = await fetch(`${BACKEND_URL}/orders/standard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Card Guest Customer',
          email: TEST_EMAIL_CARD,
          phone: '03001234567',
          address: 'Apartment 7B, DHA Phase 5',
          city: 'Karachi' // Karachi delivery charge: 150
        },
        items: [{ productId: standardProduct._id.toString(), quantity: 2 }],
        paymentMethod: 'card',
        otp: { email: TEST_EMAIL_CARD, code: otpCode }
      })
    });
    const standardCheckoutJson = await standardCheckoutRes.json();
    await logStep('4A. Place Standard Card Order', `${BACKEND_URL}/orders/standard`, 'POST', null, standardCheckoutJson, standardCheckoutRes.status);

    const stdOrderId = standardCheckoutJson.data?.order?._id || standardCheckoutJson._id;
    
    // Check delivery charge (Karachi = 150)
    console.log(`[INFO] Delivery Charge computed for Karachi: PKR ${standardCheckoutJson.data?.order?.totals?.deliveryCharge}`);
    if (standardCheckoutJson.data?.order?.totals?.deliveryCharge !== 150) {
      throw new Error(`Expected delivery charge 150 for Karachi, got ${standardCheckoutJson.data?.order?.totals?.deliveryCharge}`);
    }

    // Initiate payment
    const initPayRes = await fetch(`${BACKEND_URL}/orders/${stdOrderId}/payment/initiate`, {
      method: 'POST'
    });
    const initPayJson = await initPayRes.json();
    await logStep('4B. Initiate Card Payment (Kuickpay Redirect)', `${BACKEND_URL}/orders/${stdOrderId}/payment/initiate`, 'POST', null, initPayJson, initPayRes.status);

    if (initPayRes.status !== 200 || !initPayJson.redirectUrl) {
      throw new Error(`Payment initiation failed with status ${initPayRes.status}`);
    }
    console.log(`✅ Success: Hosted checkout URL retrieved: ${initPayJson.redirectUrl}`);

    // 5. Verify Public settings endpoint
    console.log("\n[TEST] 5. Verifying Public Settings content endpoint...");
    const publicContentRes = await fetch(`${BACKEND_URL}/content`);
    const publicContentJson = await publicContentRes.json();
    await logStep('5. Public Settings Content', `${BACKEND_URL}/content`, 'GET', null, publicContentJson, publicContentRes.status);

    if (publicContentRes.status !== 200 || !publicContentJson.data) {
      throw new Error("Failed to load public settings content");
    }
    console.log("✅ Success: Public settings returned correct fields.");

    // 6. Verify Chatbot Symptom Analysis
    console.log("\n[TEST] 6. Asking Chatbot symptom analysis...");
    const chatbotRes = await fetch(`${BACKEND_URL}/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: 'I have a mild headache and fever. Do you have any panadol?'
      })
    });
    const chatbotJson = await chatbotRes.json();
    await logStep('6. Ask Chatbot Symptom Question', `${BACKEND_URL}/chatbot`, 'POST', { symptoms: 'I have a mild headache and fever. Do you have any panadol?' }, chatbotJson, chatbotRes.status);

    if (chatbotRes.status !== 200 || !chatbotJson.data?.response) {
      throw new Error("Chatbot failed to respond");
    }
    
    const botResponse = chatbotJson.data.response;
    console.log(`[INFO] Bot Reply length: ${botResponse.length} chars`);
    
    // Check disclaimer presence
    if (!botResponse.includes("Disclaimer") && !botResponse.includes("not a doctor")) {
      throw new Error("Chatbot response is missing mandatory medical disclaimer.");
    }
    console.log("✅ Success: Chatbot returned suggestions containing medical disclaimer.");

    console.log('\n=== ALL PHASE 26 VERIFICATIONS PASSED ===\n');

  } catch (error) {
    console.error('\n❌ E2E Verification failed:', error.message);
    process.exit(1);
  } finally {
    // Delete temp prescription file
    if (fs.existsSync(TEMP_RX_PATH)) {
      fs.unlinkSync(TEMP_RX_PATH);
    }
  }
}

runE2ETest();
