"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Phone,
  Mail,
  HelpCircle,
  Pill,
  ShoppingCart,
  CreditCard,
  Truck,
  CalendarSync,
  UserCheck,
  FileText,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  X,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import faqData from "./faqData.json";

// Categorized FAQ Dataset
const FAQ_CATEGORIES = [
  { id: "all", label: "All Questions (100)", icon: HelpCircle },
  { id: "ordering", label: "Ordering & Checkout", icon: ShoppingCart },
  { id: "payment", label: "Payments & Billing", icon: CreditCard },
  { id: "delivery", label: "Delivery & Cold-Chain", icon: Truck },
  { id: "refill", label: "Monthly Refill", icon: CalendarSync },
  { id: "prescriptions", label: "Prescription & Narcotics", icon: FileText },
  { id: "safety", label: "Authenticity & Storage", icon: ShieldCheck },
  { id: "clinical", label: "Clinical Guidance & OTC", icon: Stethoscope },
  { id: "returns", label: "Returns & Support", icon: RotateCcw },
];

export default function FaqClient() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set(["ord-1", "del-1", "rx-1"]));
  const [feedbackState, setFeedbackState] = useState({});

  // Filter items based on active category & search query
  const filteredFaqs = useMemo(() => {
    return faqData.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const questionMatch = item.question.toLowerCase().includes(q);
      const answerMatch = item.answer.toLowerCase().includes(q);
      const categoryMatch = item.categoryLabel.toLowerCase().includes(q);
      const highlightsMatch = item.highlights?.some((h) => h.toLowerCase().includes(q));

      return questionMatch || answerMatch || categoryMatch || highlightsMatch;
    });
  }, [activeCategory, searchQuery]);

  // Toggle single accordion
  const toggleAccordion = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const handleExpandAll = () => {
    setExpandedIds(new Set(filteredFaqs.map((item) => item.id)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // User feedback on helpfulness
  const handleFeedback = (id, type) => {
    setFeedbackState((prev) => ({ ...prev, [id]: type }));
  };

  // Helper to format markdown bold in answers
  const renderFormattedText = (text) => {
    const paragraphs = text.split("\n\n");
    return paragraphs.map((para, pIdx) => {
      // Check if paragraph is list
      if (para.startsWith("- ") || para.startsWith("1. ") || para.startsWith("2. ")) {
        const lines = para.split("\n");
        return (
          <ul key={pIdx} className="space-y-1.5 my-2 pl-2">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "");
              return (
                <li key={lIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: parseMarkdownInline(cleanLine) }} />
                </li>
              );
            })}
          </ul>
        );
      }
      return (
        <p
          key={pIdx}
          className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: parseMarkdownInline(para) }}
        />
      );
    });
  };

  // Simple safe markdown parser for bold, links, code
  const parseMarkdownInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-slate-900'>$1</strong>")
      .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' class='text-amber-700 font-bold underline hover:text-amber-900'>$1</a>");
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 sm:gap-10 pb-16 px-4 sm:px-6">
      {/* ─────────────────────────────────────────────────────────────────────
          1. HERO HEADER (Storefront Yellow Dominant)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF352] via-[#FFF866] to-[#FFE51A] rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-[#F7E53B]">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-300/30 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-[#FFF352] w-fit shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFF352] animate-pulse shadow-[0_0_8px_#fff352]" />
            Help Center &amp; FAQs
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight font-heading">
            Frequently Asked Questions
          </h1>

          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
            Everything you need to know about placing orders, prescription verification, cold-chain delivery, payment options, and monthly refills across Pakistan.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. SEARCH BAR & QUICK FILTERS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border-2 border-yellow-300/90 shadow-md flex flex-col gap-5">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-700 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. card payment, delivery time, insulin cold pack, prescription)..."
            aria-label="Search frequently asked questions"
            className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl bg-yellow-50/50 border-2 border-yellow-200 text-slate-950 placeholder:text-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-yellow-400/25 focus:border-yellow-500 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin pt-1">
          {FAQ_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? "bg-yellow-400 text-slate-950 shadow-md border-2 border-yellow-500 scale-[1.02]"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-amber-600"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status bar & Expand/Collapse All */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-950 font-black">{filteredFaqs.length}</strong> questions
              {searchQuery && (
                <span>
                  {" "}
                  matching &quot;<span className="text-amber-900 font-bold">{searchQuery}</span>&quot;
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-amber-800 hover:text-slate-950 hover:underline font-bold transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-amber-800 hover:text-slate-950 hover:underline font-bold transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. ACCORDION LIST
      ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-amber-300 p-10 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-yellow-100 text-amber-700 flex items-center justify-center text-3xl">
              🔍
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-black text-slate-900">No matching questions found</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                We couldn&apos;t find any questions matching your search. Please try different keywords or contact our clinical support team directly.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-xs font-black shadow-xs transition-colors"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.has(faq.id);
            const userFeedback = feedbackState[faq.id];

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded
                    ? "border-yellow-400 shadow-md ring-2 ring-yellow-400/20"
                    : "border-slate-200 hover:border-yellow-300"
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer bg-white hover:bg-yellow-50/30 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 w-fit">
                        {faq.categoryLabel}
                      </span>
                    </div>
                    <h3 id={`faq-heading-${faq.id}`} className="text-sm sm:text-base md:text-lg font-black text-slate-900 leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 mt-0.5 ${
                      isExpanded
                        ? "bg-yellow-400 text-slate-950 rotate-180 shadow-xs"
                        : "bg-slate-100 text-slate-600 group-hover:bg-yellow-100"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div role="region" aria-labelledby={`faq-heading-${faq.id}`} className="px-5 pb-6 sm:px-6 sm:pb-7 pt-1 border-t border-yellow-100 bg-gradient-to-b from-yellow-50/30 via-white to-white">
                    {/* Render Formatted Markdown */}
                    <div className="pt-3">{renderFormattedText(faq.answer)}</div>

                    {/* Highlights Badges */}
                    {faq.highlights && faq.highlights.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight mr-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" /> Key Takeaway:
                        </span>
                        {faq.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-yellow-100/70 border border-yellow-300/80 text-amber-950"
                          >
                            <CheckCircle2 className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>{h}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Helpful Feedback Box */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>Was this answer helpful?</span>
                      <div className="flex items-center gap-2">
                        {userFeedback ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            ✓ Thank you for your feedback!
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, "up")}
                              aria-label="Mark answer as helpful"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-yellow-100 hover:text-slate-900 border border-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="w-3 h-3 text-slate-600" />
                              <span>Yes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, "down")}
                              aria-label="Mark answer as not helpful"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                            >
                              <ThumbsDown className="w-3 h-3 text-slate-600" />
                              <span>No</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. DRAFT NOTICE / DISCLAIMER CALLOUT
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-3xl p-5 sm:p-6 text-slate-800 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl text-base font-bold shrink-0 shadow-xs">
            💡
          </div>
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="text-amber-950 font-black uppercase tracking-wider block mb-1">
              General Customer Guidance Notice
            </strong>
            <p className="text-slate-700 font-medium">
              These FAQs reflect Medikart standard operating guidelines and partner pharmacy protocols. Specific pharmacy handling times and catalog availability may vary based on city location and partner pharmacy operating hours. Always consult a qualified medical professional for health advice.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. STILL HAVE QUESTIONS? DIRECT CONTACT CARDS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-white via-yellow-50/40 to-amber-50/30 rounded-3xl border-2 border-yellow-300 p-6 sm:p-10 shadow-lg flex flex-col gap-6">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 font-heading">
            Need More Assistance?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            Still Have Questions?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Our qualified clinical pharmacists and customer service team are available 24/7 to assist with orders and consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: WhatsApp */}
          <a
            href="https://wa.me/923244489159?text=Hi%20Medikart%20Support,%20I%20have%20a%20question%20about%20your%20services."
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 bg-white rounded-2xl border-2 border-[#25D366]/40 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all shadow-xs flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">WhatsApp Live Chat</h4>
              <p className="text-xs text-slate-500 mt-0.5">Average reply in minutes</p>
            </div>
            <span className="text-xs font-black text-[#15803d] flex items-center gap-1 mt-auto">
              <span>Chat Now</span>
              <span>→</span>
            </span>
          </a>

          {/* Card 2: Phone Helpline */}
          <a
            href="tel:+923244489159"
            className="p-5 bg-white rounded-2xl border-2 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50/50 transition-all shadow-xs flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
              📞
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">Direct Phone Helpline</h4>
              <p className="text-xs text-slate-500 mt-0.5">+92 324 4489159</p>
            </div>
            <span className="text-xs font-black text-amber-900 flex items-center gap-1 mt-auto">
              <span>Call Helpline</span>
              <span>→</span>
            </span>
          </a>

          {/* Card 3: Contact Form */}
          <Link
            href="/contact"
            className="p-5 bg-white rounded-2xl border-2 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50/50 transition-all shadow-xs flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-yellow-300 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">Online Contact Form</h4>
              <p className="text-xs text-slate-500 mt-0.5">Send a detailed inquiry</p>
            </div>
            <span className="text-xs font-black text-slate-950 flex items-center gap-1 mt-auto">
              <span>Go to Contact Page</span>
              <span>→</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
