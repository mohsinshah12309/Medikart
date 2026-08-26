/**
 * Settings service — Phase 8 (storewide discount) + Phase 24 (page content).
 *
 * Manages the singleton Settings document.
 * getStorewideDiscount() is the function discount.service.js callers use
 * to retrieve the current storewide discount percentage (or 0 if inactive/unset).
 */

const Settings = require("./settings.model");

/**
 * Get the active storewide discount percentage.
 * Returns 0 if no storewide discount is set or if it's inactive.
 * Safe to call at any time — creates the singleton doc if missing.
 */
const getStorewideDiscount = async () => {
  const settings = await Settings.findOne();
  if (
    !settings ||
    !settings.storewideDiscount?.active ||
    typeof settings.storewideDiscount?.value !== "number"
  ) {
    return 0;
  }
  return settings.storewideDiscount.value;
};

/**
 * Set the storewide discount.
 * @param {{ value: number, active: boolean }} discountData
 */
const setStorewideDiscount = async (discountData) => {
  const settings = await Settings.findOneAndUpdate(
    {}, // singleton — match any document
    { $set: { storewideDiscount: discountData } },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

/**
 * Get About / Contact page content (Phase 24).
 * Returns the content fields from the singleton Settings document.
 */
const getPageContent = async () => {
  const settings = await Settings.findOne().select("aboutText contactEmail contactPhone");
  return {
    aboutText: settings?.aboutText ?? "",
    contactEmail: settings?.contactEmail ?? "",
    contactPhone: settings?.contactPhone ?? "",
  };
};

/**
 * Set About / Contact page content (Phase 24).
 * @param {{ aboutText?: string, contactEmail?: string, contactPhone?: string }} contentData
 */
const setPageContent = async (contentData) => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: contentData },
    { new: true, upsert: true, runValidators: true }
  );
  return {
    aboutText: settings.aboutText ?? "",
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
  };
};

module.exports = { getStorewideDiscount, setStorewideDiscount, getPageContent, setPageContent };

