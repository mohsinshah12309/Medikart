const express = require('express');
const paymentController = require('./payment.controller');

const paymentRoutes = express.Router();

// Webhook from Kuickpay (server-to-server)
paymentRoutes.post('/webhook/kuickpay', paymentController.kuickpayWebhook);

// Status-check fallback endpoints (query Kuickpay gateway directly)
paymentRoutes.get('/orders/:id/status-check', paymentController.checkStatus);
paymentRoutes.post('/orders/:id/verify', paymentController.checkStatus);

module.exports = paymentRoutes;
