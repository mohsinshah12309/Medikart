const paymentService = require('./payment.service');
const Order = require('../orders/order.model');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../../utils/errors');

/**
 * Initiates hosted checkout redirect with Kuickpay
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.paymentMethod !== 'card') {
      throw new BadRequestError('Payment initiation is only for card payments');
    }

    if (order.paymentState !== 'pending') {
      throw new BadRequestError('Payment has already been processed or completed');
    }

    const { redirectUrl, transactionId, environment, isHosted } = await paymentService.initiateCharge(order);

    order.gatewayTransactionId = transactionId;
    order.paymentState = 'pending';
    await order.save();

    res.status(200).json({
      redirectUrl,
      transactionId,
      environment: environment || 'sandbox',
      isHosted: isHosted !== false,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Server-to-server webhook notification handler from Kuickpay
 * 
 * Enforces:
 *  1. Cryptographic signature/authenticity verification
 *  2. Independent server-side transaction status verification
 *  3. Idempotent atomic database updates
 *  4. Graceful handling of missing orders or duplicate calls
 */
const kuickpayWebhook = async (req, res, next) => {
  try {
    // 1. Webhook Security Check: Verify signature / secret
    const isAuthentic = paymentService.verifyWebhookSignature(req);
    if (!isAuthentic) {
      return res.status(401).json({
        status: 'fail',
        error: 'Unauthorized: Invalid or missing webhook signature/secret',
      });
    }

    const { transactionId } = req.body || {};

    if (!transactionId) {
      return res.status(400).json({
        status: 'fail',
        error: 'transactionId is required in webhook payload',
      });
    }

    // 2. Independent Gateway Verification: Never trust payload status blindly
    const { status } = await paymentService.verifyTransaction(transactionId);

    if (status !== 'paid' && status !== 'failed') {
      return res.status(200).json({
        received: true,
        message: `Transaction ${transactionId} verified as '${status}'. No state update needed.`,
      });
    }

    // 3. Atomic Idempotent Database Update
    const order = await Order.findOneAndUpdate(
      { gatewayTransactionId: transactionId, paymentState: 'pending' },
      { $set: { paymentState: status } },
      { new: true }
    );

    if (!order) {
      const exists = await Order.exists({ gatewayTransactionId: transactionId });
      if (!exists) {
        throw new NotFoundError(`Order not found for transaction ID: ${transactionId}`);
      }
      // If already processed, return 200 OK for idempotency (retries are safe)
      return res.status(200).json({
        received: true,
        idempotent: true,
        message: 'Webhook received. Order already updated previously.',
      });
    }

    res.status(200).json({
      received: true,
      orderId: order._id,
      paymentState: order.paymentState,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Status-Check API Fallback Endpoint:
 * Allows polling or manual admin trigger to check payment status on Kuickpay directly
 */
const checkStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await paymentService.checkOrderStatusFallback(id);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initiatePayment,
  kuickpayWebhook,
  checkStatus,
};
