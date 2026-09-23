const axios = require('axios');
const crypto = require('crypto');

/**
 * Kuickpay Payment Provider Configuration
 * 
 * Clean separation of SANDBOX/UAT vs PRODUCTION endpoints.
 * Defaults strictly to 'sandbox' unless KUICKPAY_ENV === 'production'.
 */
const getKuickpayConfig = () => {
  const env = (process.env.KUICKPAY_ENV || 'sandbox').toLowerCase();
  const sandboxUrl = process.env.KUICKPAY_SANDBOX_URL || 'https://uat.kuickpay.com';
  const productionUrl = process.env.KUICKPAY_PRODUCTION_URL || 'https://api.kuickpay.com';

  // Base URL resolution:
  // 1. Explicit KUICKPAY_BASE_URL if set
  // 2. Otherwise chooses sandboxUrl or productionUrl based on KUICKPAY_ENV
  const baseUrl = process.env.KUICKPAY_BASE_URL || (env === 'production' ? productionUrl : sandboxUrl);

  const merchantId = process.env.KUICKPAY_MERCHANT_ID || 'MEDIKART_UAT_MERCHANT';
  const apiKey = process.env.KUICKPAY_API_KEY || process.env.KUICKPAY_SECURE_KEY || 'MEDIKART_UAT_API_KEY';
  const webhookSecret = process.env.KUICKPAY_WEBHOOK_SECRET || process.env.KUICKPAY_SECURE_KEY || 'medikart_kuickpay_webhook_secret_uat';

  return {
    env,
    sandboxUrl,
    productionUrl,
    baseUrl,
    merchantId,
    apiKey,
    webhookSecret,
  };
};

/**
 * Determines whether the provider runs in local mock simulation mode
 */
const isMockMode = () => {
  if (process.env.PAYMENTS_MOCK_MODE === 'true') return true;
  if (process.env.PAYMENTS_MOCK_MODE === 'false') return false;
  if (process.env.NODE_ENV === 'test') return true;
  
  const config = getKuickpayConfig();
  return (
    !config.baseUrl ||
    config.baseUrl.includes('example') ||
    config.baseUrl.includes('invalid') ||
    config.merchantId === 'PENDING_FROM_BANK'
  );
};

/**
 * Generates an HMAC-SHA256 signature for webhook payload verification
 */
const generateWebhookSignature = (payload, secret) => {
  const secretKey = secret || getKuickpayConfig().webhookSecret;
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
};

/**
 * Verifies the authenticity of an incoming Kuickpay webhook
 * 
 * Supports:
 *  1. Header 'x-kuickpay-signature' / 'x-signature' (HMAC-SHA256)
 *  2. Header 'x-webhook-secret'
 *  3. Body parameter 'signature' / 'secureHash'
 */
const verifyWebhookSignature = (req) => {
  const config = getKuickpayConfig();
  const secret = config.webhookSecret;

  if (!secret) {
    console.warn('[Kuickpay Webhook] Warning: KUICKPAY_WEBHOOK_SECRET not configured.');
    return false;
  }

  // Check header-based HMAC signature
  const headerSignature = req.headers['x-kuickpay-signature'] || req.headers['x-signature'];
  if (headerSignature) {
    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    if (
      headerSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(headerSignature), Buffer.from(expectedSignature))
    ) {
      return true;
    }
  }

  // Check header-based shared secret token
  const secretToken = req.headers['x-webhook-secret'] || req.headers['x-api-key'];
  if (secretToken && secretToken === secret) {
    return true;
  }

  // Check body-based signature or secureHash
  if (req.body && (req.body.signature || req.body.secureHash)) {
    const bodySig = req.body.signature || req.body.secureHash;
    const bodyClone = { ...req.body };
    delete bodyClone.signature;
    delete bodyClone.secureHash;

    const computedSig = crypto.createHmac('sha256', secret).update(JSON.stringify(bodyClone)).digest('hex');
    if (
      bodySig.length === computedSig.length &&
      crypto.timingSafeEqual(Buffer.from(bodySig), Buffer.from(computedSig))
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Initiates a hosted charge session with Kuickpay.
 * PCI-DSS SAQ-A compliant: Cardholder PAN/CVV is collected on Kuickpay's hosted domain.
 */
const initiateCharge = async (order) => {
  const config = getKuickpayConfig();

  if (isMockMode()) {
    const mockTxnId = `TXN-KP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const frontendUrl = process.env.FRONTEND_URL || process.env.STOREFRONT_URL || 'https://medikart.pk';
    return {
      redirectUrl: `${config.baseUrl}/pay/checkout?token=${mockTxnId}&orderId=${order._id.toString()}&amount=${order.totals?.total || 0}`,
      transactionId: mockTxnId,
      environment: config.env,
      isHosted: true,
    };
  }

  const endpoint = `${config.baseUrl}/v1/checkout`;
  const returnUrlBase = process.env.FRONTEND_URL || process.env.STOREFRONT_URL || 'https://medikart.pk';
  const payload = {
    merchantId: config.merchantId,
    orderId: order._id.toString(),
    amount: order.totals?.total,
    currency: 'PKR',
    customerEmail: order.customer?.email,
    customerPhone: order.customer?.phone,
    returnUrl: `${returnUrlBase}/order-confirmation/${order._id.toString()}`,
  };

  const response = await axios.post(endpoint, payload, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  return {
    redirectUrl: response.data.redirectUrl || response.data.paymentUrl,
    transactionId: response.data.transactionId || response.data.token,
    environment: config.env,
    isHosted: true,
  };
};

/**
 * Queries Kuickpay's status-check API to verify a transaction independently
 */
const verifyTransaction = async (transactionId) => {
  const config = getKuickpayConfig();

  if (isMockMode()) {
    // In mock mode:
    // If transactionId contains 'FAIL', 'DECLINE', 'FORGED', or 'INVALID', simulate decline
    if (/FAIL|DECLINE|FORGED|INVALID|REJECT/i.test(transactionId)) {
      return {
        status: 'failed',
        transactionId,
        gatewayResponse: 'Declined: Insufficient Funds / Invalid Card in Sandbox',
      };
    }
    return {
      status: 'paid',
      transactionId,
      gatewayResponse: 'Approved: 00 Sandbox Test Payment Success',
    };
  }

  const endpoint = `${config.baseUrl}/v1/transactions/${transactionId}/status`;

  const response = await axios.get(endpoint, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    timeout: 10000,
  });

  const rawStatus = (response.data.status || response.data.paymentStatus || '').toLowerCase();
  let normalizedStatus = 'pending';
  if (['paid', 'success', 'approved', 'captured', '00'].includes(rawStatus)) {
    normalizedStatus = 'paid';
  } else if (['failed', 'declined', 'cancelled', 'rejected', 'error'].includes(rawStatus)) {
    normalizedStatus = 'failed';
  }

  return {
    status: normalizedStatus,
    transactionId,
    gatewayResponse: response.data,
  };
};

module.exports = {
  getKuickpayConfig,
  isMockMode,
  generateWebhookSignature,
  verifyWebhookSignature,
  initiateCharge,
  verifyTransaction,
};
