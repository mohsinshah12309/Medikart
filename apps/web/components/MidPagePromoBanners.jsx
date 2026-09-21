"use client";

import React, { useState, useEffect } from "react";
import { triggerCategorySelect, scrollToCatalog } from "../lib/catalogEvents";

const FALLBACK_MID_BANNERS = [
  {
    _id: "mid-1",
    title: "Protect the Skin You're In",
    subtitle: "Dermatologist-recommended sunblocks, cleansers & moisturizers",
    targetSlug: "dermatology",
    linkUrl: "#store-catalog",
    gradient: "from-amber-100/90 via-yellow-50 to-amber-50/60",
    badge: "Featured Collection",
    icon: "☀️",
  },
  {
    _id: "mid-2",
    title: "Better Health Begins Everyday",
    subtitle: "Explore authentic organic supplements, magnesium & herbal wellness",
    targetSlug: "vitamins",
    linkUrl: "#store-catalog",
    gradient: "from-yellow-100/90 via-amber-50 to-emerald-50/50",
    badge: "Featured Collection",
    icon: "💊",
  },
];

export default function MidPagePromoBanners({ initialBanners = [], categories = [] }) {
  const [banners, setBanners] = useState(
    initialBanners.length > 0 ? initialBanners : FALLBACK_MID_BANNERS
  );

  useEffect(() => {
    if (initialBanners.length > 0) {
      setBanners(initialBanners);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/banners?placement=mid-page`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.banners && data.data.banners.length >= 2) {
            setBanners(data.data.banners);
          }
        })
        .catch(() => {});
    }
  }, [initialBanners]);

  const handleBannerClick = (b, e) => {
    if (e) e.preventDefault();

    let targetCatId = "";

    // 1. Check if banner has linkUrl with category query or id
    if (b.linkUrl && b.linkUrl.includes("category=")) {
      const match = b.linkUrl.match(/category=([a-zA-Z0-9_-]+)/);
      if (match) targetCatId = match[1];
    }

    // 2. If targetSlug is explicitly set on fallback
    if (!targetCatId && b.targetSlug && categories.length > 0) {
      const found = categories.find((c) => c.slug === b.targetSlug);
      if (found) targetCatId = found._id;
    }

    // 3. Fallback semantic resolution based on banner title / text
    if (!targetCatId) {
      const text = `${b.title || ""} ${b.badge || ""} ${b.subtitle || ""}`.toLowerCase();
      if (text.includes("skin") || text.includes("sun") || text.includes("derma") || text.includes("protect")) {
        const found = categories.find(
          (c) => c.slug === "dermatology" || c.name.toLowerCase().includes("derma") || c.name.toLowerCase().includes("skin")
        );
        targetCatId = found ? found._id : "6a9073f130ff9f1a1d0f2331";
      } else if (text.includes("vitamin") || text.includes("mineral") || text.includes("health") || text.includes("supplement") || text.includes("magnesium") || text.includes("herbal")) {
        const found = categories.find(
          (c) => c.slug === "vitamins" || c.name.toLowerCase().includes("vitamin") || c.slug === "nutraceutical"
        );
        targetCatId = found ? found._id : "6a9073f030ff9f1a1d0f231c";
      } else if (text.includes("otc") || text.includes("counter")) {
        const found = categories.find((c) => c.slug === "otc" || c.name.toLowerCase().includes("otc"));
        targetCatId = found ? found._id : "6a9ca4cfa446f5140dbdcb46";
      }
    }

    if (targetCatId) {
      triggerCategorySelect(targetCatId, true);
      scrollToCatalog();

      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      url.searchParams.set("category", targetCatId);
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    } else {
      scrollToCatalog();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-3">
      {banners.slice(0, 2).map((b, idx) => (
        <div
          key={b._id || idx}
          onClick={(e) => handleBannerClick(b, e)}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${
            b.gradient || (idx === 0 ? "from-yellow-200/90 via-amber-100 to-yellow-50" : "from-yellow-200/90 via-yellow-100 to-emerald-50")
          } p-6 sm:p-8 border border-yellow-300/80 shadow-warm-card hover:shadow-lg transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[210px] cursor-pointer group hover:border-amber-400 hover:scale-[1.01]`}
        >
          {/* Ambient Decorative Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white/90 text-slate-900 px-3 py-1 rounded-full shadow-2xs border border-amber-200/80">
              {b.badge || "Featured Collection"}
            </span>
            <span className="text-2xl filter drop-shadow-xs group-hover:scale-110 transition-transform">{b.icon || (idx === 0 ? "☀️" : "💊")}</span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mb-1.5 group-hover:text-amber-800 transition-colors">
              {b.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed max-w-sm mb-4">
              {b.subtitle}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick(b, e);
              }}
              className="inline-flex items-center gap-2 text-xs font-black text-slate-950 btn-amber-gradient px-4 py-2 rounded-xl shadow-xs transition-all group-hover:gap-3 cursor-pointer"
            >
              <span>Explore Products</span>
              <span>→</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
