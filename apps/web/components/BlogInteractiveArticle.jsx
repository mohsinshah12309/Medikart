"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Tag,
  Share2,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookOpen,
  ArrowUp,
  MessageCircle,
  Pill,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Layers,
  Heart,
  Search,
} from "lucide-react";

// Helper to convert heading text into a URL-friendly anchor ID
function slugifyHeading(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Inline renderer that parses markdown links: [text](url) and bold **text**
function renderRichText(text) {
  if (!text) return null;

  // Split by markdown link pattern [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: "text", content: text.slice(lastIdx, match.index) });
    }
    parts.push({
      type: "link",
      text: match[1],
      url: match[2],
    });
    lastIdx = linkRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push({ type: "text", content: text.slice(lastIdx) });
  }

  return (
    <>
      {parts.map((p, idx) => {
        if (p.type === "link") {
          const isInternal =
            p.url.includes("medikart.pk") || p.url.startsWith("/");
          const cleanUrl = p.url.replace("https://medikart.pk", "") || "/";

          if (isInternal) {
            return (
              <Link
                key={idx}
                href={cleanUrl}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 font-bold text-xs sm:text-sm text-slate-900 bg-gradient-to-r from-amber-200/90 via-yellow-200 to-amber-100 hover:from-amber-300 hover:to-yellow-300 rounded-lg border border-amber-300/80 shadow-3xs hover:shadow-2xs transition-all duration-200 hover:-translate-y-0.5 group/link"
              >
                <Pill className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 group-hover/link:rotate-12 transition-transform" />
                <span className="underline decoration-amber-500/50 underline-offset-2">
                  {p.text}
                </span>
                <ArrowRight className="w-3 h-3 text-amber-800 opacity-70 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all" />
              </Link>
            );
          }

          return (
            <a
              key={idx}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mx-1 font-semibold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-400 decoration-2 underline-offset-2 hover:decoration-emerald-700 transition-colors"
            >
              <span>{p.text}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            </a>
          );
        }

        // Render plain text with bold **bold** support
        return <span key={idx}>{renderBoldText(p.content)}</span>;
      })}
    </>
  );
}

function renderBoldText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function BlogInteractiveArticle({
  blog,
  siteUrl = "https://medikart.pk",
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(48);
  const [hasLiked, setHasLiked] = useState(false);
  const [openFaqs, setOpenFaqs] = useState({});
  const [faqFilter, setFaqFilter] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Parse sections and table of contents from blog.content
  const parsedSections = useMemo(() => {
    const rawContent = blog.content || "";
    const lines = rawContent.split("\n");
    const sections = [];
    let currentHeading = null;
    let currentParagraphs = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        if (currentHeading || currentParagraphs.length > 0) {
          sections.push({
            heading: currentHeading,
            paragraphs: currentParagraphs,
          });
        }
        currentHeading = trimmed.replace(/^##\s+/, "");
        currentParagraphs = [];
      } else if (trimmed.length > 0) {
        currentParagraphs.push(trimmed);
      }
    });

    if (currentHeading || currentParagraphs.length > 0) {
      sections.push({
        heading: currentHeading,
        paragraphs: currentParagraphs,
      });
    }

    return sections;
  }, [blog.content]);

  // Extract table of contents items
  const tocItems = useMemo(() => {
    return parsedSections
      .filter((s) => Boolean(s.heading))
      .map((s, idx) => ({
        id: slugifyHeading(s.heading),
        text: s.heading,
        index: idx + 1,
      }));
  }, [parsedSections]);

  // Reading progress and active heading tracking
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

      // Track active heading
      const headingElements = tocItems.map((item) =>
        document.getElementById(item.id)
      );
      const scrollPos = window.scrollY + 180;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el && el.offsetTop <= scrollPos) {
          setActiveHeadingId(tocItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  // Copy article link handler
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      });
    }
  };

  // Like article handler
  const handleLike = () => {
    if (!hasLiked) {
      setLikeCount((prev) => prev + 1);
      setHasLiked(true);
    } else {
      setLikeCount((prev) => prev - 1);
      setHasLiked(false);
    }
  };

  // FAQ accordion toggle
  const toggleFaq = (idx) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const expandAllFaqs = () => {
    const all = {};
    (blog.faqSchema || []).forEach((_, i) => {
      all[i] = true;
    });
    setOpenFaqs(all);
  };

  const collapseAllFaqs = () => {
    setOpenFaqs({});
  };

  const filteredFaqs = useMemo(() => {
    const items = blog.faqSchema || [];
    if (!faqFilter.trim()) return items;
    const q = faqFilter.toLowerCase();
    return items.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [blog.faqSchema, faqFilter]);

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
      setTocOpen(false);
    }
  };

  const wordCount = useMemo(() => {
    return (blog.content || "").split(/\s+/).filter(Boolean).length;
  }, [blog.content]);

  return (
    <div className="relative">
      {/* ─── STICKY READING PROGRESS BAR ─── */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-slate-200/50 backdrop-blur-xs">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-150 ease-out shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ─── FLOATING BACK TO TOP BUTTON ─── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-slate-900 text-amber-400 hover:text-white hover:bg-slate-800 shadow-warm-card border border-amber-300/40 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Back to Top</span>
          <span className="absolute -top-7 text-[10px] font-black bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">
            {scrollProgress}%
          </span>
        </button>
      )}

      {/* ─── INTERACTIVE METRICS & ENGAGEMENT STRIP ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 my-2 rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border border-amber-200/80 shadow-3xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DRAP &amp; PMDC Verified</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold shadow-3xs">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>{wordCount.toLocaleString()} words</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold shadow-3xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{blog.readTimeMinutes || 6} min deep read</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* WhatsApp share */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Read "${blog.title}" on Medikart: ${siteUrl}/blogs/${blog.slug}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-3xs hover:scale-105 transition-all"
            title="Share on WhatsApp"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          {/* Copy link button */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-3xs hover:border-amber-300 transition-all cursor-pointer"
            title="Copy link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Like button */}
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs border shadow-3xs transition-all cursor-pointer ${
              hasLiked
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-500"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                hasLiked ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
            <span>{likeCount}</span>
          </button>
        </div>
      </div>

      {/* ─── INTERACTIVE TABLE OF CONTENTS (TOC) CARD ─── */}
      {tocItems.length > 0 && (
        <nav
          aria-label="Table of contents"
          className="my-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-5 sm:p-6 border border-amber-400/30 shadow-warm-card relative overflow-hidden"
        >
          {/* Subtle background glow */}
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
              onClick={() => setTocOpen(!tocOpen)}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{tocOpen ? "Collapse" : "View All"}</span>
              {tocOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Quick chapter links grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 transition-all duration-300 ${
              tocOpen ? "max-h-[800px] opacity-100" : "max-h-[175px] sm:max-h-[110px] overflow-hidden"
            }`}
          >
            {tocItems.map((item) => {
              const isActive = activeHeadingId === item.id;
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
                  <span className="line-clamp-2 leading-snug">
                    {item.text}
                  </span>
                </button>
              );
            })}
          </div>

          {!tocOpen && tocItems.length > 4 && (
            <div className="text-center pt-3 border-t border-white/10 mt-3">
              <button
                onClick={() => setTocOpen(true)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>+{tocItems.length - 4} more sections</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </nav>
      )}

      {/* ─── RICH STRUCTURED CONTENT BODY ─── */}
      <div className="space-y-8 my-6">
        {parsedSections.map((section, sIdx) => {
          const headingId = section.heading
            ? slugifyHeading(section.heading)
            : `section-${sIdx}`;

          return (
            <section
              key={sIdx}
              id={headingId}
              className="scroll-mt-24 space-y-4 group/section"
            >
              {section.heading && (
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300/80 shadow-3xs">
                      Section {String(sIdx + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-amber-300/60 to-transparent" />
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black font-heading text-slate-900 tracking-tight leading-snug flex items-center justify-between group">
                    <span>{section.heading}</span>
                    <button
                      onClick={() => scrollToHeading(headingId)}
                      className="opacity-0 group-hover:opacity-100 text-amber-600 hover:text-amber-700 text-sm font-bold transition-opacity p-1.5"
                      title="Link to this section"
                      aria-label={`Link to section ${section.heading}`}
                    >
                      #
                    </button>
                  </h2>
                </div>
              )}

              {/* Render Section Paragraphs */}
              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px] sm:text-[16.5px]">
                {section.paragraphs.map((p, pIdx) => {
                  // Check if it's a bullet/list item
                  if (p.startsWith("- ") || p.startsWith("* ")) {
                    return (
                      <div
                        key={pIdx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 text-slate-800 shadow-3xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                        <div className="leading-snug">
                          {renderRichText(p.replace(/^[-*]\s+/, ""))}
                        </div>
                      </div>
                    );
                  }

                  // Check if first paragraph of first section: lead style
                  const isLead = sIdx === 0 && pIdx === 0;

                  return (
                    <p
                      key={pIdx}
                      className={`leading-relaxed text-slate-700 ${
                        isLead
                          ? "text-base sm:text-lg font-medium text-slate-800 bg-gradient-to-r from-amber-50/60 via-white to-transparent p-4 rounded-2xl border-l-4 border-amber-400 shadow-3xs"
                          : ""
                      }`}
                    >
                      {renderRichText(p)}
                    </p>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* ─── INTERACTIVE PHARMACIST ADVISORY CARD ─── */}
      <div className="my-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50/40 to-white border-2 border-amber-300 shadow-warm-card relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                DRAP Clinical Standard
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Licensed Pharmacist Verification
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Need Help Choosing Authentic Medicines in Pakistan?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Always verify genuine DRAP registration codes (D-Reg), batch numbers,
              and temperature storage seals on all pharmaceutical products. Our
              licensed pharmacists are on standby to verify your prescription
              online.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/instant-order"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
              >
                <span>Upload Doctor Prescription</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-amber-50 text-slate-900 text-xs font-bold border border-slate-200 shadow-3xs transition-all"
              >
                <span>Consult Pharmacist</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE FAQ ACCORDION (AEO / GOOGLE RICH RESULTS) ─── */}
      {blog.faqSchema && blog.faqSchema.length > 0 && (
        <section className="my-8 pt-6 border-t-2 border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 mb-1">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Google AI &amp; AEO Answers</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
                Frequently Asked Questions ({blog.faqSchema.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAllFaqs}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllFaqs}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Quick FAQ search input */}
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

          {/* FAQ Items Accordion */}
          <div className="space-y-3 pt-1">
            {filteredFaqs.map((faq, fIdx) => {
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
                        <p>{renderRichText(faq.answer)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">
                No questions found matching &ldquo;{faqFilter}&rdquo;.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ─── E-E-A-T AUTHOR & EDITORIAL REVIEWER BADGE ─── */}
      <div className="my-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-3xs border border-amber-300">
            👨‍⚕️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 text-sm">
                {blog.author || "Medikart Health Team"}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                <Check className="w-3 h-3 text-emerald-700" />
                Verified Clinical Team
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {blog.authorTitle ||
                "Medikart Clinical Editorial — Reviewed by Licensed Pakistani Pharmacists & Clinicians"}
            </p>
          </div>
        </div>

        <Link
          href="/faqs"
          className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition-colors whitespace-nowrap"
        >
          View Editorial Guidelines &rarr;
        </Link>
      </div>
    </div>
  );
}
