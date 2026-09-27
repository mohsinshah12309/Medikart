"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Smart BackButton component:
 * - Navigates user back to their previous page and exact scroll location if they entered from within the app.
 * - Falls back to a default href (e.g. "/") if the user entered via direct URL / external referrer.
 */
export default function BackButton({
  fallbackHref = "/",
  label = "Back",
  showLabel = true,
  className = "",
}) {
  const router = useRouter();

  const handleBack = (e) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      // Check if user has history within the current app session
      const hasInternalHistory =
        (window.history.length > 1 &&
          document.referrer &&
          document.referrer.includes(window.location.host)) ||
        (window.history.state && typeof window.history.state.idx === "number" && window.history.state.idx > 0);

      if (hasInternalHistory) {
        window.history.back();
      } else {
        router.push(fallbackHref);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back to previous location"
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-amber-50 text-slate-700 hover:text-slate-950 text-xs font-bold border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-600 transition-transform group-hover:-translate-x-0.5 duration-200" />
      {showLabel && <span className="font-bold">{label}</span>}
    </button>
  );
}
