"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { Sparkles, Pill, ArrowRight, Stethoscope } from "lucide-react";

export default function RelatedProducts({ currentProduct }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProduct) return;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        
        // Strategy 1: Find by primary category
        let categoryId = "";
        if (currentProduct.categoryIds && currentProduct.categoryIds.length > 0) {
          const firstCat = currentProduct.categoryIds[0];
          categoryId = typeof firstCat === "object" ? firstCat._id : firstCat;
        }

        let matched = [];

        // Query by category
        if (categoryId) {
          const res = await fetch(`${apiUrl}/products?categoryId=${categoryId}&limit=12`);
          if (res.ok) {
            const data = await res.json();
            matched = (data?.data?.products || []).filter(
              (p) => String(p._id) !== String(currentProduct._id)
            );
          }
        }

        // Strategy 2: If few matches, also query by generic name or search keyword
        if (matched.length < 6 && currentProduct.genericName) {
          const searchWord = currentProduct.genericName.split(" ")[0];
          if (searchWord && searchWord.length > 2) {
            const res = await fetch(`${apiUrl}/products?search=${encodeURIComponent(searchWord)}&limit=10`);
            if (res.ok) {
              const data = await res.json();
              const additional = (data?.data?.products || []).filter(
                (p) => String(p._id) !== String(currentProduct._id) && !matched.some((m) => String(m._id) === String(p._id))
              );
              matched = [...matched, ...additional];
            }
          }
        }

        // Strategy 3: Fallback to general catalog if still empty
        if (matched.length === 0) {
          const res = await fetch(`${apiUrl}/products?limit=10`);
          if (res.ok) {
            const data = await res.json();
            matched = (data?.data?.products || []).filter(
              (p) => String(p._id) !== String(currentProduct._id)
            );
          }
        }

        setRelatedProducts(matched.slice(0, 6));
      } catch (err) {
        console.warn("Could not load related products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentProduct]);

  if (!loading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <section aria-label="Related Products" className="w-full mt-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-warm-card p-6 sm:p-8 flex flex-col gap-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
                <Stethoscope className="w-4 h-4 text-amber-700" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">
                Related Products &amp; Suggestions
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Smart Match
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Customers viewing this medicine also considered these authentic alternatives and wellness items
            </p>
          </div>

          <Link
            href="/#store-catalog"
            className="btn-amber-gradient px-4 py-2 rounded-xl text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ─── Loading Skeleton ─── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-slate-50 rounded-2xl border border-slate-100 p-3 h-64 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-200 rounded-xl mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Product Card Grid ─── */}
        {!loading && relatedProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5">
            {relatedProducts.map((p) => (
              <div key={p._id} className="h-full">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
