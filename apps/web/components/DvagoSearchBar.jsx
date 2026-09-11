"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import {
  triggerCatalogSearch,
  triggerFilterReset,
  scrollToCatalog,
  CATALOG_EVENTS,
} from "../lib/catalogEvents";

// Popular Pakistani pharmacy search queries that cycle every 1.5s (Dvago style)
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

export default function DvagoSearchBar({ className = "" }) {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef(null);

  // Sync search input state if query is set/reset externally
  useEffect(() => {
    // Check initial search param from URL
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

  // Cycle placeholder every 1.5 seconds with smooth fade transition
  useEffect(() => {
    // Only cycle when input is empty and not actively focused
    if (query || isFocused) return;

    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
        setIsFading(false);
      }, 250);
    }, 1800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [query, isFocused]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

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

  const handleClear = () => {
    setQuery("");
    triggerCatalogSearch("");
    if (pathname === "/") {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      const newQuery = url.searchParams.toString();
      window.history.pushState({}, "", newQuery ? `${url.pathname}?${newQuery}` : url.pathname);
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`relative flex items-center w-full max-w-md lg:max-w-lg transition-all ${className}`}
      role="search"
    >
      <div
        className={`relative w-full flex items-center bg-white rounded-full border transition-all duration-200 shadow-2xs ${
          isFocused
            ? "border-amber-400 ring-2 ring-amber-200/60 shadow-sm"
            : "border-slate-200/90 hover:border-amber-300"
        }`}
      >
        {/* Search Magnifying Glass Icon */}
        <button
          type="submit"
          className="pl-3.5 pr-2 py-2 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Submit search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Search Input Box with Cycling Animated Placeholder */}
        <div className="relative flex-1 h-10 flex items-center overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-transparent outline-none pr-3"
            aria-label="Search medicines and healthcare products"
          />

          {/* Animated Cycling Placeholder Label (fades in and out when empty) */}
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

        {/* Clear Button (visible when text is typed) */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 mr-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick Search Action Button on Desktop */}
        <button
          type="submit"
          className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 mr-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-2xs cursor-pointer"
        >
          Search
        </button>
      </div>
    </form>
  );
}
