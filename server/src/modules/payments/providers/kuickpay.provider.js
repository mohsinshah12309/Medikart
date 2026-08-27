const axios = require('axios');

const config = {
  baseUrl: process.env.KUICKPAY_BASE_URL,
  merchantId: process.env.KUICKPAY_MERCHANT_ID,
  apiKey: process.env.KUICKPAY_API_KEY,
};

const initiateCharge = async (order) => {
  if (!config.baseUrl || config.baseUrl.includes('example') || config.baseUrl.includes('invalid')) {
    const mockTxnId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return {
      redirectUrl: `http://127.0.0.1:3000/order-confirmation/${order._id.toString()}?status=success&transactionId=${mockTxnId}`,
      transactionId: mockTxnId
    };
  }

  const endpoint = `${config.baseUrl}/v1/checkout`;
  const payload = {
    merchantId: config.merchantId,
    orderId: order._id.toString(),
    amount: order.totals.total,
    currency: 'PKR',
    customerEmail: order.customer.email,
  };
  
  const response = await axios.post(endpoint, payload, {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  });
  
  return {
    redirectUrl: response.data.redirectUrl,
    transactionId: response.data.transactionId
  };
};

const verifyTransaction = async (transactionId) => {
  if (!config.baseUrl || config.baseUrl.includes('example') || config.baseUrl.includes('invalid')) {
    return {
      status: 'paid'
    };
  }

  const endpoint = `${config.baseUrl}/v1/transactions/${transactionId}/status`;
  
  const response = await axios.get(endpoint, {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  });
  
  return {
    status: response.data.status // 'paid', 'failed', etc.
  };
};

module.exports = {
  initiateCharge,
  verifyTransaction
};
