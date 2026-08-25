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

    const order = await Order.findOne({ gatewayTransactionId: transactionId });
    if (!order) {
      throw new NotFoundError('Order not found for transaction ID');
    }

    // DO NOT trust the payload status, verify independently!
    const { status } = await paymentService.verifyTransaction(transactionId);

    if (status === 'paid') {
      order.paymentState = 'paid';
      await order.save();
    } else if (status === 'failed') {
      order.paymentState = 'failed';
      await order.save();
    } else {
      // If verification returns something else like 'pending', keep it pending
      console.log(`Transaction ${transactionId} status verified as ${status}`);
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
