const kuickpayProvider = require('./providers/kuickpay.provider');
const Order = require('../orders/order.model');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

/**
 * Initiates payment session with Kuickpay
 */
const initiateCharge = async (order) => {
  return await kuickpayProvider.initiateCharge(order);
};

/**
 * Verifies transaction status with Kuickpay gateway API
 */
const verifyTransaction = async (transactionId) => {
  return await kuickpayProvider.verifyTransaction(transactionId);
};

/**
 * Verifies cryptographic signature or secret of incoming webhook
 */
const verifyWebhookSignature = (req) => {
  return kuickpayProvider.verifyWebhookSignature(req);
};

/**
 * Status-Check API Fallback:
 * Queries Kuickpay directly for an order's payment status, updating the DB.
 * Used as a backup when webhooks are delayed, dropped, or for manual admin verification.
 */
const checkOrderStatusFallback = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.paymentMethod !== 'card') {
    return {
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      paymentState: order.paymentState,
      message: 'Status check is only applicable for card payments',
    };
  }

  if (!order.gatewayTransactionId) {
    return {
      orderId: order._id,
      paymentState: order.paymentState,
      message: 'No gateway transaction ID associated with this order yet',
    };
  }

  // Query Kuickpay gateway API
  const gatewayResult = await kuickpayProvider.verifyTransaction(order.gatewayTransactionId);

  // If status changed and was pending, atomically update
  if (gatewayResult.status === 'paid' || gatewayResult.status === 'failed') {
    if (order.paymentState !== gatewayResult.status) {
      order.paymentState = gatewayResult.status;
      await order.save();
    }
  }

  return {
    orderId: order._id,
    orderCode: order.orderCode,
    paymentMethod: order.paymentMethod,
    paymentState: order.paymentState,
    gatewayTransactionId: order.gatewayTransactionId,
    gatewayVerification: gatewayResult,
  };
};

module.exports = {
  initiateCharge,
  verifyTransaction,
  verifyWebhookSignature,
  checkOrderStatusFallback,
  generateWebhookSignature: kuickpayProvider.generateWebhookSignature,
};
