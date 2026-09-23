"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, CalendarSync, ArrowRight, X, Sparkles } from "lucide-react";

/**
 * RefillToast
 *
 * Friendly, high-visibility popup notification shown whenever a user
 * adds a product to their Monthly Refill routine.
 */
export default function RefillToast({
  show = false,
  product = null,
  title = "Added to Monthly Refill!",
  message = "Your 30-day recurring refill routine has been updated.",
  duration = 4500,
  onClose,
}) {
  const [visible, setVisible] = useState(show);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setVisible(show);
    if (!show) return;

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);
      if (elapsed >= duration) {
        clearInterval(interval);
        setVisible(false);
        if (onClose) onClose();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [show, duration, onClose]);

  if (!visible) return null;

  const productName = product?.name || "Selected Medicine";
  const productImage = product?.coverImage;

  return (
    <aside 
      aria-label="Notification"
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 md:top-24 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-fade-in-up"
    >
      <div className="relative rounded-2xl bg-slate-950/95 text-white backdrop-blur-md border-2 border-[#FFF352] shadow-2xl p-4 overflow-hidden">
        {/* Top Glowing Ambient Highlight */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#FFF352]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          {/* Left Icon / Product Image Thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-[#FFF352] text-slate-950 border border-yellow-300 flex items-center justify-center shadow-md">
              <CalendarSync className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            {/* Emerald Checkmark Badge */}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-xs">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </span>
          </div>

          {/* Middle Content */}
          <div className="flex-1 min-w-0 pr-1 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#FFF352]">
              <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
              <span>30-Day Auto Refill</span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white mt-0.5 leading-tight">
              {title}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              <strong className="text-yellow-100 font-bold">{productName}</strong> is saved to your routine for priority monthly dispatch.
            </p>

            {/* Quick Action Navigation */}
            <div className="mt-2.5 pt-1.5 border-t border-slate-800 flex items-center justify-between gap-2">
              <Link
                href="/refill"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-black text-[#FFF352] hover:text-yellow-200 transition-colors group cursor-pointer"
              >
                <span>View Refill Routine</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-[10px] text-slate-400 font-medium">1-Click Reorder</span>
            </div>
          </div>

          {/* Right Close Button */}
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              if (onClose) onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Timer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-[#FFF352] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
