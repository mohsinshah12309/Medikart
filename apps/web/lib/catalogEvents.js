/**
 * Catalog Events Bus & Synchronization Utility
 * Provides cross-component communication for search, category filtering,
 * and pagination across the Medikart customer storefront.
 */

export const CATALOG_EVENTS = {
  SEARCH: "medikart-catalog-search",
  SELECT_CATEGORY: "medikart-select-category",
  RESET_FILTERS: "medikart-reset-filters",
};

/**
 * Dispatch a search query to the catalog
 * @param {string} search - Search query term
 * @param {string} categoryId - Optional category ID to search within
 */
export function triggerCatalogSearch(search = "", categoryId = "") {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CATALOG_EVENTS.SEARCH, {
      detail: { search, categoryId },
    })
  );

  // Also dispatch legacy event for backwards compatibility
  window.dispatchEvent(
    new CustomEvent("catalog-search", {
      detail: { search, categoryId },
    })
  );
}

/**
 * Dispatch a category selection to the catalog
 * @param {string} categoryId - Category MongoDB _id
 * @param {boolean} resetSearch - Whether to clear the search query (default true)
 */
export function triggerCategorySelect(categoryId = "", resetSearch = true) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CATALOG_EVENTS.SELECT_CATEGORY, {
      detail: { categoryId, resetSearch },
    })
  );

  // Also dispatch legacy select-category event
  window.dispatchEvent(
    new CustomEvent("select-category", {
      detail: categoryId,
    })
  );
}

/**
 * Dispatch a reset of all active filters
 */
export function triggerFilterReset() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CATALOG_EVENTS.RESET_FILTERS));
}

/**
 * Scroll smoothly to the store catalog section with sticky header offset
 */
export function scrollToCatalog(customOffset = 90) {
  if (typeof window === "undefined") return;

  setTimeout(() => {
    const catalogEl =
      document.getElementById("catalog-products-container") ||
      document.getElementById("store-catalog") ||
      document.getElementById("catalog");
    if (catalogEl) {
      const rect = catalogEl.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      const targetTop = rect.top + scrollTop - customOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }
  }, 40);
}

