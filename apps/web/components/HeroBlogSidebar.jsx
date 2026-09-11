"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { BLOGS_DATA } from "../data/blogsData";

export default function HeroBlogSidebar() {
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 3;
  const totalPages = Math.ceil(Math.min(BLOGS_DATA.length, 12) / pageSize);

  const displayedBlogs = BLOGS_DATA.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handleNextPage = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="w-full h-full bg-white rounded-3xl border border-slate-200/90 shadow-warm-card p-4 sm:p-5 flex flex-col justify-between select-none">
      {/* ─── Sidebar Header ─── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
            <BookOpen className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-black font-heading text-slate-900 tracking-tight leading-none">
                Health & Wellness
              </h3>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Doctor-reviewed medical insights
            </p>
          </div>
        </div>

        {/* Header Controls: Arrow Pagination & View All Button */}
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevPage}
                aria-label="Previous Blogs"
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 hover:border-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-3xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                aria-label="Next Blogs"
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 hover:border-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-3xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Link
            href="/blogs"
            className="btn-amber-gradient px-2.5 sm:px-3 py-1 rounded-lg text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1 group"
          >
            <span>ALL</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ─── Blog Articles List ─── */}
      <div className="flex-1 flex flex-col justify-between gap-2.5 sm:gap-3 py-3">
        {displayedBlogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.slug}`}
            className="group flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl bg-slate-50/70 hover:bg-amber-50/50 border border-slate-100 hover:border-amber-300/80 transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-xs"
          >
            {/* Thumbnail Image */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-200 group-hover:border-amber-400 shadow-3xs transition-all transform group-hover:scale-102">
              <Image
                src={blog.image}
                alt={blog.title}
                fill
                sizes="72px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                  {blog.category}
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  {blog.date}
                </span>
              </div>

              <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-amber-950 transition-colors line-clamp-2 leading-snug mt-1">
                {blog.title}
              </h4>

              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{blog.readTime}</span>
                </span>
                <span>•</span>
                <span className="text-amber-600 font-bold group-hover:text-amber-800 group-hover:underline">
                  Read Article &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Footer Mini-Banner CTA ─── */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Updated Daily with 60+ Health Guides
        </span>
        <Link
          href="/blogs"
          className="text-amber-700 font-bold hover:text-amber-800 hover:underline"
        >
          Browse Categories &rarr;
        </Link>
      </div>
    </div>
  );
}
