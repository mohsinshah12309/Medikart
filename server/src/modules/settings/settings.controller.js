/**
 * Settings controller — Phase 8 (storewide discount) + Phase 24 (page content).
 * Thin layer per rules.md §2: read request, call service, shape response.
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

/** GET /api/v1/admin/settings/content — Phase 24 */
const getPageContent = async (req, res, next) => {
  try {
    const content = await settingsService.getPageContent();
    res.status(200).json({ status: "success", data: content });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/v1/admin/settings/content — Phase 24 */
const setPageContent = async (req, res, next) => {
  try {
    const content = await settingsService.setPageContent(req.body);
    res.status(200).json({ status: "success", data: content });
  } catch (error) {
    next(error);
  }
};

module.exports = { setStorewideDiscount, getStorewideDiscount, getPageContent, setPageContent };
