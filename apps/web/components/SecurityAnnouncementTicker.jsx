"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export default function SecurityAnnouncementTicker({ contactPhone = "+92 324 4489159" }) {
  // Normalize phone digits for WhatsApp and tel links
  const rawDigits = (contactPhone || "").replace(/[^0-9]/g, "") || "923244489159";
  const cleanPhone = rawDigits.startsWith("0") ? `92${rawDigits.slice(1)}` : rawDigits;

  // Format display phone: e.g. +92 324 4489159
  let displayPhone = contactPhone;
  if (cleanPhone === "923244489159") {
    displayPhone = "+92 324 4489159";
  }

  // Ticker content items repeated inside each track
  const TickerTrackContent = () => (
    <div className="flex items-center gap-6 sm:gap-8 shrink-0 pr-6 sm:pr-8 py-1.5 select-none">
      {/* 1. Official Verified Domain Pill */}
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-300/90 shadow-2xs text-[11.5px] font-bold text-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-500 font-medium">Official Domain:</span>
        <span className="font-extrabold text-amber-700 tracking-tight">medikart.com</span>
      </span>

      <span className="text-amber-400 text-xs font-black">✦</span>

      {/* 2. Official WhatsApp & Helpline Link Pill */}
      <a
        href={`https://wa.me/${cleanPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11.5px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 group/wa cursor-pointer"
        title="Chat on Official WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-emerald-600 group-hover/wa:scale-110 transition-transform">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.871-6.958C16.598 1.932 14.12 1.9 11.487 1.9c-5.437 0-9.862 4.421-9.865 9.866-.001 1.702.464 3.367 1.346 4.887l-.988 3.606 3.69-.968zm13.111-5.613c-.262-.13-1.551-.765-1.792-.852-.24-.087-.416-.13-.591.13-.175.26-.677.852-.83 1.026-.153.174-.306.195-.568.065-.262-.13-1.107-.408-2.109-1.302-.78-.696-1.307-1.555-1.46-1.816-.153-.26-.017-.401.114-.53.118-.117.262-.305.393-.457.13-.152.175-.26.262-.435.087-.174.044-.326-.021-.456-.066-.13-.591-1.424-.81-1.947-.213-.512-.446-.442-.614-.45l-.523-.007c-.18 0-.472.067-.719.336-.247.269-.942.921-.942 2.247 0 1.326.964 2.607 1.098 2.78 1.35 1.794 3.01 2.656 5.443 3.619 1.139.449 2.052.484 2.825.369.863-.128 2.656-1.087 3.028-2.087.372-.999.372-1.854.262-2.036-.109-.18-.306-.267-.568-.397z"/>
        </svg>
        <span className="font-semibold text-emerald-800">For Calling &amp; WhatsApp:</span>
        <span className="font-black text-emerald-950 underline decoration-emerald-400 underline-offset-2">
          {displayPhone}
        </span>
      </a>

      <span className="text-amber-400 text-xs font-black">✦</span>

      {/* 3. Anti-Fraud Security Warning Statement (Matching Dvago Screenshot) */}
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-800">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
          !
        </span>
        <span>Do not trust unauthorized websites/apps claiming to be Medikart.</span>
        <span className="font-extrabold text-slate-900 uppercase tracking-wide bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300/80 shadow-3xs">
          Stay vigilant!
        </span>
      </span>

      <span className="text-amber-400 text-xs font-black">✦</span>

      {/* 4. DRAP Licensed & Genuine Medicine Badge */}
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-300/90 shadow-2xs text-[11.5px] font-bold text-slate-700">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>DRAP Licensed Pharmacy</span>
        <span className="text-slate-400">•</span>
        <span className="text-amber-800">100% Genuine Medicines</span>
      </span>

      <span className="text-amber-400 text-xs font-black">✦</span>

      {/* 5. Fast Doorstep Delivery */}
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700">
        <span>⚡</span>
        <span>Same Medicines. Fast Doorstep Delivery.</span>
      </span>
    </div>
  );

  return (
    <div className="relative w-full bg-[#EDEDED] border-b border-slate-300/80 overflow-hidden shadow-2xs group/ticker py-1">
      {/* Soft gradient edge fade masks for seamless horizontal marquee appearance */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[#EDEDED] via-[#EDEDED]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[#EDEDED] via-[#EDEDED]/80 to-transparent z-10" />

      {/* Dual-Track Continuous Left-to-Right Animated Scroller */}
      <div
        className="animate-ticker-ltr flex items-center cursor-default"
        title="Official Medikart Security Notice (Pause on hover/touch)"
      >
        <TickerTrackContent />
        <TickerTrackContent />
      </div>
    </div>
  );
}
