/**
 * Discount service — Phase 8.
 *
 * THE SINGLE SOURCE OF TRUTH for effective price calculation (PRD §9.1).
 *
 * Precedence rule (never stacked — most specific active discount wins):
 *   1. Product-level discount (highest priority)
 *   2. Category-level discount
 *   3. Storewide discount
 *   4. Full price (no discount at any level)
 *
 * ARCHITECTURE CONTRACT:
 *   This is the only authorised path to a "final price" in the codebase.
 *   Phase 13 (checkout), Phase 25 (display), and every phase that needs an
 *   effective price MUST call getEffectivePrice() — never reimplement the rule.
 *   The function is pure (no DB calls, no side effects) so it can be unit-tested
 *   trivially and called at any point in the request cycle.
 *
 * @param {object}  product            - Mongoose product doc (or plain object)
 * @param {object}  [category]         - Mongoose category doc (or plain object); optional
 * @param {number}  [storewidePercent] - Storewide discount % (0-100); pass 0 or omit if none
 * @returns {{ effectivePrice: number, appliedDiscount: string, discountPercent: number }}
 */

const getEffectivePrice = (product, category = null, storewidePercent = 0) => {
  const basePrice = product.price;

  // Helper: is a discount object active and valid?
  const isActive = (d) =>
    d &&
    d.active === true &&
    typeof d.value === "number" &&
    d.value > 0 &&
    d.value <= 100;

  // 1. Product-level discount (most specific)
  if (isActive(product.discount)) {
    const pct = product.discount.value;
    return {
      effectivePrice: round2(basePrice * (1 - pct / 100)),
      appliedDiscount: "product",
      discountPercent: pct,
    };
  }

  // 2. Category-level discount
  if (category && isActive(category.discount)) {
    const pct = category.discount.value;
    return {
      effectivePrice: round2(basePrice * (1 - pct / 100)),
      appliedDiscount: "category",
      discountPercent: pct,
    };
  }

  // 3. Storewide discount
  if (typeof storewidePercent === "number" && storewidePercent > 0 && storewidePercent <= 100) {
    return {
      effectivePrice: round2(basePrice * (1 - storewidePercent / 100)),
      appliedDiscount: "storewide",
      discountPercent: storewidePercent,
    };
  }

  // 4. No discount — return full price
  return {
    effectivePrice: basePrice,
    appliedDiscount: "none",
    discountPercent: 0,
  };
};

/** Round to 2 decimal places (PKR paise) */
const round2 = (n) => Math.round(n * 100) / 100;

module.exports = { getEffectivePrice };
