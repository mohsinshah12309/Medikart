/**
 * Order controller — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Per rules.md §2: controllers stay thin — read the request, call the service,
 * shape the response. Business logic lives in order.service.js and handlers.
 */

const orderService = require('./order.service');
const { prescriptionUpload } = require('./instantOrder.handler');

const placeStandardOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder('standard', req.body);
    res.status(201).json({
      status: 'success',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const placeInstantOrder = async (req, res, next) => {
  // Use multer middleware to handle prescription file upload
  prescriptionUpload(req, res, async (err) => {
    if (err) return next(err);

    try {
      const payload = {
        customer: req.body.customer ? JSON.parse(req.body.customer) : undefined,
        paymentMethod: req.body.paymentMethod,
        otp: req.body.otp ? JSON.parse(req.body.otp) : undefined,
        branchDescription: req.body.branchDescription,
        prescriptionFilename: req.file ? req.file.filename : null,
      };

      const order = await orderService.placeOrder('instant', payload);
      res.status(201).json({
        status: 'success',
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  });
};

const getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

const priceInstantOrder = async (req, res, next) => {
  try {
    const order = await orderService.priceInstantOrder(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeStandardOrder, placeInstantOrder, getOrders, getOrderById, priceInstantOrder };
