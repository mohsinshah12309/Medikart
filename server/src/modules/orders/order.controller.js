/**
 * Order controller — Phase 13 (Standard Order Workflow).
 *
 * Per rules.md §2: controllers stay thin — read the request, call the service,
 * shape the response. Business logic lives in order.service.js and handlers.
 */

const orderService = require('./order.service');

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

module.exports = { placeStandardOrder, getOrders, getOrderById };
