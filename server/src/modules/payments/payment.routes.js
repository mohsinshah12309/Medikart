const express = require('express');
const paymentController = require('./payment.controller');

const paymentRoutes = express.Router();

// Webhook from Kuickpay
paymentRoutes.post('/webhook/kuickpay', paymentController.kuickpayWebhook);

module.exports = paymentRoutes;
