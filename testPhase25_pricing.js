// testPhase25_pricing.js
// Pricing Integrity Test for Phase 25

const BACKEND_URL = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('=== Starting Pricing Integrity Test ===');

  try {
    // 1. Fetch products to get a valid active product
    const productsRes = await fetch(`${BACKEND_URL}/products`);
    const productsJson = await productsRes.json();
    
    if (!productsJson.data || !productsJson.data.products || productsJson.data.products.length === 0) {
      throw new Error('No active products found in DB. Please make sure the DB is seeded.');
    }

    // Find a non-narcotic product
    const product = productsJson.data.products.find(p => !p.isNarcotic && p.stockStatus !== 'out_of_stock');
    if (!product) {
      throw new Error('No active non-narcotic in-stock products found.');
    }

    console.log(`Using product: ${product.name} (ID: ${product._id}, DB Price: ${product.price}, Effective Price: ${product.effectivePrice})`);

    // 2. Request OTP
    console.log('Requesting OTP...');
    const otpReqRes = await fetch(`${BACKEND_URL}/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testprice@example.com' }),
    });
    const otpReqJson = await otpReqRes.json();
    console.log('OTP request response:', otpReqJson);

    // 3. Submit Order with tampered client-side prices
    console.log('Submitting standard order with tampered prices in items and totals...');
    
    const qty = 2;
    const tamperedPayload = {
      customer: {
        name: 'Price Tester',
        email: 'testprice@example.com',
        phone: '03001111111',
        address: 'Street 1, Karachi Area',
        city: 'Karachi' // Delivery charge check
      },
      items: [
        {
          productId: product._id,
          quantity: qty,
          price: 1.00, // Tampered price
          name: 'Tampered Name',
        }
      ],
      paymentMethod: 'cod',
      otp: {
        email: 'testprice@example.com',
        code: '123456'
      },
      // Tampered totals
      totals: {
        subtotal: 2.00,
        deliveryCharge: 0.00,
        total: 2.00
      }
    };

    const orderRes = await fetch(`${BACKEND_URL}/orders/standard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tamperedPayload),
    });

    const orderJson = await orderRes.json();
    
    if (orderRes.status >= 400) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderJson)}`);
    }

    console.log('Order created successfully!');
    const createdOrder = orderJson.data?.order || orderJson;

    // 5. Verify fields were NOT overridden by the client
    const expectedSubtotal = product.effectivePrice * qty;
    const actualSubtotal = createdOrder.totals.subtotal;
    const actualTotal = createdOrder.totals.total;
    const actualDelivery = createdOrder.totals.deliveryCharge;
    const orderItem = createdOrder.items[0];

    console.log('\n--- VERIFICATION RESULTS ---');
    console.log(`Product Name: ${orderItem.name} (Expected: "${product.name}")`);
    console.log(`Item Price: PKR ${orderItem.price} (Expected: ${product.effectivePrice})`);
    console.log(`Subtotal: PKR ${actualSubtotal} (Expected: ${expectedSubtotal})`);
    console.log(`Delivery Charge: PKR ${actualDelivery} (Client sent: 0.00)`);
    console.log(`Total: PKR ${actualTotal} (Expected: ${expectedSubtotal + actualDelivery})`);

    let passed = true;

    if (orderItem.name !== product.name) {
      console.error('❌ FAIL: Product name was overwritten or incorrect.');
      passed = false;
    }
    if (orderItem.price === 1.00) {
      console.error('❌ FAIL: Item price was overwritten by client (accepted PKR 1.00).');
      passed = false;
    }
    if (actualSubtotal === 2.00) {
      console.error('❌ FAIL: Subtotal was overwritten by client (accepted PKR 2.00).');
      passed = false;
    }
    if (actualDelivery === 0.00) {
      console.error('❌ FAIL: Delivery charge was overwritten by client (accepted PKR 0.00).');
      passed = false;
    }

    if (passed) {
      console.log('\n✅ PASS: Client-side pricing tampering was completely IGNORED. Integrity check verified!');
    } else {
      console.log('\n❌ FAIL: Pricing integrity check failed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error running test:', error.message);
    process.exit(1);
  }
}

runTest();
