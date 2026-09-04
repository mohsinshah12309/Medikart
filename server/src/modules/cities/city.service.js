/**
 * City service — Phase 7.
 *
 * Two responsibilities:
 *   1. CRUD operations on the cities collection (admin use).
 *   2. getDeliveryCharge(cityName) — the ONLY place FR-CW-11 is implemented.
 *
 * FR-CW-11 (delivery pricing rule):
 *   Given a city name, return PKR 250 if that city exists and is active in
 *   the DB, PKR 500 otherwise.
 *
 * ARCHITECTURE CONTRACT — read before adding any delivery-charge logic elsewhere:
 *   This function is intentionally the single source of truth for delivery
 *   pricing. It accepts ONLY a city name string — there is no overload, no
 *   optional charge parameter, no way for any caller to pass a charge value in.
 *   Phase 13 (checkout) and every later phase that needs a delivery charge
 *   MUST import and call this function rather than re-implementing the rule.
 *
 * Per rules.md §2: all business logic lives here, not in controllers.
 */

const City = require("./city.model");
const { NotFoundError } = require("../../utils/errors");
const redisClient = require("../../config/redisClient");

const invalidateCityCache = async () => {
  try {
    await redisClient.del("cache:storefront:cities");
  } catch (err) {
    console.error("[Cache] City invalidation error:", err.message);
  }
};

/** Fallback charge when a city is not configured or not active (FR-CW-11) */
const DEFAULT_DELIVERY_CHARGE = 500; // PKR
const CONFIGURED_DELIVERY_CHARGE_FIELD = "deliveryCharge"; // always read from DB

// ─── FR-CW-11 — Delivery Charge Calculation ──────────────────────────────────

/**
 * Get the delivery charge for a given city name.
 *
 * Rules (FR-CW-11):
 *   - City exists AND active=true  → return that city's deliveryCharge (e.g. 250)
 *   - City not found OR active=false → return DEFAULT_DELIVERY_CHARGE (500)
 *
 * @param {string} cityName  - the city name to look up (case-insensitive)
 * @returns {number}         - the delivery charge in PKR
 *
 * NOTE: This is the ONLY authorised implementation of FR-CW-11.
 *       Do NOT re-implement this logic anywhere else in the codebase.
 *       Import and call this function instead.
 */
const getDeliveryCharge = async (cityName) => {
  if (!cityName || typeof cityName !== "string") {
    return DEFAULT_DELIVERY_CHARGE;
  }

  const city = await City.findOne({
    name: { $regex: new RegExp(`^${cityName.trim()}$`, "i") }, // case-insensitive exact match
    active: true,
  });

  if (!city) {
    return DEFAULT_DELIVERY_CHARGE;
  }

  return city[CONFIGURED_DELIVERY_CHARGE_FIELD];
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

const createCity = async (cityData) => {
  const city = new City(cityData);
  await city.save();
  await invalidateCityCache();
  return city;
};

const getAllCities = async (filters = {}) => {
  const query = {};
  if (filters.active !== undefined) query.active = filters.active;
  return City.find(query).sort({ name: 1 });
};

const getCityById = async (cityId) => {
  const city = await City.findById(cityId);
  if (!city) throw new NotFoundError("City not found");
  return city;
};

const updateCity = async (cityId, updateData) => {
  const city = await City.findByIdAndUpdate(
    cityId,
    { $set: updateData },
    { new: true, runValidators: true },
  );
  if (!city) throw new NotFoundError("City not found");
  await invalidateCityCache();
  return city;
};

const deleteCity = async (cityId) => {
  const city = await City.findByIdAndDelete(cityId);
  if (!city) throw new NotFoundError("City not found");
  await invalidateCityCache();
  return city;
};

module.exports = {
  getDeliveryCharge, // FR-CW-11 — import this, never reimplement
  createCity,
  getAllCities,
  getCityById,
  updateCity,
  deleteCity,
  invalidateCityCache,
  DEFAULT_DELIVERY_CHARGE, // exported for tests/config reference
};
