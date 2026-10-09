"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export default function SecurityAnnouncementTicker({ contactPhone = "[PHONE - CLIENT TO CONFIRM]" }) {
  // Normalize phone digits for WhatsApp and tel links
  const isConfirmed = contactPhone && !contactPhone.includes("CLIENT TO CONFIRM") && !contactPhone.includes("4489159");
  const rawDigits = isConfirmed ? contactPhone.replace(/[^0-9]/g, "") : "";
  const cleanPhone = rawDigits.startsWith("0") ? `92${rawDigits.slice(1)}` : rawDigits;

  const displayPhone = isConfirmed ? contactPhone : "[PHONE - CLIENT TO CONFIRM]";

  // Ticker content items repeated inside each track
  const TickerTrackContent = () => (
    <div className="flex items-center gap-6 sm:gap-8 shrink-0 pr-6 sm:pr-8 py-1.5">
      {/* 1. Official Verified Domain Pill */}
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-300/90 shadow-2xs text-[11.5px] font-bold text-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-500 font-medium">Official Domain:</span>
        <span className="font-extrabold text-amber-700 tracking-tight">medikart.pk</span>
      </span>

      <span className="text-amber-400 text-xs font-black">✦</span>

      {/* 2. Official Support Link Pill */}
      <a
        href={isConfirmed ? `https://wa.me/${cleanPhone}` : "/contact"}
        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11.5px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 group/wa cursor-pointer"
        title="Official Support Desk"
      >
        <span className="font-semibold text-emerald-800">Customer Helpline:</span>
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

      {/* 4. Licensed Partner Pharmacies & Genuine Medicine Badge */}
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-300/90 shadow-2xs text-[11.5px] font-bold text-slate-700">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>Licensed Partner Pharmacies</span>
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
