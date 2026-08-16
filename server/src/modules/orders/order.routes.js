/**
 * Order routes — Phase 13 (Standard Order Workflow).
 *
 * Two routers are exported — one public, one admin — and mounted separately
 * in app.js so the auth middleware applies only to the admin routes.
 *
 * Public:
 *   POST /api/v1/orders/standard  — place a standard COD order (no auth)
 *
 * Admin (behind auth middleware):
 *   GET  /api/v1/admin/orders      — list orders, filterable by type/status
 *   GET  /api/v1/admin/orders/:id  — single order detail
 */

const express = require('express');
const { validate, validateQuery, validateParams } = require('../../middleware/validate');
const {
  placeStandardOrderSchema,
  adminOrderQuerySchema,
  orderIdParamsSchema,
} = require('./order.validation');
const orderController = require('./order.controller');

// ── Public routes ─────────────────────────────────────────────────────────────
const publicOrderRoutes = express.Router();

publicOrderRoutes.post(
  '/standard',
  validate(placeStandardOrderSchema),
  orderController.placeStandardOrder
);

// ── Admin routes (mounted behind auth in app.js) ──────────────────────────────
const adminOrderRoutes = express.Router();

adminOrderRoutes.get(
  '/',
  validateQuery(adminOrderQuerySchema),
  orderController.getOrders
);

adminOrderRoutes.get(
  '/:id',
  validateParams(orderIdParamsSchema),
  orderController.getOrderById
);

module.exports = { publicOrderRoutes, adminOrderRoutes };
