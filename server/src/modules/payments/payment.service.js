const paymentGatewayFactory = require('./paymentGateway.factory');
const Order = require('../orders/order.model');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

/**
 * Initiates payment session via configured gateway
 */
const initiateCharge = async (order, gatewayName = 'kuickpay') => {
  const gateway = paymentGatewayFactory.getGateway(gatewayName);
  return await gateway.initiateCharge(order);
};

/**
 * Verifies transaction status with gateway API
 */
const verifyTransaction = async (transactionId, gatewayName = 'kuickpay') => {
  const gateway = paymentGatewayFactory.getGateway(gatewayName);
  return await gateway.verifyTransaction(transactionId);
};

/**
 * Verifies cryptographic signature or secret of incoming webhook
 */
const verifyWebhookSignature = (req, gatewayName = 'kuickpay') => {
  const gateway = paymentGatewayFactory.getGateway(gatewayName);
  return gateway.verifyWebhookSignature(req);
};

/**
 * Status-Check API Fallback:
 * Queries gateway directly for an order's payment status, updating the DB.
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

  // Resolve gateway dynamically via factory
  const gateway = paymentGatewayFactory.getGateway('kuickpay');
  const gatewayResult = await gateway.verifyTransaction(order.gatewayTransactionId);

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
  generateWebhookSignature: (payload, secret) => paymentGatewayFactory.getGateway('kuickpay').generateWebhookSignature(payload, secret),
  getPaymentGateway: (name) => paymentGatewayFactory.getGateway(name),
  registerPaymentGateway: (name, gw) => paymentGatewayFactory.registerGateway(name, gw),
};
