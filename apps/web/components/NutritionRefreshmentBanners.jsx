"use client";

import React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  triggerCategorySelect,
  scrollToCatalog,
} from "../lib/catalogEvents";

export default function NutritionRefreshmentBanners() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBannerClick = (type) => {
    const targetCatId = type === "baby" ? "6a9073f030ff9f1a1d0f231f" : "6a9073f230ff9f1a1d0f2340";

    triggerCategorySelect(targetCatId, true);
    scrollToCatalog();

    if (pathname !== "/") {
      router.push(`/?category=${targetCatId}#store-catalog`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      url.searchParams.set("category", targetCatId);
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    }
  };

  return (
    <section aria-label="Featured Health Promotions" className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        
        {/* ─── Card 1: Baby Nutrition ("Growing Strong Starts with Proper Nutrition") ─── */}
        <div
          onClick={() => handleBannerClick("baby")}
          className="group relative h-56 sm:h-64 lg:h-72 w-full rounded-3xl overflow-hidden shadow-warm-card border border-[#F3EFE6] cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-amber-300"
        >
          {/* Background High-Res Photograph */}
          <Image
            src="/images/banners/baby-nutrition-banner.jpg"
            alt="Growing Strong Starts With Proper Nutrition - Infant formula and baby care"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Soft Left Gradient Vignette for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/35 to-transparent z-10" />

          {/* Card Content Overlay */}
          <div className="relative z-20 h-full p-6 sm:p-8 flex flex-col justify-between text-left max-w-xs sm:max-w-sm">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-extrabold text-amber-800 shadow-xs border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Pediatric Nutrition Care</span>
              </span>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-white leading-[1.12] drop-shadow-md">
                Growing <br />
                <span className="text-amber-300">Strong</span>
              </h3>

              <p className="text-xs sm:text-sm font-semibold text-slate-200 drop-shadow-xs">
                Starts With Proper{" "}
                <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-white font-extrabold border border-white/30">
                  NUTRITION
                </span>
              </p>
            </div>

            <div className="pt-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all group-hover:translate-x-1">
                <span>Shop Baby Care</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ─── Card 2: Refreshment & Hydration ("Refresh Replenish Repeat") ─── */}
        <div
          onClick={() => handleBannerClick("refreshment")}
          className="group relative h-56 sm:h-64 lg:h-72 w-full rounded-3xl overflow-hidden shadow-warm-card border border-[#F3EFE6] cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-amber-300"
        >
          {/* Background High-Res Photograph */}
          <Image
            src="/images/banners/refreshment-repeat-banner.jpg"
            alt="Refresh Replenish Repeat - Hydration, ORS, and energy electrolytes"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Soft Left Gradient Vignette for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/35 to-transparent z-10" />

          {/* Card Content Overlay */}
          <div className="relative z-20 h-full p-6 sm:p-8 flex flex-col justify-between text-left max-w-xs sm:max-w-sm">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-extrabold text-emerald-800 shadow-xs border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Hydration &amp; ORS</span>
              </span>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-white leading-[1.12] drop-shadow-md">
                REFRESH <br />
                <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  REPLENISH
                </span>{" "}
                <br />
                REPEAT
              </h3>

              <p className="text-xs sm:text-sm font-semibold text-slate-200 drop-shadow-xs">
                Clinical Electrolytes &amp; Rapid Rehydration
              </p>
            </div>

            <div className="pt-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md transition-all group-hover:translate-x-1">
                <span>Explore Hydration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
