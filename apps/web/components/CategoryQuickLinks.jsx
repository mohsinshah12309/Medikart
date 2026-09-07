"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Pill,
  Sparkles,
  Stethoscope,
  Scissors,
  Baby,
  Snowflake,
  Coffee,
  Leaf,
  Layers,
  ShoppingBag,
  Activity,
  HeartPulse,
  Thermometer,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function CategoryQuickLinks({ categories: initialCategories = [], onSelectCategory }) {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.categories && data.data.categories.length > 0) {
            setCategories(data.data.categories);
          }
        })
        .catch(() => {});
    }
  }, [initialCategories]);

  if (!categories || categories.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const renderCategoryIcon = (name = "") => {
    const n = name.toLowerCase();

    if (n.includes("otc") || n.includes("counter")) {
      return <ShieldCheck className="w-8 h-8 text-amber-600" />;
    }
    if (n.includes("beverage") || n.includes("drink") || n.includes("juice")) {
      return <Coffee className="w-8 h-8 text-amber-700" />;
    }
    if (n.includes("dermatology") || n.includes("skin") || n.includes("cosmetic") || n.includes("beauty")) {
      return <Sparkles className="w-8 h-8 text-yellow-600" />;
    }
    if (n.includes("diagnostic") || n.includes("test") || n.includes("meter")) {
      return <Stethoscope className="w-8 h-8 text-blue-600" />;
    }
    if (n.includes("diaper") || n.includes("napkin") || n.includes("baby") || n.includes("mother") || n.includes("milk")) {
      return <Baby className="w-8 h-8 text-pink-600" />;
    }
    if (n.includes("fridge") || n.includes("cold") || n.includes("cool")) {
      return <Snowflake className="w-8 h-8 text-cyan-600" />;
    }
    if (n.includes("surgical") || n.includes("equipment") || n.includes("furniture")) {
      return <Scissors className="w-8 h-8 text-indigo-600" />;
    }
    if (n.includes("vitamin") || n.includes("nutra") || n.includes("supplement") || n.includes("herbal")) {
      return <Leaf className="w-8 h-8 text-emerald-600" />;
    }
    if (n.includes("patient") || n.includes("support")) {
      return <Activity className="w-8 h-8 text-teal-600" />;
    }
    if (n.includes("consumer") || n.includes("general") || n.includes("flat")) {
      return <ShoppingBag className="w-8 h-8 text-slate-700" />;
    }

    // Default fallback for medicines or any newly added category
    return <Pill className="w-8 h-8 text-amber-600" />;
  };

  return (
    <div className="flex flex-col gap-3 py-2 select-none">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Browse by healthcare specialty &amp; medicine type
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous Categories"
            className="w-8 h-8 rounded-full btn-amber-gradient text-slate-900 font-bold flex items-center justify-center text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next Categories"
            className="w-8 h-8 rounded-full btn-amber-gradient text-slate-900 font-bold flex items-center justify-center text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Categories Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-3 pt-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const slug = cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const imgSrc = cat.imageUrl || (slug ? `/images/categories/${slug}.jpg` : null);

          return (
            <a
              key={cat._id}
              href="#store-catalog"
              onClick={(e) => {
                if (onSelectCategory) {
                  e.preventDefault();
                  onSelectCategory(cat._id);
                  const el = document.getElementById("store-catalog");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="flex-shrink-0 w-28 sm:w-32 md:w-36 bg-white border border-[#F3EFE6] hover:border-amber-300 rounded-2xl p-2.5 flex flex-col items-center justify-between gap-2 shadow-2xs hover:shadow-warm-card transition-all hover:-translate-y-1 group cursor-pointer"
            >
              {/* Dvago Commercial Photography Box */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:border-yellow-300 transition-all duration-200">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  renderCategoryIcon(cat.name)
                )}
              </div>

              {/* Category Name */}
              <span className="text-xs font-bold text-slate-800 text-center line-clamp-2 min-h-[32px] flex items-center justify-center group-hover:text-yellow-700 transition-colors leading-tight">
                {cat.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
