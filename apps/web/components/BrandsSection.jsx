'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    logo: '/images/brands/getz-pharma.svg',
  },
  {
    name: 'Sami Pharma',
    shortCode: 'SAMI',
    productCount: '235+ Products',
    query: 'Sami Pharmaceuticals',
    themeColor: '#4F46E5',
    bgColor: '#EEF2FF',
    badge: 'Popular',
    logo: '/images/brands/sami-pharma.svg',
  },
  {
    name: 'Hilton Pharma',
    shortCode: 'HILTON',
    productCount: '160+ Products',
    query: 'Hilton Pharma',
    themeColor: '#059669',
    bgColor: '#ECFDF5',
    badge: 'Essential',
    logo: '/images/brands/hilton-pharma.svg',
  },
  {
    name: 'Barrett Hodgson',
    shortCode: 'BH',
    productCount: '155+ Products',
    query: 'Barrett Hodgson',
    themeColor: '#0369A1',
    bgColor: '#F0F9FF',
    badge: 'Trusted',
    logo: '/images/brands/barrett-hodgson.svg',
  },
  {
    name: 'Highnoon Labs',
    shortCode: 'HIGHNOON',
    productCount: '145+ Products',
    query: 'Highnoon Laboratories',
    themeColor: '#D97706',
    bgColor: '#FFFBEB',
    badge: 'Healthcare',
    logo: '/images/brands/highnoon-labs.svg',
  },
  {
    name: 'Martin Dow',
    shortCode: 'MARTIN DOW',
    productCount: '140+ Products',
    query: 'Martin Dow',
    themeColor: '#0284C7',
    bgColor: '#F0F9FF',
    badge: 'Quality',
    logo: '/images/brands/martin-dow.svg',
  },
  {
    name: 'CCL Pharma',
    shortCode: 'CCL',
    productCount: '135+ Products',
    query: 'CCL Pharmaceuticals',
    themeColor: '#2563EB',
    bgColor: '#EFF6FF',
    badge: 'Reliable',
    logo: '/images/brands/ccl-pharma.svg',
  },
  {
    name: 'PharmEvo',
    shortCode: 'PHARMEVO',
    productCount: '125+ Products',
    query: 'PharmEvo',
    themeColor: '#16A34A',
    bgColor: '#F0FDF4',
    badge: 'Wellness',
    logo: '/images/brands/pharmevo.svg',
  },
  {
    name: 'Abbott Labs',
    shortCode: 'ABBOTT',
    productCount: '115+ Products',
    query: 'Abbott Laboratories',
    themeColor: '#0096D6',
    bgColor: '#EFF6FF',
    badge: 'Global',
    logo: '/images/brands/abbott-labs.svg',
  },
  {
    name: 'GSK Pakistan',
    shortCode: 'GSK',
    productCount: '110+ Products',
    query: 'Glaxosmithkline',
    themeColor: '#F36F21',
    bgColor: '#FFF7ED',
    badge: 'Standard',
    logo: '/images/brands/gsk-pakistan.svg',
  },
  {
    name: 'Atco Labs',
    shortCode: 'ATCO',
    productCount: '110+ Products',
    query: 'Atco Laboratories',
    themeColor: '#7C3AED',
    bgColor: '#F5F3FF',
    badge: 'Certified',
    logo: '/images/brands/atco-labs.svg',
  },
  {
    name: 'Ferozsons',
    shortCode: 'FEROZSONS',
    productCount: '100+ Products',
    query: 'Ferozsons Laboratories',
    themeColor: '#0891B2',
    bgColor: '#ECFEFF',
    badge: 'Heritage',
    logo: '/images/brands/ferozsons.svg',
  },
  {
    name: 'Searle Pharma',
    shortCode: 'SEARLE',
    productCount: '95+ Products',
    query: 'Searl Pharmaceuticals',
    themeColor: '#0D9488',
    bgColor: '#F0FDFA',
    badge: 'Specialist',
    logo: '/images/brands/searle-pharma.svg',
  },
  {
    name: 'High-Q Int.',
    shortCode: 'HIGH-Q',
    productCount: '90+ Products',
    query: 'High-Q International',
    themeColor: '#E11D48',
    bgColor: '#FFF1F2',
    badge: 'Specialist',
    logo: '/images/brands/high-q.svg',
  },
];

export default function BrandsSection() {
  const scrollRef = useRef(null);
  const [slideDirection, setSlideDirection] = useState('ltr');
  const [isPaused, setIsPaused] = useState(false);

  const toggleDirection = (dir) => {
    setSlideDirection(dir);
    setIsPaused(false);
  };

  // Duplicate items array for continuous seamless infinite loop
  const displayBrands = [...CATALOG_TOP_BRANDS, ...CATALOG_TOP_BRANDS];

  return (
    <section className="my-8 md:my-10 overflow-hidden" aria-label="Brands Available on Medikart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400/30 text-amber-800 font-black text-xs">
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

        {/* Direction Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleDirection('ltr')}
            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              slideDirection === 'ltr' ? 'btn-amber-gradient text-slate-900' : 'bg-white border border-amber-200 text-slate-700'
            }`}
            aria-label="Slide brands left to right"
            title="Slide brands left to right"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => toggleDirection('rtl')}
            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              slideDirection === 'rtl' ? 'btn-amber-gradient text-slate-900' : 'bg-white border border-amber-200 text-slate-700'
            }`}
            aria-label="Slide brands right to left"
            title="Slide brands right to left"
          >
            ›
          </button>
        </div>
      </div>

      {/* Auto-Sliding Brand Cards Track (Continuous Left-to-Right loop, Pauses on Hover) */}
      <div
        className="relative w-full overflow-hidden pb-3 pt-1 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          ref={scrollRef}
          className={`flex items-stretch gap-3.5 sm:gap-4 ${
            slideDirection === 'ltr' ? 'animate-slide-ltr' : 'animate-slide-rtl'
          }`}
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {displayBrands.map((brand, idx) => (
            <Link
              key={`${brand.name}-${idx}`}
              href={`/?search=${encodeURIComponent(brand.query)}#store-catalog`}
              title={`${brand.name} (${brand.productCount}) — Click to explore products`}
              aria-label={`${brand.name} (${brand.productCount})`}
              className="shrink-0 w-36 sm:w-44 h-20 sm:h-24 bg-white hover:bg-amber-50/50 rounded-2xl border border-slate-200/90 hover:border-amber-400 p-2.5 sm:p-3 flex items-center justify-center transition-all duration-200 hover:shadow-warm-card hover:-translate-y-1 group/card cursor-pointer shadow-xs"
            >
              {/* Brand Official Logo */}
              <div className="relative w-full h-full">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} pharmaceutical manufacturer logo`}
                  fill
                  sizes="(max-width: 640px) 144px, 176px"
                  className="object-contain transition-transform duration-300 group-hover/card:scale-110"
                  priority={idx < 8}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
