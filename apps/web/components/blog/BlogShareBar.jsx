"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  BookOpen,
  Clock,
  MessageCircle,
  Copy,
  Check,
  Heart,
} from "lucide-react";

export default function BlogShareBar({
  title,
  slug,
  wordCount = 1800,
  readTimeMinutes = 6,
  siteUrl = "https://medikart.pk",
}) {
  const [copied, setCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(48);
  const [hasLiked, setHasLiked] = useState(false);

  const articleUrl = `${siteUrl}/blogs/${slug}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(articleUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      });
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikeCount((prev) => prev + 1);
      setHasLiked(true);
    } else {
      setLikeCount((prev) => prev - 1);
      setHasLiked(false);
    }
  };

  return (
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
          <span>{readTimeMinutes} min deep read</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* WhatsApp Share */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `Read "${title}" on Medikart: ${articleUrl}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-3xs hover:scale-105 transition-all"
          title="Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </a>

        {/* Copy Link */}
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

        {/* Like Button */}
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
  );
}
