"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Pause, 
  Play, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  X,
  Flame,
  Stethoscope
} from "lucide-react";
import { BLOGS_DATA } from "../data/blogsData";

const CATEGORIES = [
  { label: "All", slug: "all" },
  { label: "Child Care", slug: "baby-child-nutrition" },
  { label: "Immunity", slug: "immunity-vitamins" },
  { label: "Skin & Glow", slug: "dermatology-skincare" },
  { label: "Heart & Sugar", slug: "cardiac-metabolic" },
];

export default function RightBlogSidebar({ isMobileDrawerOpen, setIsMobileDrawerOpen }) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);

  // Filter blogs based on category
  const filteredBlogs = selectedCat === "all"
    ? BLOGS_DATA
    : BLOGS_DATA.filter((b) => b.categorySlug === selectedCat || b.category.toLowerCase().includes(selectedCat.toLowerCase()));

  const blogsToDisplay = filteredBlogs.length > 0 ? filteredBlogs : BLOGS_DATA;

  const handleScrollManual = (direction) => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === "up" ? -180 : 180;
      scrollContainerRef.current.scrollBy({ top: scrollOffset, behavior: "smooth" });
    }
  };

  const sidebarBody = (
    <div
      className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl border border-amber-200/90 shadow-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── 1. Header: Live Feed Badge & Controls ─── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
            <Stethoscope className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-black font-heading text-slate-900 tracking-tight leading-none">
                Health Blogs
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Moving Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              60+ Verified Medical Articles
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? "Resume Auto-Scroll" : "Pause Auto-Scroll"}
            aria-label={isPaused ? "Resume Auto-Scroll" : "Pause Auto-Scroll"}
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 hover:border-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-3xs"
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-700 fill-amber-700" /> : <Pause className="w-3 h-3 text-slate-600" />}
          </button>

          {/* Up / Down */}
          <button
            type="button"
            onClick={() => handleScrollManual("up")}
            aria-label="Scroll Up"
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 hover:border-amber-300 hidden sm:flex items-center justify-center transition-all cursor-pointer shadow-3xs"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleScrollManual("down")}
            aria-label="Scroll Down"
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 hover:border-amber-300 hidden sm:flex items-center justify-center transition-all cursor-pointer shadow-3xs"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Close button for mobile drawer */}
          {setIsMobileDrawerOpen && (
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-label="Close Sidebar"
              className="xl:hidden w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Category Filter Pills ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2.5 flex-shrink-0">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCat === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-950 shadow-xs font-black ring-1 ring-amber-400"
                  : "bg-slate-100/90 hover:bg-amber-100/70 text-slate-600 hover:text-amber-950"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ─── 3. Continuously Moving Vertical Feed (Auto-Scroll Marquee) ─── */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 w-full overflow-hidden my-1"
      >
        {/* Top Gradient Fade Edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white via-white/80 to-transparent z-10" />

        {/* Bottom Gradient Fade Edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />

        {/* Continuous Seamless Vertical Loop */}
        <div
          className={`flex flex-col gap-3 py-1 ${
            !isPaused ? "animate-blog-vertical" : ""
          }`}
        >
          {[...blogsToDisplay, ...blogsToDisplay].map((blog, idx) => (
            <Link
              key={`${blog.id}-${idx}`}
              href={`/blogs/${blog.slug}`}
              className="group/card flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-300 transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-xs flex-shrink-0"
            >
              {/* Thumbnail Image */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-200 group-hover/card:border-amber-400 shadow-3xs transition-all transform group-hover/card:scale-105">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  sizes="72px"
                  className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                    {blog.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    {blog.date}
                  </span>
                </div>

                <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover/card:text-amber-950 transition-colors line-clamp-2 leading-snug mt-1">
                  {blog.title}
                </h4>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{blog.readTime}</span>
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold group-hover/card:text-amber-800 group-hover/card:underline">
                    Read Article &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── 4. Footer Mini Status & All Link ─── */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isPaused ? "Paused on Hover" : "Auto-Moving Feed"}</span>
        </span>
        <Link
          href="/blogs"
          className="btn-amber-gradient px-3 py-1 rounded-lg text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1 group/btn"
        >
          <span>VIEW ALL 60+</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sticky Right Sidebar */}
      <aside className="hidden xl:flex flex-col w-80 2xl:w-92 flex-shrink-0 sticky top-24 h-[calc(100vh-7rem)] z-30">
        {sidebarBody}
      </aside>

      {/* Mobile / Tablet Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 xl:hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fade-in-up">
          <div className="w-[88vw] max-w-sm h-full p-4">
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
}
