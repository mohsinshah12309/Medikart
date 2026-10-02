"use client";

import React, { useState, useEffect } from "react";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";

export default function BlogTableOfContents({ tocItems = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (tocItems.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(tocItems[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveId(tocItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  if (tocItems.length === 0) return null;

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setIsOpen(false);
    }
  };

  return (
    <nav
      aria-label="Table of contents"
      className="my-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-5 sm:p-6 border border-amber-400/30 shadow-warm-card relative overflow-hidden"
    >
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-400/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>In This Medical Guide</span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                {tocItems.length} Key Topics
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Click any chapter to jump directly
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>{isOpen ? "Collapse" : "View All"}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Chapters grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 transition-all duration-300 ${
          isOpen
            ? "max-h-[800px] opacity-100"
            : "max-h-[175px] sm:max-h-[110px] overflow-hidden"
        }`}
      >
        {tocItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`text-left p-2.5 rounded-xl transition-all duration-200 flex items-start gap-2.5 text-xs font-semibold cursor-pointer border ${
                isActive
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-inner"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/5 hover:border-white/10"
              }`}
            >
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${
                  isActive
                    ? "bg-amber-400 text-slate-950"
                    : "bg-white/10 text-amber-300"
                }`}
              >
                {String(item.index).padStart(2, "0")}
              </span>
              <span className="line-clamp-2 leading-snug">{item.text}</span>
            </button>
          );
        })}
      </div>

      {!isOpen && tocItems.length > 4 && (
        <div className="text-center pt-3 border-t border-white/10 mt-3">
          <button
            onClick={() => setIsOpen(true)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>+{tocItems.length - 4} more sections</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </nav>
  );
}
