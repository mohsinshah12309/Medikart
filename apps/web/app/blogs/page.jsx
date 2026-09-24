"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { BLOGS_DATA, BLOG_CATEGORIES } from "../../data/blogsData";

const getFullUrl = (path) => {
  const fallback = "/uploads/placeholder.webp";
  if (!path || path === "/images/placeholder-product.png") {
    return fallback;
  }
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "") : "";
  return path.startsWith("http") || path.startsWith("/") ? path : `${apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function BlogsDirectoryPage() {
  const [blogs, setBlogs] = useState(BLOGS_DATA);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    async function fetchLiveBlogs() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/blogs?limit=100`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.blogs && json.data.blogs.length > 0) {
            setBlogs(json.data.blogs);
          }
        }
      } catch (_) {
        // Keep fallback BLOGS_DATA
      } finally {
        setLoading(false);
      }
    }
    fetchLiveBlogs();
  }, [apiUrl]);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const catSlug = blog.categorySlug || blog.category?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const matchesCat = selectedCategory === "all" || catSlug === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (blog.summary && blog.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(blog.tags) && blog.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCat && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-16 px-4 sm:px-6">
      {/* ─── Hero Header - Brand Yellow Dominant ─── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF352] via-[#FFF866] to-[#FFE51A] rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-[#F7E53B]">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-300/30 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-[#FFF352] w-fit shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFF352] animate-pulse shadow-[0_0_8px_#fff352]" />
            Healthcare &amp; Clinical Guidance
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Health &amp; Medicine Guides
          </h1>

          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
            Explore verified clinical guides on pediatric care, chronic disease management, seasonal illness prevention, and safe medication practices tailored for Pakistani families.
          </p>

          {/* In-Hero Blog Search Bar */}
          <div className="pt-2 max-w-lg w-full">
            <div className="relative flex items-center bg-white rounded-2xl border-2 border-yellow-300 shadow-md px-4 py-3 focus-within:border-yellow-600 focus-within:ring-4 focus-within:ring-yellow-400/25 transition-all">
              <Search className="w-4 h-4 text-amber-800 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles (e.g. Panadol dosage, diabetes, pediatric flu)..."
                aria-label="Search health articles"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-950 placeholder:text-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-800 font-bold ml-1 cursor-pointer px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
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
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 select-none ${
                isActive
                  ? "bg-yellow-400 text-slate-950 shadow-md border-2 border-yellow-500 font-black scale-[1.02]"
                  : "bg-white text-slate-700 hover:bg-yellow-50/70 border border-slate-200 hover:border-yellow-300"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Articles Grid ─── */}
      {loading && blogs.length > 0 && (
        <div className="flex justify-center py-4"><div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full" /></div>
      )}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <p className="text-sm font-bold text-slate-600 mb-2">No health articles match your filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => {
            const thumb = getFullUrl(blog.thumbnailUrl || blog.image || "/images/blogs/family-wellness.jpg");
            const slug = blog.slug || "article";
            const readTime = blog.readTimeMinutes ? `${blog.readTimeMinutes} min read` : blog.readTime || "4 min read";

            return (
              <Link
                key={blog._id || blog.id || slug}
                href={`/blogs/${slug}`}
                className="group flex flex-col justify-between bg-white rounded-3xl border-2 border-yellow-200/90 hover:border-yellow-500 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left p-4 sm:p-5 hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  {/* Card Thumbnail Banner */}
                  <div className="relative aspect-[1.91/1] w-full rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-yellow-100">
                    <img
                      src={thumb}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-yellow-400 border border-yellow-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                      {blog.categoryName || blog.category}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-950 group-hover:text-amber-900 line-clamp-2 leading-snug mb-2 transition-colors">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-normal">
                    {blog.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>{readTime}</span>
                  </div>

                  <span className="text-amber-900 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
