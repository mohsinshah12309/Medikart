/**
 * Settings controller — Phase 8.
 * Thin layer for the storewide discount endpoint.
 */

const settingsService = require("./settings.service");

/** PUT /api/v1/admin/settings/discount */
const setStorewideDiscount = async (req, res, next) => {
  try {
    const settings = await settingsService.setStorewideDiscount(req.body);
    res.status(200).json({ status: "success", data: { storewideDiscount: settings.storewideDiscount } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/admin/settings/discount */
const getStorewideDiscount = async (req, res, next) => {
  try {
    const value = await settingsService.getStorewideDiscount();
    res.status(200).json({ status: "success", data: { storewideDiscountPercent: value } });
  } catch (error) {
    next(error);
  }
};

module.exports = { setStorewideDiscount, getStorewideDiscount };
