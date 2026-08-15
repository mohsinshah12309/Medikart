/**
 * discount.test.js — Phase 8 unit tests.
 *
 * Per rules.md §7: discount calculation gets a proper unit test.
 * These are the EXACT four cases specified in phases.md.
 *
 * The function is pure (no DB, no network) — tests are fast and hermetic.
 */

const { getEffectivePrice } = require("../../src/modules/discounts/discount.service");

// ── Helpers — build minimal plain objects matching the schema shape ──────────

const product = (price, discountValue = null, discountActive = false) => ({
  price,
  discount: {
    type: "percentage",
    value: discountValue,
    active: discountActive,
  },
});

const category = (discountValue = null, discountActive = false) => ({
  discount: {
    value: discountValue,
    active: discountActive,
  },
});

// ── Test Suite ───────────────────────────────────────────────────────────────

describe("getEffectivePrice — PRD §9.1 discount precedence", () => {
  const BASE_PRICE = 1000; // PKR 1,000 base for easy mental math

  /**
   * Case 1 (phases.md):
   * Product with NO discount, category with 10% → effective price = 900 (10% off)
   */
  test("Case 1: no product discount, category 10% → 10% off", () => {
    const p = product(BASE_PRICE, null, false);        // no product discount
    const cat = category(10, true);                    // 10% active on category
    const result = getEffectivePrice(p, cat, 0);

    expect(result.effectivePrice).toBe(900);
    expect(result.appliedDiscount).toBe("category");
    expect(result.discountPercent).toBe(10);
  });

  /**
   * Case 2 (phases.md):
   * Same product given its OWN 15% discount → effective price = 850 (15% off),
   * NOT 10% category AND 15% product stacked.
   */
  test("Case 2: product 15% + category 10% → product wins, 15% off, NOT stacked", () => {
    const p = product(BASE_PRICE, 15, true);           // 15% active on product
    const cat = category(10, true);                    // 10% still active on category
    const result = getEffectivePrice(p, cat, 0);

    expect(result.effectivePrice).toBe(850);           // 1000 * 0.85
    expect(result.appliedDiscount).toBe("product");    // product-level wins
    expect(result.discountPercent).toBe(15);
    // Verify NOT stacked: stacked would be 1000 * 0.85 * 0.90 = 765 — must not be 765
    expect(result.effectivePrice).not.toBe(765);
  });

  /**
   * Case 3 (phases.md):
   * Remove product-level discount → price falls back to category's 10%.
   */
  test("Case 3: product discount removed → falls back to category 10%", () => {
    const p = product(BASE_PRICE, null, false);        // product discount cleared
    const cat = category(10, true);                    // category 10% still active
    const result = getEffectivePrice(p, cat, 0);

    expect(result.effectivePrice).toBe(900);
    expect(result.appliedDiscount).toBe("category");
    expect(result.discountPercent).toBe(10);
  });

  /**
   * Case 4 (phases.md):
   * Remove category discount too, storewide is 5% → price reflects 5%.
   */
  test("Case 4: no product or category discount, storewide 5% → 5% off", () => {
    const p = product(BASE_PRICE, null, false);        // no product discount
    const cat = category(null, false);                 // no category discount
    const result = getEffectivePrice(p, cat, 5);       // storewide = 5%

    expect(result.effectivePrice).toBe(950);
    expect(result.appliedDiscount).toBe("storewide");
    expect(result.discountPercent).toBe(5);
  });

  // ── Extra edge cases to make the suite robust ────────────────────────────

  test("No discount at any level → full price, no discount applied", () => {
    const p = product(BASE_PRICE, null, false);
    const cat = category(null, false);
    const result = getEffectivePrice(p, cat, 0);

    expect(result.effectivePrice).toBe(BASE_PRICE);
    expect(result.appliedDiscount).toBe("none");
    expect(result.discountPercent).toBe(0);
  });

  test("Inactive product discount does NOT apply", () => {
    const p = product(BASE_PRICE, 20, false);          // value set but inactive
    const cat = category(10, true);
    const result = getEffectivePrice(p, cat, 0);

    // Should fall through to category
    expect(result.appliedDiscount).toBe("category");
    expect(result.effectivePrice).toBe(900);
  });

  test("Category with no value falls through to storewide", () => {
    const p = product(BASE_PRICE, null, false);
    const cat = category(null, false);
    const result = getEffectivePrice(p, cat, 8);

    expect(result.appliedDiscount).toBe("storewide");
    expect(result.effectivePrice).toBe(920);           // 1000 * 0.92
  });

  test("No category provided → falls through to storewide correctly", () => {
    const p = product(BASE_PRICE, null, false);
    const result = getEffectivePrice(p, null, 10);

    expect(result.appliedDiscount).toBe("storewide");
    expect(result.effectivePrice).toBe(900);
  });

  test("Fractional discount rounds to 2 decimal places", () => {
    const p = product(999, null, false);
    const cat = category(null, false);
    const result = getEffectivePrice(p, cat, 10);      // 999 * 0.90 = 899.1

    expect(result.effectivePrice).toBe(899.1);
  });
});
