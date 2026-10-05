/**
 * Cache Expiry (TTL) & Stampede Locking Policy Configuration.
 *
 * Centralizes all cache durations, stale-while-revalidate tolerance,
 * and distributed locking rules across the Medikart platform.
 *
 * Security & Integrity Contract:
 * - Stale-While-Revalidate and Lease Fallbacks are strictly FORBIDDEN for
 *   checkout, payments, order calculation, OTPs, and password reset tokens.
 */

const CACHE_POLICIES = {
  // ─── 1. Product Catalog & Listings ───────────────────────────────────────────
  PRODUCTS_LISTING: {
    namespace: "products:listing",
    freshTtlMs: 120 * 1000,      // 120s fresh window
    staleTtlMs: 300 * 1000,      // 300s (5m) stale-acceptable window
    lockDurationMs: 3000,        // 3s lease duration
    enableSwr: true,             // Serve stale while background revalidating
    enableLocking: true,         // Protect against simultaneous regeneration spikes
    allowStaleFallback: true,    // In high contention, serve stale if available
  },

  PRODUCT_DETAIL: {
    namespace: "products:detail",
    freshTtlMs: 300 * 1000,      // 300s (5m) fresh window
    staleTtlMs: 900 * 1000,      // 900s (15m) stale window
    lockDurationMs: 2000,        // 2s lease
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  PRODUCT_RELATED: {
    namespace: "products:related",
    freshTtlMs: 300 * 1000,      // 300s fresh
    staleTtlMs: 900 * 1000,      // 900s stale
    lockDurationMs: 2500,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  // ─── 2. Category Listing ─────────────────────────────────────────────────────
  CATEGORIES: {
    namespace: "categories:list",
    freshTtlMs: 3600 * 1000,     // 1 hour fresh (categories rarely change)
    staleTtlMs: 7200 * 1000,     // 2 hours stale
    lockDurationMs: 3000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  // ─── 3. Search Autocomplete & Trending ────────────────────────────────────────
  SEARCH_SUGGESTIONS: {
    namespace: "search:suggestions",
    freshTtlMs: 60 * 1000,       // 60s fresh
    staleTtlMs: 180 * 1000,      // 180s stale
    lockDurationMs: 2000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  TRENDING_SEARCHES: {
    namespace: "search:trending",
    freshTtlMs: 60 * 1000,       // 60s fresh
    staleTtlMs: 180 * 1000,      // 180s stale
    lockDurationMs: 2000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  // ─── 4. Storefront Content, Cities, Banners, Blogs ───────────────────────────
  CITIES: {
    namespace: "cities:list",
    freshTtlMs: 1800 * 1000,     // 30m fresh
    staleTtlMs: 3600 * 1000,     // 60m stale
    lockDurationMs: 2000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  BANNERS: {
    namespace: "banners:list",
    freshTtlMs: 600 * 1000,      // 10m fresh
    staleTtlMs: 1800 * 1000,     // 30m stale
    lockDurationMs: 2000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  CONDITIONS: {
    namespace: "conditions:list",
    freshTtlMs: 1800 * 1000,     // 30m fresh
    staleTtlMs: 3600 * 1000,     // 60m stale
    lockDurationMs: 2000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  BLOGS: {
    namespace: "blogs:list",
    freshTtlMs: 600 * 1000,      // 10m fresh
    staleTtlMs: 1800 * 1000,     // 30m stale
    lockDurationMs: 2500,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  CONTENT: {
    namespace: "settings:content",
    freshTtlMs: 1800 * 1000,     // 30m fresh
    staleTtlMs: 3600 * 1000,     // 60m stale
    lockDurationMs: 2000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  SITEMAP: {
    namespace: "sitemap:products",
    freshTtlMs: 3600 * 1000,     // 1h fresh
    staleTtlMs: 7200 * 1000,     // 2h stale
    lockDurationMs: 5000,
    enableSwr: true,
    enableLocking: true,
    allowStaleFallback: true,
  },

  // ─── 5. Compliance & Security Boundaries (STRICT FRESHNESS) ──────────────────
  OTP: {
    namespace: "security:otp",
    freshTtlMs: 600 * 1000,      // EXACT 10 minutes (NFR-SEC-03)
    staleTtlMs: 600 * 1000,      // NO STALE ALLOWED
    lockDurationMs: 1000,
    enableSwr: false,            // NEVER SERVE STALE
    enableLocking: false,
    allowStaleFallback: false,
  },

  PASSWORD_RESET: {
    namespace: "security:password_reset",
    freshTtlMs: 1800 * 1000,     // EXACT 30 minutes (NFR-SEC-03)
    staleTtlMs: 1800 * 1000,     // NO STALE ALLOWED
    lockDurationMs: 1000,
    enableSwr: false,            // NEVER SERVE STALE
    enableLocking: false,
    allowStaleFallback: false,
  },

  CHECKOUT_PRICING: {
    namespace: "checkout:pricing",
    freshTtlMs: 0,               // NO CACHING ALLOWED AT CHECKOUT
    staleTtlMs: 0,
    lockDurationMs: 0,
    enableSwr: false,
    enableLocking: false,
    allowStaleFallback: false,
  },
};

module.exports = {
  CACHE_POLICIES,
};
