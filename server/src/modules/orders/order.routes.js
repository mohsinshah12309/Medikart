/**
 * Order routes — Phase 13 (Standard Order Workflow), Phase 14 (Instant Order Workflow).
 *
 * Two routers are exported — one public, one admin — and mounted separately
 * in app.js so the auth middleware applies only to the admin routes.
 *
 * Public:
 *   POST /api/v1/orders/standard  — place a standard COD order (no auth)
 *   POST /api/v1/orders/instant   — place an instant order with prescription upload (no auth)
 *
 * Admin (behind auth middleware):
 *   GET   /api/v1/admin/orders         — list orders, filterable by type/status
 *   GET   /api/v1/admin/orders/:id     — single order detail
 *   PATCH /api/v1/admin/orders/:id/items — price an instant order (Phase 14 / FR-AD-19)
 */

const express = require("express");
const {
  validate,
  validateQuery,
  validateParams,
} = require("../../middleware/validate");
const {
  placeStandardOrderSchema,
  priceInstantOrderSchema,
  adminOrderQuerySchema,
  orderIdParamsSchema,
  narcoticsVerificationSchema,
} = require("./order.validation");
const orderController = require("./order.controller");

// ── Public routes ─────────────────────────────────────────────────────────────
const publicOrderRoutes = express.Router();

publicOrderRoutes.post(
  "/standard",
  validate(placeStandardOrderSchema),
  orderController.placeStandardOrder,
);

// Instant order route — multipart/form-data handled by multer in controller
publicOrderRoutes.post("/instant", orderController.placeInstantOrder);

// Narcotics order route — multipart/form-data, prescription upload required
// when the cart contains a narcotics-flagged product (Phase 15 / FR-CW-13/14).
// Multer (prescriptionUpload) runs inside the controller.
publicOrderRoutes.post("/narcotics", orderController.placeNarcoticsOrder);

const paymentController = require("../payments/payment.controller");
publicOrderRoutes.post(
  "/:id/payment/initiate",
  validateParams(orderIdParamsSchema),
  paymentController.initiatePayment
);

// ── Admin routes (mounted behind auth in app.js) ──────────────────────────────
const adminOrderRoutes = express.Router();

adminOrderRoutes.get(
  "/",
  validateQuery(adminOrderQuerySchema),
  orderController.getOrders,
);

adminOrderRoutes.get(
  "/:id",
  validateParams(orderIdParamsSchema),
  orderController.getOrderById,
);

adminOrderRoutes.patch(
  "/:id/items",
  validateParams(orderIdParamsSchema),
  validate(priceInstantOrderSchema),
  orderController.priceInstantOrder,
);

// PATCH /api/v1/admin/orders/:id/verification — approve/reject a narcotics
// prescription (Phase 15 / FR-AD-20). Auth applied at mount point in app.js.
adminOrderRoutes.patch(
  "/:id/verification",
  validateParams(orderIdParamsSchema),
  validate(narcoticsVerificationSchema),
  orderController.reviewNarcoticsOrder,
);

module.exports = { publicOrderRoutes, adminOrderRoutes };
