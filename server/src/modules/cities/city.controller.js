/**
 * City controller — Phase 7.
 *
 * Thin layer per rules.md §2 — reads request, calls service, shapes response.
 * No business logic or pricing rules here.
 */

const cityService = require("./city.service");

/** POST /api/v1/admin/cities */
const createCity = async (req, res, next) => {
  try {
    const city = await cityService.createCity(req.body);
    res.status(201).json({ status: "success", data: { city } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/admin/cities */
const getAllCities = async (req, res, next) => {
  try {
    const filters = {
      active:
        req.query.active === "true"
          ? true
          : req.query.active === "false"
          ? false
          : undefined,
    };
    const cities = await cityService.getAllCities(filters);
    res.status(200).json({ status: "success", results: cities.length, data: { cities } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/admin/cities/:id */
const getCityById = async (req, res, next) => {
  try {
    const city = await cityService.getCityById(req.params.id);
    res.status(200).json({ status: "success", data: { city } });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/v1/admin/cities/:id */
const updateCity = async (req, res, next) => {
  try {
    const city = await cityService.updateCity(req.params.id, req.body);
    res.status(200).json({ status: "success", data: { city } });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/v1/admin/cities/:id */
const deleteCity = async (req, res, next) => {
  try {
    await cityService.deleteCity(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/cities/delivery-charge?city=Lahore
 *
 * Exposes getDeliveryCharge for admin tooling / testing.
 * The charge is ALWAYS computed server-side from the city name alone —
 * there is no body parameter for a charge value.
 */
const deliveryCharge = async (req, res, next) => {
  try {
    const cityName = req.query.city;
    if (!cityName) {
      return res.status(400).json({
        status: "error",
        message: "Query parameter 'city' is required",
      });
    }
    const charge = await cityService.getDeliveryCharge(cityName);
    res.status(200).json({
      status: "success",
      data: { city: cityName, deliveryCharge: charge },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCity, getAllCities, getCityById, updateCity, deleteCity, deliveryCharge };
