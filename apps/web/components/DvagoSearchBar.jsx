"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, TrendingUp, ArrowUpRight, Clock } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import {
  triggerCatalogSearch,
  triggerFilterReset,
  scrollToCatalog,
  CATALOG_EVENTS,
} from "../lib/catalogEvents";

// Popular Pakistani pharmacy search queries that cycle every 1.8s in the navbar placeholder
const ROTATING_PLACEHOLDERS = [
  'Search for "Medicines & Antibiotics"...',
  'Search for "Baby & Mother Care"...',
  'Search for "Panadol, Augmentin, Disprin"...',
  'Search for "Multivitamins & Supplements"...',
  'Search for "Blood Pressure & Glucometers"...',
  'Search for "ORS & Energy Hydration"...',
  'Search for "Medicated Sunscreens & Skincare"...',
  'Search for "Insulin & Cold-Chain Items"...',
  'Search for "Diapers & Infant Milk Powder"...',
  'Search for "Cough & Cold Syrups"...',
];

const RECENT_SEARCHES_KEY = "medikart_recent_searches";

const getFullUrl = (path) => {
  const fallback = "/uploads/placeholder.webp";
  if (!path || path === "/images/placeholder-product.png") {
    return fallback;
  }
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : '';
  return path.startsWith("http") || path.startsWith("/") ? path : `${apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function DvagoSearchBar({ className = "" }) {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState({
    matchingSearches: [],
    matchingProducts: [],
    matchingCategories: [],
    trendingSearches: [],
    trendingProducts: [],
  });
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef(null);
  const searchInputRef = useRef(null);
  const modalInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const removeRecentSearch = (termToRemove, e) => {
    if (e) e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Sync search input state if query is set/reset externally
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get("search");
      if (urlSearch) {
        setQuery(urlSearch);
      }
    }

    const handleSearchEvent = (e) => {
      if (e.detail?.search !== undefined) {
        setQuery(e.detail.search || "");
      }
    };

    const handleResetEvent = () => {
      setQuery("");
    };

    window.addEventListener(CATALOG_EVENTS.SEARCH, handleSearchEvent);
    window.addEventListener(CATALOG_EVENTS.RESET_FILTERS, handleResetEvent);
    return () => {
      window.removeEventListener(CATALOG_EVENTS.SEARCH, handleSearchEvent);
      window.removeEventListener(CATALOG_EVENTS.RESET_FILTERS, handleResetEvent);
    };
  }, []);

  // Cycle placeholder when modal is closed and input is empty
  useEffect(() => {
    if (query || isOpen) return;

    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
        setIsFading(false);
      }, 250);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [query, isOpen]);

  // Fetch suggestions from API (debounced)
  const fetchSuggestions = useCallback(async (searchTerm) => {
    try {
      setLoading(true);
      const endpoint = `${apiUrl}/search/suggestions?q=${encodeURIComponent(searchTerm || "")}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSuggestions({
            matchingSearches: json.data.matchingSearches || [],
            matchingProducts: json.data.matchingProducts || [],
            matchingCategories: json.data.matchingCategories || [],
            trendingSearches: json.data.trendingSearches || [],
            trendingProducts: json.data.trendingProducts || [],
          });
        }
      }
    } catch (err) {
      console.error("[SearchSuggestions] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Trigger suggestions on query change when modal is open
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, isOpen, fetchSuggestions]);

  // Focus modal input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (modalInputRef.current) {
          modalInputRef.current.focus();
        }
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const executeSearch = (searchTerm) => {
    const cleanQuery = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!cleanQuery) return;

    saveRecentSearch(cleanQuery);
    setQuery(cleanQuery);
    setIsOpen(false);

    triggerCatalogSearch(cleanQuery);
    scrollToCatalog();

    if (pathname !== "/") {
      router.push(`/?search=${encodeURIComponent(cleanQuery)}#store-catalog`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("search", cleanQuery);
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    }
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    if (modalInputRef.current) modalInputRef.current.focus();
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    fetchSuggestions(query);
  };

  const isQuerying = Boolean(query && query.trim().length > 0);

  return (
    <>
      {/* ── TOP NAVBAR SEARCH BAR TRIGGER ───────────────────────────────── */}
      <div
        className={`relative flex items-center w-full max-w-md lg:max-w-lg transition-all ${className}`}
        role="search"
      >
        <div
          onClick={handleOpenModal}
          className="relative w-full flex items-center bg-white rounded-full border border-slate-200/90 hover:border-amber-400 transition-all duration-200 shadow-2xs cursor-pointer py-1"
        >
          {/* Magnifying Glass */}
          <div className="pl-3.5 pr-2 py-1 text-slate-400 flex items-center justify-center pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          {/* Dummy search input trigger */}
          <div className="relative flex-1 h-8 sm:h-9 flex items-center overflow-hidden pr-3">
            <input
              ref={searchInputRef}
              type="text"
              readOnly
              value={query}
              placeholder=""
              className="w-full h-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-transparent outline-none cursor-pointer"
              aria-label="Search medicines and healthcare products"
            />

            {/* Rotating Animated Placeholder */}
            {!query && (
              <div
                className={`pointer-events-none absolute left-0 right-3 text-xs sm:text-[13px] text-slate-400 truncate transition-opacity duration-200 ${
                  isFading ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
                }`}
              >
                {ROTATING_PLACEHOLDERS[placeholderIndex]}
              </div>
            )}
          </div>

          {/* Quick Search Action Button on Desktop */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal();
            }}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 mr-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-2xs cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* ── DVAGO-STYLE POPUP OVERLAY MODAL ────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-14 px-3 sm:px-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: "0.2s" }}
          >
            {/* Modal Search Input Header */}
            <form onSubmit={handleFormSubmit} className="border-b border-slate-100 p-3 sm:p-4 bg-white sticky top-0 z-10">
              <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3.5 py-2.5 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200/50">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0 mr-3" />
                <input
                  ref={modalInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for Medicines & more..."
                  className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder-slate-400 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors mr-1 cursor-pointer"
                    aria-label="Clear query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Modal Body Container */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 flex-1">
              {/* SECTION 1: RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Recent Searches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => executeSearch(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 hover:bg-amber-50 hover:text-amber-950 text-slate-700 rounded-full text-xs font-semibold cursor-pointer border border-slate-200/80 hover:border-amber-300 transition-all group"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="text-red-400 hover:text-red-600 rounded-full p-0.5 hover:bg-red-50 transition-colors"
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STATE A: WHEN QUERY IS TYPED ─────────────────────────── */}
              {isQuerying ? (
                <>
                  {/* MATCHING SEARCHES */}
                  {suggestions.matchingSearches.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                        Matching Searches
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.matchingSearches.map((term, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => executeSearch(term)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 hover:border-amber-400 transition-all text-left shadow-2xs"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 group-hover:text-slate-950 flex-shrink-0" />
                            <span className="truncate max-w-[280px]">{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MATCHING CATEGORIES */}
                  {suggestions.matchingCategories.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
                        Matching Categories
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.matchingCategories.map((cat) => (
                          <Link
                            key={cat._id}
                            href={`/?category=${encodeURIComponent(cat.slug || cat._id)}#store-catalog`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold border border-amber-200 transition-colors"
                          >
                            <span>🏷️</span>
                            <span>{cat.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MATCHING PRODUCTS */}
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
                    <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                      Matching Products
                    </div>

                    {loading ? (
                      <div className="py-6 text-center text-xs font-medium text-slate-400">
                        Searching product catalog...
                      </div>
                    ) : suggestions.matchingProducts.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs sm:text-sm text-slate-500 mb-2 font-medium">
                          No matching products found for <strong className="text-slate-800">"{query}"</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => executeSearch(query)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search in Full Catalog</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {suggestions.matchingProducts.map((prod) => {
                          const imgSrc = getFullUrl(prod.coverImage || (prod.images && prod.images[0]));
                          const price = Math.round(prod.effectivePrice ?? prod.price ?? 0);
                          const mrp = prod.price ? Math.round(prod.price) : null;
                          const hasDiscount = prod.discountPercent > 0 && mrp && mrp > price;

                          return (
                            <Link
                              key={prod._id}
                              href={`/products/${prod._id}`}
                              onClick={() => {
                                saveRecentSearch(prod.name);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all group"
                            >
                              <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-100 flex items-center justify-center overflow-hidden">
                                <img
                                  src={imgSrc}
                                  alt={prod.name}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                                  {prod.name}
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-xs font-extrabold text-red-600">
                                    Rs. {price.toLocaleString()}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      Rs. {mrp.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── STATE B: INITIAL CLICK (EMPTY QUERY) ─────────────────── */
                <>
                  {/* TRENDING SEARCHES */}
                  {suggestions.trendingSearches.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                        Trending Searches
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.trendingSearches.map((term, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => executeSearch(term)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 hover:border-amber-400 transition-all shadow-2xs cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TRENDING PRODUCTS */}
                  {suggestions.trendingProducts.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                        Trending Products
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {suggestions.trendingProducts.map((prod) => {
                          const imgSrc = getFullUrl(prod.coverImage || (prod.images && prod.images[0]));
                          const price = Math.round(prod.effectivePrice ?? prod.price ?? 0);
                          const mrp = prod.price ? Math.round(prod.price) : null;
                          const hasDiscount = prod.discountPercent > 0 && mrp && mrp > price;

                          return (
                            <Link
                              key={prod._id}
                              href={`/products/${prod._id}`}
                              onClick={() => {
                                saveRecentSearch(prod.name);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all group"
                            >
                              <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-100 flex items-center justify-center overflow-hidden">
                                <img
                                  src={imgSrc}
                                  alt={prod.name}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                                  {prod.name}
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-xs font-extrabold text-red-600">
                                    Rs. {price.toLocaleString()}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      Rs. {mrp.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
