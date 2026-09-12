/**
 * Product routes — Phase 4.
 *
 * Per rules.md Section 2: /api/v1/<resource>, plural nouns, standard REST
 * verbs. Request validation at the route boundary (before controller/service).
 *
 * These routes are not yet authenticated (Phase 5 adds that), but are fully
 * validated per Section 3's security requirements.
 */

const express = require("express");
const router = express.Router();

const productController = require("./product.controller");
const productDiscountController = require("./product.discount.controller");
const { validate, validateParams, validateQuery } = require("../../middleware/validate");
const requirePermission = require("../../middleware/requirePermission");
const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productImageParamsSchema,
  narcoticToggleSchema,
  bulkNarcoticsSchema,
  listProductsQuerySchema,
} = require("./product.validation");
const { productDiscountSchema } = require("./product.discount.validation");

// POST /admin/products — create new product
router.post("/", requirePermission("manage_products"), validate(createProductSchema), productController.createProduct);

// GET /admin/products — get all products (with optional filters)
router.get("/", requirePermission("view_products", "manage_products"), validateQuery(listProductsQuerySchema), productController.getAllProducts);

// ── Phase 11 — Narcotics Flagging & Audit Routes ─────────────────────────────
// GET /admin/products/narcotics — list products flagged isNarcotic: true (FR-AD-14)
router.get("/narcotics", requirePermission("view_products", "manage_products"), productController.getNarcoticProducts);

// PATCH /admin/products/bulk/narcotics — bulk add/remove narcotics flag (FR-AD-13)
router.patch(
  "/bulk/narcotics",
  requirePermission("manage_products"),
  validate(bulkNarcoticsSchema),
  productController.bulkSetNarcoticFlag
);

// PATCH /admin/products/:id/narcotics — single product narcotics flag (FR-AD-11/12)
router.patch(
  "/:id/narcotics",
  requirePermission("manage_products"),
  validateParams(productIdSchema),
  validate(narcoticToggleSchema),
  productController.setNarcoticFlag
);

// GET /admin/products/:id — get single product
router.get(
  "/:id",
  requirePermission("view_products", "manage_products"),
  validateParams(productIdSchema),
  productController.getProductById
);

// PUT /admin/products/:id — update product
router.put(
  "/:id",
  requirePermission("manage_products"),
  validateParams(productIdSchema),
  validate(updateProductSchema),
  productController.updateProduct
);


const productImagesController = require("./productImages.controller");
const upload = require("../../middleware/upload");

// POST /admin/products/:id/discount — Phase 8
router.patch(
  "/:id/discount",
  requirePermission("manage_products"),
  validateParams(productIdSchema),
  validate(productDiscountSchema),
  productDiscountController.setProductDiscount
);

// ── Phase 10 — Product Image Routes ──────────────────────────────────────────
// POST /admin/products/:id/images — upload 1+ images
router.post(
  "/:id/images",
  requirePermission("manage_products"),
  validateParams(productIdSchema),
  upload.array("images", 5),
  productImagesController.uploadProductImages
);

// PATCH /admin/products/:id/images/:imageId/primary — set primary cover image
router.patch(
  "/:id/images/:imageId/primary",
  requirePermission("manage_products"),
  validateParams(productImageParamsSchema),
  productImagesController.setPrimaryImage
);

// DELETE /admin/products/:id/images/:imageId — delete single image
router.delete(
  "/:id/images/:imageId",
  requirePermission("manage_products"),
  validateParams(productImageParamsSchema),
  productImagesController.deleteProductImage
);

// DELETE /admin/products/:id — delete product
router.delete(
  "/:id",
  requirePermission("manage_products"),
  validateParams(productIdSchema),
  productController.deleteProduct
);

module.exports = router;
