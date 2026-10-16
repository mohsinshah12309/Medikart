'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Top Pharmaceutical Brands Section
 * Data-driven from the real Medikart catalog (6,149 active products).
 * Lists top licensed manufacturers physically present in the catalog.
 * Links to clean, dedicated brand hubs (/brands/<slug>).
 */
const CATALOG_TOP_BRANDS = [
  {
    name: 'Getz Pharma',
    slug: 'getz-pharma',
    shortCode: 'GETZ',
    productCount: '245+ Products',
    query: 'Getz',
    themeColor: '#008080',
    bgColor: '#F0FDFA',
    badge: 'Top Stocked',
    logo: '/images/brands/getz-pharma.svg',
  },
  {
    name: 'Sami Pharma',
    slug: 'sami-pharma',
    shortCode: 'SAMI',
    productCount: '260+ Products',
    query: 'Sami',
    themeColor: '#4F46E5',
    bgColor: '#EEF2FF',
    badge: 'Popular',
    logo: '/images/brands/sami-pharma.svg',
  },
  {
    name: 'Hilton Pharma',
    slug: 'hilton-pharma',
    shortCode: 'HILTON',
    productCount: '167+ Products',
    query: 'Hilton',
    themeColor: '#059669',
    bgColor: '#ECFDF5',
    badge: 'Essential',
    logo: '/images/brands/hilton-pharma.svg',
  },
  {
    name: 'Barrett Hodgson',
    slug: 'barrett-hodgson',
    shortCode: 'BH',
    productCount: '158+ Products',
    query: 'Barrett',
    themeColor: '#0369A1',
    bgColor: '#F0F9FF',
    badge: 'Trusted',
    logo: '/images/brands/barrett-hodgson.svg',
  },
  {
    name: 'Highnoon Labs',
    slug: 'highnoon-labs',
    shortCode: 'HIGHNOON',
    productCount: '146+ Products',
    query: 'Highnoon',
    themeColor: '#D97706',
    bgColor: '#FFFBEB',
    badge: 'Healthcare',
    logo: '/images/brands/highnoon-labs.svg',
  },
  {
    name: 'Martin Dow',
    slug: 'martin-dow',
    shortCode: 'MARTIN DOW',
    productCount: '141+ Products',
    query: 'Martin Dow',
    themeColor: '#0284C7',
    bgColor: '#F0F9FF',
    badge: 'Quality',
    logo: '/images/brands/martin-dow.svg',
  },
  {
    name: 'CCL Pharma',
    slug: 'ccl-pharma',
    shortCode: 'CCL',
    productCount: '141+ Products',
    query: 'CCL',
    themeColor: '#2563EB',
    bgColor: '#EFF6FF',
    badge: 'Reliable',
    logo: '/images/brands/ccl-pharma.svg',
  },
  {
    name: 'PharmEvo',
    slug: 'pharmevo',
    shortCode: 'PHARMEVO',
    productCount: '129+ Products',
    query: 'PharmEvo',
    themeColor: '#16A34A',
    bgColor: '#F0FDF4',
    badge: 'Wellness',
    logo: '/images/brands/pharmevo.svg',
  },
  {
    name: 'Abbott Labs',
    slug: 'abbott-labs',
    shortCode: 'ABBOTT',
    productCount: '115+ Products',
    query: 'Abbott',
    themeColor: '#0096D6',
    bgColor: '#EFF6FF',
    badge: 'Global',
    logo: '/images/brands/abbott-labs.svg',
  },
  {
    name: 'GSK Pakistan',
    slug: 'gsk-pakistan',
    shortCode: 'GSK',
    productCount: '116+ Products',
    query: 'GSK',
    themeColor: '#F36F21',
    bgColor: '#FFF7ED',
    badge: 'Standard',
    logo: '/images/brands/gsk-pakistan.svg',
  },
  {
    name: 'Atco Labs',
    slug: 'atco-labs',
    shortCode: 'ATCO',
    productCount: '112+ Products',
    query: 'Atco',
    themeColor: '#7C3AED',
    bgColor: '#F5F3FF',
    badge: 'Certified',
    logo: '/images/brands/atco-labs.svg',
  },
  {
    name: 'Ferozsons',
    slug: 'ferozsons',
    shortCode: 'FEROZSONS',
    productCount: '100+ Products',
    query: 'Ferozsons',
    themeColor: '#0891B2',
    bgColor: '#ECFEFF',
    badge: 'Heritage',
    logo: '/images/brands/ferozsons.svg',
  },
  {
    name: 'Searle Company',
    slug: 'searle-pharma',
    shortCode: 'SEARLE',
    productCount: '95+ Products',
    query: 'Searl',
    themeColor: '#0D9488',
    bgColor: '#F0FDFA',
    badge: 'Specialist',
    logo: '/images/brands/searle-pharma.svg',
  },
  {
    name: 'Panadol',
    slug: 'panadol',
    shortCode: 'PANADOL',
    productCount: '13+ Products',
    query: 'Panadol',
    themeColor: '#1E40AF',
    bgColor: '#EFF6FF',
    badge: 'OTC Staple',
    logo: '/images/brands/gsk-pakistan.svg',
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

  // Deduplicated single items array (Phase 2 Link Engine)
  const displayBrands = CATALOG_TOP_BRANDS;

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

        {/* Direction Controls and View All */}
        <div className="flex items-center gap-3">
          <Link
            href="/brands"
            className="hidden sm:inline-flex text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-colors"
          >
            VIEW ALL BRANDS →
          </Link>

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
          {displayBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              title={`${brand.name} (${brand.productCount}) — View brand hub`}
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
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
