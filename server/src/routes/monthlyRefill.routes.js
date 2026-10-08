/**
 * Monthly Refill Express Routes — Hardened Zero-Trust Ingress Boundary.
 *
 * Middleware chaining pipeline:
 *   rateLimiter -> verifyCustomerJWT -> authorizeRoles('customer') -> validateRequest(schema) -> Controller Handlers
 *
 * Defends strictly against:
 *   - OWASP A01 (Broken Access Control / BOLA): Customer token isolation
 *   - OWASP A03 (Injection): Regex-validated parameters & schemas
 *   - OWASP A04 (Insecure Design): Granular sliding-window rate limiters
 *   - OWASP A05 (Security Misconfiguration): Explicit verb mapping
 *   - OWASP A07 (Auth Failures): Mandatory active, verified customer JWT
 */

const express = require("express");
const router = express.Router();

const monthlyRefillController = require("../controllers/monthlyRefill.controller");
const { verifyCustomerJWT, authorizeRoles } = require("../middleware/customerAuth");
const { validate, validateParams, validateQuery } = require("../middleware/validate");
const { createRateLimiter } = require("../middleware/rateLimiter");

const {
  createRefillSchema,
  updateRefillSchema,
  refillQuerySchema,
  refillParamIdSchema,
} = require("../validators/monthlyRefill.validator");

// 1. Dedicated CRUD rate limiter: Max 30 requests per 15-minute window per user/IP
const refillCrudLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many monthly refill requests. Please wait a few minutes before trying again.",
});

// 2. Strict rate limiter for outbound email test triggers: Max 3 per 15-minute window
const refillReminderTestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Reminder email testing limit reached (3 per 15 minutes). Please try again later.",
});

// Enforce authentication & customer-only role boundary on all monthly refill endpoints
router.use(refillCrudLimiter);
router.use(verifyCustomerJWT);
router.use(authorizeRoles("customer"));

// ─── COLLECTION LEVEL ROUTES ──────────────────────────────────────────────────

// GET / - Retrieve customer's monthly refill list with pagination and projection
router.get(
  "/",
  validateQuery(refillQuerySchema),
  monthlyRefillController.getRefillList
);

// POST / - Add items or initialize monthly refill routine
router.post(
  "/",
  validate(createRefillSchema),
  monthlyRefillController.createRefill
);

// DELETE / - Clear all items from customer's active monthly refill routine
router.delete(
  "/",
  monthlyRefillController.clearRefillList
);

// POST /test-reminder - Trigger on-demand test email reminder with strict rate limiting
router.post(
  "/test-reminder",
  refillReminderTestLimiter,
  monthlyRefillController.triggerManualReminderTest
);

// POST /reorder - One-click reorder current items and reset reminder schedule
router.post(
  "/reorder",
  monthlyRefillController.reorderRefill
);

// ─── RESOURCE & ITEM LEVEL ROUTES ─────────────────────────────────────────────

// GET /:id - Retrieve single subscription details with ownership verification
router.get(
  "/:id",
  validateParams(refillParamIdSchema),
  monthlyRefillController.getRefillById
);

// PATCH /:id - Update status, frequency, or item quantity with ownership verification
router.patch(
  "/:id",
  validateParams(refillParamIdSchema),
  validate(updateRefillSchema),
  monthlyRefillController.updateRefill
);

// PUT /:id - Full update of refill subscription
router.put(
  "/:id",
  validateParams(refillParamIdSchema),
  validate(updateRefillSchema),
  monthlyRefillController.updateRefill
);

// DELETE /:id - Soft-delete subscription or remove single item with ownership verification
router.delete(
  "/:id",
  validateParams(refillParamIdSchema),
  monthlyRefillController.deleteRefill
);

module.exports = router;
