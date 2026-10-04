/**
 * Discount service — Phase 8.
 *
 * THE SINGLE SOURCE OF TRUTH for effective price calculation (PRD §9.1).
 *
 * Refactored to Open/Closed Principle (OCP) & Strategy Pattern:
 *   Precedence order (never stacked — most specific active discount wins):
 *     1. Product-level discount (highest priority)
 *     2. Category-level discount
 *     3. Storewide discount
 *     4. Full price (no discount at any level)
 *
 * Extensible: New discount strategies (e.g. coupon codes, wholesale, user tiers)
 * can be added to the DiscountEngine pipeline without modifying existing strategies.
 *
 * @param {object}  product            - Mongoose product doc (or plain object)
 * @param {object}  [category]         - Mongoose category doc (or plain object); optional
 * @param {number}  [storewidePercent] - Storewide discount % (0-100); pass 0 or omit if none
 * @returns {{ effectivePrice: number, appliedDiscount: string, discountPercent: number }}
 */

/** Helper: Round to 2 decimal places (PKR paise) */
const round2 = (n) => Math.round(n * 100) / 100;

/** Helper: Check if a discount definition is active and in valid range 0-100 */
const isValidDiscount = (d) =>
  d &&
  d.active === true &&
  typeof d.value === "number" &&
  d.value > 0 &&
  d.value <= 100;

/**
 * 1. Product-level Discount Strategy (Highest Priority)
 */
class ProductDiscountStrategy {
  canApply({ product }) {
    return isValidDiscount(product?.discount);
  }

  calculate({ product }) {
    const pct = product.discount.value;
    return {
      effectivePrice: round2(product.price * (1 - pct / 100)),
      appliedDiscount: "product",
      discountPercent: pct,
    };
  }
}

/**
 * 2. Category-level Discount Strategy
 */
class CategoryDiscountStrategy {
  canApply({ category }) {
    return Boolean(category && isValidDiscount(category.discount));
  }

  calculate({ product, category }) {
    const pct = category.discount.value;
    return {
      effectivePrice: round2(product.price * (1 - pct / 100)),
      appliedDiscount: "category",
      discountPercent: pct,
    };
  }
}

/**
 * 3. Storewide Discount Strategy
 */
class StorewideDiscountStrategy {
  canApply({ storewidePercent }) {
    return typeof storewidePercent === "number" && storewidePercent > 0 && storewidePercent <= 100;
  }

  calculate({ product, storewidePercent }) {
    return {
      effectivePrice: round2(product.price * (1 - storewidePercent / 100)),
      appliedDiscount: "storewide",
      discountPercent: storewidePercent,
    };
  }
}

/**
 * 4. Fallback Default Strategy (Full Price)
 */
class DefaultPriceStrategy {
  canApply() {
    return true;
  }

  calculate({ product }) {
    return {
      effectivePrice: product.price,
      appliedDiscount: "none",
      discountPercent: 0,
    };
  }
}

/**
 * Strategy Pipeline Manager (OCP)
 */
const DEFAULT_STRATEGIES = [
  new ProductDiscountStrategy(),
  new CategoryDiscountStrategy(),
  new StorewideDiscountStrategy(),
  new DefaultPriceStrategy(),
];

class DiscountEngine {
  constructor(strategies = DEFAULT_STRATEGIES) {
    this.strategies = strategies;
  }

  calculateEffectivePrice(product, category = null, storewidePercent = 0) {
    const context = { product, category, storewidePercent };
    for (const strategy of this.strategies) {
      if (strategy.canApply(context)) {
        return strategy.calculate(context);
      }
    }
    return {
      effectivePrice: product.price,
      appliedDiscount: "none",
      discountPercent: 0,
    };
  }
}

const defaultEngine = new DiscountEngine();

const getEffectivePrice = (product, category = null, storewidePercent = 0) =>
  defaultEngine.calculateEffectivePrice(product, category, storewidePercent);

module.exports = {
  getEffectivePrice,
  DiscountEngine,
  ProductDiscountStrategy,
  CategoryDiscountStrategy,
  StorewideDiscountStrategy,
  DefaultPriceStrategy,
};
