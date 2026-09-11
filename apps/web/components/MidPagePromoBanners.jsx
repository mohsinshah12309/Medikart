"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const FALLBACK_MID_BANNERS = [
  {
    _id: "mid-1",
    title: "Protect the Skin You're In",
    subtitle: "Dermatologist-recommended sunblocks, SPF 60 creams & gentle cleansers.",
    linkUrl: "#store-catalog",
    gradient: "from-yellow-100 via-amber-50 to-yellow-50",
    badge: "Skin & Sun Care",
    icon: "☀️",
  },
  {
    _id: "mid-2",
    title: "Better Health Begins Everyday",
    subtitle: "Premium multivitamins, magnesium, omega fish oil & daily vital minerals.",
    linkUrl: "#store-catalog",
    gradient: "from-yellow-100 via-emerald-50 to-lime-50",
    badge: "Vitamins & Minerals",
    icon: "🌿",
  },
];

export default function MidPagePromoBanners({ initialBanners = [] }) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-3">
      {banners.slice(0, 2).map((b, idx) => (
        <div
          key={b._id || idx}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${
            b.gradient || (idx === 0 ? "from-yellow-200 via-amber-100 to-yellow-50" : "from-yellow-200 via-yellow-100 to-emerald-50")
          } p-6 sm:p-8 border border-yellow-300/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px] sm:min-h-[210px] group`}
        >
          {/* Ambient Decorative Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white/90 text-slate-900 px-3 py-1 rounded-full shadow-2xs border border-slate-200">
              {b.badge || "Featured Collection"}
            </span>
            <span className="text-2xl filter drop-shadow-xs">{b.icon || (idx === 0 ? "☀️" : "💊")}</span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mb-1.5 group-hover:text-yellow-700 transition-colors">
              {b.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed max-w-sm mb-4">
              {b.subtitle}
            </p>
          </div>

          <div>
            <Link
              href={b.linkUrl || "#store-catalog"}
              className="inline-flex items-center gap-2 text-xs font-black text-slate-950 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 px-4 py-2 rounded-xl border border-yellow-500/50 shadow-2xs transition-all hover:gap-3"
            >
              Explore Products <span>→</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
