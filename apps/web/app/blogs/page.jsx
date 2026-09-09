"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, ArrowRight, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { BLOGS_DATA, BLOG_CATEGORIES } from "../../data/blogsData";

export default function BlogsDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlogs = useMemo(() => {
    return BLOGS_DATA.filter((blog) => {
      const matchesCat =
        selectedCategory === "all" || blog.categorySlug === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ─── Hero Header ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#FFFDF7] via-[#FFFBEB] to-[#FEF3C7]/40 border border-[#F3EFE6] p-6 sm:p-10 shadow-warm-card overflow-hidden">
        <div className="relative z-10 max-w-2xl text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200 shadow-3xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Medically Verified by Licensed Pakistani Clinicians</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-slate-900 leading-tight">
            Healthcare &amp; Wellness{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Knowledge Hub
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Explore 60+ verified clinical guides on pediatric nutrition, chronic disease management,
            seasonal smog/dengue care, and safe medicine practices tailored for Pakistani families.
          </p>

          {/* In-Page Blog Search Bar */}
          <div className="pt-2 max-w-md">
            <div className="relative flex items-center bg-white rounded-full border border-slate-300/80 shadow-xs px-3.5 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles (e.g. baby weight, diabetes, smog)..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ambient Warm Blur */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── Category Filter Pills ─── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {BLOG_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                  : "bg-white text-slate-700 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Blog Articles Grid (60 Articles) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.slug}`}
            className="group flex flex-col rounded-3xl bg-white border border-[#F3EFE6] hover:border-emerald-300 shadow-3xs hover:shadow-warm-card overflow-hidden transition-all duration-300 cursor-pointer"
          >
            {/* Real Photographic Card Image */}
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
              <Image
                src={blog.image}
                alt={blog.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[10.5px] font-extrabold text-emerald-800 shadow-xs border border-emerald-100">
                {blog.category}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{blog.readTime}</span>
                  </span>
                  <span>•</span>
                  <span>{blog.date}</span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                  {blog.title}
                </h2>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {blog.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 truncate max-w-[180px]">
                  By {blog.author.split(",")[0]}
                </span>
                <span className="text-xs font-extrabold text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Read</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredBlogs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No articles found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or category filter.</p>
        </div>
      )}
    </div>
  );
}
