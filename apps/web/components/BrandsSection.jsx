'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

/**
 * Top Pharmaceutical Brands Section
 * Data-driven from the real Medikart catalog (6,112 active products).
 * Lists top licensed manufacturers physically present in the catalog.
 */
const CATALOG_TOP_BRANDS = [
  {
    name: 'Getz Pharma',
    shortCode: 'GETZ',
    productCount: '240+ Products',
    query: 'Getz Pharma',
    themeColor: '#008080',
    bgColor: '#F0FDFA',
    badge: 'Top Stocked',
  },
  {
    name: 'Sami Pharma',
    shortCode: 'SAMI',
    productCount: '235+ Products',
    query: 'Sami Pharmaceuticals',
    themeColor: '#4F46E5',
    bgColor: '#EEF2FF',
    badge: 'Popular',
  },
  {
    name: 'Hilton Pharma',
    shortCode: 'HILTON',
    productCount: '160+ Products',
    query: 'Hilton Pharma',
    themeColor: '#059669',
    bgColor: '#ECFDF5',
    badge: 'Essential',
  },
  {
    name: 'Barrett Hodgson',
    shortCode: 'BH',
    productCount: '155+ Products',
    query: 'Barrett Hodgson',
    themeColor: '#0369A1',
    bgColor: '#F0F9FF',
    badge: 'Trusted',
  },
  {
    name: 'Highnoon Labs',
    shortCode: 'HIGHNOON',
    productCount: '145+ Products',
    query: 'Highnoon Laboratories',
    themeColor: '#D97706',
    bgColor: '#FFFBEB',
    badge: 'Healthcare',
  },
  {
    name: 'Martin Dow',
    shortCode: 'MARTIN DOW',
    productCount: '140+ Products',
    query: 'Martin Dow',
    themeColor: '#0284C7',
    bgColor: '#F0F9FF',
    badge: 'Quality',
  },
  {
    name: 'CCL Pharma',
    shortCode: 'CCL',
    productCount: '135+ Products',
    query: 'CCL Pharmaceuticals',
    themeColor: '#2563EB',
    bgColor: '#EFF6FF',
    badge: 'Reliable',
  },
  {
    name: 'PharmEvo',
    shortCode: 'PHARMEVO',
    productCount: '125+ Products',
    query: 'PharmEvo',
    themeColor: '#16A34A',
    bgColor: '#F0FDF4',
    badge: 'Wellness',
  },
  {
    name: 'Abbott Labs',
    shortCode: 'ABBOTT',
    productCount: '115+ Products',
    query: 'Abbott Laboratories',
    themeColor: '#0096D6',
    bgColor: '#EFF6FF',
    badge: 'Global',
  },
  {
    name: 'GSK Pakistan',
    shortCode: 'GSK',
    productCount: '110+ Products',
    query: 'Glaxosmithkline',
    themeColor: '#F36F21',
    bgColor: '#FFF7ED',
    badge: 'Standard',
  },
  {
    name: 'Atco Labs',
    shortCode: 'ATCO',
    productCount: '110+ Products',
    query: 'Atco Laboratories',
    themeColor: '#7C3AED',
    bgColor: '#F5F3FF',
    badge: 'Certified',
  },
  {
    name: 'Ferozsons',
    shortCode: 'FEROZSONS',
    productCount: '100+ Products',
    query: 'Ferozsons Laboratories',
    themeColor: '#0891B2',
    bgColor: '#ECFEFF',
    badge: 'Heritage',
  },
  {
    name: 'Searle Pharma',
    shortCode: 'SEARLE',
    productCount: '95+ Products',
    query: 'Searl Pharmaceuticals',
    themeColor: '#0D9488',
    bgColor: '#F0FDFA',
    badge: 'Specialist',
  },
  {
    name: 'High-Q Int.',
    shortCode: 'HIGH-Q',
    productCount: '90+ Products',
    query: 'High-Q International',
    themeColor: '#E11D48',
    bgColor: '#FFF1F2',
    badge: 'Specialist',
  },
];

export default function BrandsSection() {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-8 md:my-10 select-none" aria-label="Brands Available on Medikart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-yellow-400/30 text-yellow-700 font-black text-xs">
              ★
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Brands Available on Medikart
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Genuine medicines sourced directly from licensed pharmaceutical manufacturers
          </p>
        </div>

        {/* Scroll Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-full border border-yellow-500/40 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-900 flex items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            aria-label="Scroll brands left"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-full border border-yellow-500/40 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-900 flex items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            aria-label="Scroll brands right"
          >
            ›
          </button>
        </div>
      </div>

      {/* Brand Cards Carousel */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-3 pt-1 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATALOG_TOP_BRANDS.map((brand) => (
          <Link
            key={brand.name}
            href={`/?search=${encodeURIComponent(brand.query)}#catalog`}
            className="snap-start shrink-0 w-36 sm:w-40 bg-white hover:bg-yellow-50/50 rounded-2xl border border-slate-200/90 hover:border-yellow-400 p-3.5 flex flex-col items-center justify-between text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1 group cursor-pointer"
          >
            {/* Clean Monogram Brand Shield */}
            <div
              className="w-16 h-14 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm tracking-wider transition-all duration-200 group-hover:scale-105 shadow-2xs border border-slate-100"
              style={{
                backgroundColor: brand.bgColor,
                color: brand.themeColor,
              }}
            >
              {brand.shortCode}
            </div>

            {/* Brand Title & Real Catalog Count */}
            <div className="mt-2.5 w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-yellow-700 transition-colors">
                {brand.badge}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 truncate mt-0.5 group-hover:text-slate-950">
                {brand.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {brand.productCount}
              </p>
            </div>

            {/* Explore Link */}
            <span className="mt-2 text-[10px] font-bold text-slate-600 group-hover:text-yellow-700 group-hover:underline flex items-center gap-0.5">
              Explore Products →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
