"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, Clock, ArrowRight } from "lucide-react";
import { BLOGS_DATA } from "../data/blogsData";

export default function BlogsSection() {
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Display top 15 blogs in the homepage interactive slider
  const featuredBlogs = BLOGS_DATA.slice(0, 15);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -360 : 360;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section aria-label="Health & Wellness Blogs" className="w-full py-4 select-none">
      <div className="flex flex-col gap-4">
        
        {/* ─── Header: "Blogs" + "VIEW ALL" (Matching Dvago Screenshot) ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-emerald-700">
              Blogs
            </h2>
            <span className="hidden sm:inline-block text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Verified Medical Insights
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Manual Arrow Controls */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center justify-center transition-all shadow-3xs cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center justify-center transition-all shadow-3xs cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* "VIEW ALL" Pill Button (Matching Dvago Screenshot) */}
            <Link
              href="/blogs"
              className="px-4 py-1.5 rounded-xl bg-[#70B32D] hover:bg-[#619E24] text-white text-xs font-black uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs flex items-center gap-1"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ─── Horizontal Continuous Sliding Track with Circular Thumbnails ─── */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative w-full overflow-x-auto scrollbar-none py-2"
        >
          <div
            className={`flex items-center gap-5 sm:gap-6 ${
              !isPaused ? "animate-slide-ltr" : ""
            }`}
            style={{ width: "max-content" }}
          >
            {/* Seamless Dual Loop */}
            {[...featuredBlogs, ...featuredBlogs].map((blog, idx) => (
              <Link
                key={`${blog.id}-${idx}`}
                href={`/blogs/${blog.slug}`}
                className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-300 shadow-3xs hover:shadow-warm-card transition-all cursor-pointer w-[310px] sm:w-[350px] flex-shrink-0"
              >
                {/* Circular Photographic Thumbnail (Matching Dvago Screenshot) */}
                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-100 group-hover:border-emerald-500 shadow-xs transition-all transform group-hover:scale-105">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    sizes="88px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Blog Card Content */}
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 line-clamp-1">
                    {blog.category}
                  </span>

                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug mt-0.5">
                    {blog.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-[10.5px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{blog.readTime}</span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold group-hover:underline">
                      Read Article &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
