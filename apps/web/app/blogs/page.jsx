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
    <div className="flex flex-col gap-8 pb-12">
      {/* ─── Hero Header ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-white via-amber-50/50 to-yellow-50/30 border border-amber-200/80 p-6 sm:p-10 shadow-warm-card overflow-hidden">
        <div className="relative z-10 max-w-2xl text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold border border-amber-200 shadow-3xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Medically Verified by Licensed Pakistani Clinicians</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-slate-900 leading-tight">
            Healthcare &amp; Wellness{" "}
            <span className="bg-gradient-to-r from-amber-500 via-[#FFCB05] to-yellow-500 bg-clip-text text-transparent">
              Knowledge Hub
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Explore 60+ verified clinical guides on pediatric nutrition, chronic disease management,
            seasonal smog/dengue care, and safe medicine practices tailored for Pakistani families.
          </p>

          {/* In-Page Blog Search Bar */}
          <div className="pt-2 max-w-md">
            <div className="relative flex items-center bg-white rounded-full border border-amber-200/90 shadow-xs px-3.5 py-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200">
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
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold ml-1 cursor-pointer"
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
                  ? "btn-amber-gradient text-slate-950 shadow-xs font-black"
                  : "bg-white text-slate-700 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Articles Grid ─── */}
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
                className="group flex flex-col justify-between bg-white rounded-3xl border border-[#F3EFE6] hover:border-amber-400 shadow-warm-card hover:shadow-lg transition-all duration-300 overflow-hidden text-left p-4 sm:p-5"
              >
                <div>
                  {/* Card Thumbnail Banner */}
                  <div className="relative aspect-[1.91/1] w-full rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-100">
                    <img
                      src={thumb}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                      {blog.categoryName || blog.category}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900 group-hover:text-amber-800 line-clamp-2 leading-snug mb-2 transition-colors">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {blog.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{readTime}</span>
                  </div>

                  <span className="text-amber-700 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
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
