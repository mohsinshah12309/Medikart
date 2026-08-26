const paymentService = require('./payment.service');
const Order = require('../orders/order.model');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

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
      throw new BadRequestError('Payment has already been initiated or processed');
    }

    const { redirectUrl, transactionId } = await paymentService.initiateCharge(order);

    order.gatewayTransactionId = transactionId;
    order.paymentState = 'pending'; // redundant, but explicitly setting
    await order.save();

    res.status(200).json({ redirectUrl, transactionId });
  } catch (err) {
    next(err);
  }
};

const kuickpayWebhook = async (req, res, next) => {
  try {
    // The webhook payload might vary; we verify it with the gateway independently
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId is required' });
    }

    // DO NOT trust the payload status, verify independently!
    const { status } = await paymentService.verifyTransaction(transactionId);

    if (status !== 'paid' && status !== 'failed') {
      console.log(`Transaction ${transactionId} status verified as ${status}. Skipping update.`);
      return res.status(200).json({ received: true });
    }

    // Atomically update the order ONLY if it is still in a pending state.
    // This makes the webhook idempotent and safe against concurrent duplicate deliveries.
    const order = await Order.findOneAndUpdate(
      { gatewayTransactionId: transactionId, paymentState: 'pending' },
      { $set: { paymentState: status } },
      { new: true }
    );

    if (!order) {
      // Check if the order exists at all.
      const exists = await Order.exists({ gatewayTransactionId: transactionId });
      if (!exists) {
        throw new NotFoundError('Order not found for transaction ID');
      }
      // If it exists but is not pending, it means another request already processed it.
      // Return success (200 OK) for idempotency.
      return res.status(200).json({ received: true });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initiatePayment,
  kuickpayWebhook
};
