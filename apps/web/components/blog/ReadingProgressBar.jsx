"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ReadingProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(
          100,
          Math.max(0, Math.round((window.scrollY / totalHeight) * 100))
        );
        setScrollProgress(currentProgress);
        setShowScrollTop(window.scrollY > 400);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Sticky top gradient progress indicator */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-slate-200/50 backdrop-blur-xs">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-[#FFEE45] to-amber-500 transition-all duration-150 ease-out shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Back to Top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-slate-900 text-amber-400 hover:text-white hover:bg-slate-800 shadow-warm-card border border-amber-300/40 transition-all duration-300 hover:scale-110 flex items-center justify-center group cursor-pointer"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Back to Top</span>
          <span className="absolute -top-7 text-[10px] font-black bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">
            {scrollProgress}%
          </span>
        </button>
      )}
    </>
  );
}
