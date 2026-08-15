/**
 * City routes — Phase 7.
 *
 * All routes protected by auth middleware (applied in app.js before /admin/*).
 *
 * CRUD:
 *   POST   /api/v1/admin/cities
 *   GET    /api/v1/admin/cities
 *   GET    /api/v1/admin/cities/delivery-charge?city=<name>   ← FR-CW-11
 *   GET    /api/v1/admin/cities/:id
 *   PUT    /api/v1/admin/cities/:id
 *   DELETE /api/v1/admin/cities/:id
 *
 * The delivery-charge route is intentionally mounted BEFORE /:id so that
 * "delivery-charge" is not mistaken for an ObjectId param.
 *
 * Per rules.md §2: validation at the route boundary.
 */

const express = require("express");
const router = express.Router();

const cityController = require("./city.controller");
const { validate, validateParams } = require("../../middleware/validate");
const { createCitySchema, updateCitySchema, cityIdSchema } = require("./city.validation");

// POST /cities — create
router.post("/", validate(createCitySchema), cityController.createCity);

// GET /cities — list all (optional ?active=true/false filter)
router.get("/", cityController.getAllCities);

// GET /cities/delivery-charge?city=<name> — FR-CW-11 lookup (must be before /:id)
router.get("/delivery-charge", cityController.deliveryCharge);

// GET /cities/:id — single city
router.get("/:id", validateParams(cityIdSchema), cityController.getCityById);

// PUT /cities/:id — update (allow-list enforced in validation schema)
router.put(
  "/:id",
  validateParams(cityIdSchema),
  validate(updateCitySchema),
  cityController.updateCity
);

// DELETE /cities/:id
router.delete("/:id", validateParams(cityIdSchema), cityController.deleteCity);

module.exports = router;
