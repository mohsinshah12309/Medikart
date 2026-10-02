"use client";

import React, { useState, useMemo } from "react";
import { HelpCircle, ChevronDown, Search } from "lucide-react";

export default function BlogFaqAccordion({ faqItems = [] }) {
  const [openFaqs, setOpenFaqs] = useState({});
  const [faqFilter, setFaqFilter] = useState("");

  const toggleFaq = (idx) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const expandAll = () => {
    const all = {};
    faqItems.forEach((_, i) => {
      all[i] = true;
    });
    setOpenFaqs(all);
  };

  const collapseAll = () => {
    setOpenFaqs({});
  };

  const filtered = useMemo(() => {
    if (!faqFilter.trim()) return faqItems;
    const q = faqFilter.toLowerCase();
    return faqItems.filter(
      (f) =>
        f.question?.toLowerCase().includes(q) ||
        f.answer?.toLowerCase().includes(q)
    );
  }, [faqItems, faqFilter]);

  if (faqItems.length === 0) return null;

  return (
    <section className="my-8 pt-6 border-t-2 border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 mb-1">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Google AI &amp; AEO Answers</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
            Frequently Asked Questions ({faqItems.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Quick FAQ search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={faqFilter}
          onChange={(e) => setFaqFilter(e.target.value)}
          placeholder="Search questions or answers in this guide..."
          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-400 bg-white shadow-3xs"
        />
      </div>

      {/* Accordion items */}
      <div className="space-y-3 pt-1">
        {filtered.map((faq, fIdx) => {
          const isOpen = Boolean(openFaqs[fIdx]);
          return (
            <div
              key={fIdx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-amber-50/40 border-amber-300 shadow-2xs"
                  : "bg-white hover:bg-slate-50/80 border-slate-200 shadow-3xs"
              }`}
            >
              <button
                onClick={() => toggleFaq(fIdx)}
                className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-200">
                    Q
                  </span>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {faq.question}
                  </h4>
                </div>

                <div
                  className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-amber-200 text-amber-950" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-amber-200/60 bg-white/60">
                  <div className="pl-9 space-y-2">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">
            No questions found matching &ldquo;{faqFilter}&rdquo;.
          </p>
        )}
      </div>
    </section>
  );
}
