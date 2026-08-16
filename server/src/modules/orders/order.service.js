/**
 * Order service — Phase 13 (Standard Order Workflow).
 *
 * Delegates order placement to the correct handler by type.
 * Phase 14 (instant) and Phase 15 (narcotics) add their own handler branches.
 */

const { placeStandardOrder } = require('./standardOrder.handler');
const Order = require('./order.model');
const { BadRequestError, NotFoundError } = require('../../utils/errors');

/**
 * Route order placement to the correct handler by type.
 */
const placeOrder = async (type, payload) => {
  if (type === 'standard') return placeStandardOrder(payload);
  throw new BadRequestError(`Unknown order type: ${type}`);
};

/**
 * Get a paginated, optionally filtered list of orders (admin).
 */
const getOrders = async ({ type, status, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit };
};

/**
 * Get a single order by MongoDB ID (admin).
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  return order;
};

module.exports = { placeOrder, getOrders, getOrderById };
