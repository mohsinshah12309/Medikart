"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { triggerCategorySelect, triggerCatalogSearch, scrollToCatalog } from '../lib/catalogEvents';
import MonthlyRefillSection from './monthlyRefill/MonthlyRefillSection';

const DEFAULT_CITIES = ['Lahore'];

export default function OfficialHeroSection({ initialCity = 'Lahore', categories = [], initialProducts = [] }) {
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [cities, setCities] = useState(DEFAULT_CITIES);

  // Dynamic trending searches state with rich pharmacy staples
  const [trendingSearches, setTrendingSearches] = useState([
    { icon: '💊', name: 'Panadol' },
    { icon: '💊', name: 'Augmentin' },
    { icon: '✨', name: 'Surbex Z' },
    { icon: '🍼', name: 'Baby Diapers' },
    { icon: '✨', name: 'Centrum' },
    { icon: '🌿', name: 'Nexum' },
    { icon: '💊', name: 'Brufen' },
    { icon: '✨', name: 'CAC 1000 Plus' },
    { icon: '🩹', name: 'First Aid' },
    { icon: '🧴', name: 'Facewash' },
  ]);

  // Fetch dynamic active cities from backend API (strictly from DB)
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    fetch(`${apiUrl}/cities`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.cities && data.data.cities.length > 0) {
          const apiCityNames = data.data.cities.map((c) => c.name?.trim()).filter(Boolean);
          if (apiCityNames.length > 0) {
            setCities(apiCityNames);
            setSelectedCity((prev) => (apiCityNames.includes(prev) ? prev : apiCityNames[0]));
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic cities, using defaults:', err);
      });
  }, []);

  // Fetch dynamic trending searches from backend API
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    fetch(`${apiUrl}/trending-searches?limit=12`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.trendingSearches && data.data.trendingSearches.length > 0) {
          setTrendingSearches(data.data.trendingSearches);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic trending searches:', err);
      });
  }, []);

  // Helper: Find MongoDB category ID by slug or fuzzy name
  const findCategoryId = (slug, name) => {
    if (!categories || categories.length === 0) return '';
    const bySlug = categories.find((c) => c.slug === slug);
    if (bySlug) return bySlug._id;
    const lowerName = name.toLowerCase();
    const byName = categories.find(
      (c) =>
        c.name.toLowerCase().includes(lowerName) ||
        lowerName.includes(c.name.toLowerCase()) ||
        c.slug?.toLowerCase().includes(slug.toLowerCase())
    );
    return byName ? byName._id : '';
  };

  const handleAppCategoryClick = (cat, e) => {
    if (e) e.preventDefault();
    const catId = findCategoryId(cat.slug, cat.name);
    triggerCategorySelect(catId, true);
    scrollToCatalog();
  };

  const handleQuickSearch = (term, e) => {
    if (e) e.preventDefault();
    if (!term) return;

    // Record search hit in backend asynchronously
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      fetch(`${apiUrl}/search/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term }),
      }).catch(() => {});
    } catch (_) {}

    triggerCatalogSearch(term);
    scrollToCatalog();
  };

  const trustBadges = [
    { icon: '⚡', label: 'Fast Delivery' },
    { icon: '🛡️', label: 'Trusted & Genuine' },
    { icon: '❤️', label: 'Better Health' },
  ];

  // 6 Core Categories with Authentic Commercial Studio Photography
  const appCategories = [
    { 
      name: 'Prescription Medicines', 
      image: '/images/app-categories/prescription-medicines.jpg',
      slug: 'medicines' 
    },
    { 
      name: 'OTC Products', 
      image: '/images/app-categories/otc-products.jpg',
      slug: 'otc' 
    },
    { 
      name: 'Vitamins & Supplements', 
      image: '/images/app-categories/vitamins-supplements.jpg',
      slug: 'vitamins' 
    },
    { 
      name: 'Baby Care', 
      image: '/images/app-categories/baby-care.jpg',
      slug: 'diapers-napkins' 
    },
    { 
      name: 'Personal Care', 
      image: '/images/app-categories/personal-care.jpg',
      slug: 'dermatology' 
    },
    { 
      name: 'Health Devices', 
      image: '/images/app-categories/health-devices.jpg',
      slug: 'diagnostics' 
    },
  ];

  const handleScrollCatalog = (e) => {
    if (e) e.preventDefault();
    scrollToCatalog();
  };

  return (
    <section className="relative w-full flex flex-col gap-6 sm:gap-8 pt-1 pb-2">
      {/* ─────────────────────────────────────────────────────────────────────
          1. DUAL HERO CARDS SECTION (Card 1: Brand & Actions | Card 2: Interactive App Mockup)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch relative z-30">
        
        {/* ─── CARD 1 (Left): Compact & Rich Hero Proposition, Interactive Quick Searches & CTAs ─── */}
        <div className="lg:col-span-7 w-full rounded-3xl bg-[#FFF352] bg-gradient-to-br from-[#FFFDE0] via-[#FFF352] to-[#FEE833] border-2 border-[#F7E53B] shadow-lg shadow-yellow-200/50 p-5 sm:p-7 lg:p-7 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#F7E53B]">
          
          {/* Background Decorative Radiant Glow & Floating Micro Capsule */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/45 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-yellow-300/35 rounded-full blur-2xl" />
            {/* Subtle floating 3D medical decor in background */}
            <div className="absolute right-4 bottom-16 opacity-15 text-5xl select-none font-black text-slate-900 pointer-events-none animate-float">
              💊
            </div>
          </div>

          {/* Card 1 Top & Middle Content Area */}
          <div className="relative z-10 flex flex-col items-start gap-3.5 text-left">
            
            {/* Top Wordmark & Proximity Tagline with Interactive Pulse */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-amber-300/80 shadow-xs hover:bg-white hover:scale-102 transition-all duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-950">Medikart</span>
              <span className="text-amber-500 font-black">•</span>
              <span className="text-xs font-bold text-amber-950">Medicines. Nearest to you.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black font-heading tracking-tight leading-[1.15] text-slate-950">
              Your medicines,<br />
              <span className="text-slate-900 drop-shadow-xs">
                just a tap away.
              </span>
            </h1>

            {/* Benefit-Led Copy */}
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed max-w-lg font-medium">
              Authentic prescription and daily wellness medicines delivered rapidly from licensed neighborhood pharmacies right to your doorstep.
            </p>

            {/* Trust Badges in Interactive Pills */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full pt-0.5">
              {trustBadges.map((badge, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 border border-amber-300 text-[11px] sm:text-xs font-bold text-slate-900 shadow-2xs cursor-default"
                >
                  <span className="text-xs sm:text-sm">{badge.icon}</span>
                  <span className="whitespace-nowrap">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Interactive Trending Quick Searches Bar (Dynamic Most-Searched Products) */}
            <div className="w-full pt-2 flex flex-col gap-1.5 border-t border-amber-400/40">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-950 uppercase tracking-wide">
                <span className="text-amber-700 animate-pulse">🔥</span>
                <span>Trending Searches:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {trendingSearches.map((item, idx) => {
                  const name = typeof item === 'string' ? item : item.name;
                  const icon = typeof item === 'object' && item.icon ? item.icon : '🔍';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleQuickSearch(name, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white hover:border-amber-400 hover:scale-105 active:scale-95 transition-all duration-150 border border-amber-300/80 text-[11px] font-bold text-slate-900 shadow-2xs cursor-pointer group"
                    >
                      <span className="text-[11px] group-hover:scale-110 transition-transform">{icon}</span>
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Card 1 Action Controls (Bottom) */}
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 pt-4 mt-2">
            
            {/* City Selector Pill with interactive scrollable dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-amber-50 border border-amber-300 text-xs sm:text-sm font-black text-slate-900 shadow-xs hover:scale-103 active:scale-97 transition-all cursor-pointer"
                aria-haspopup="true"
                aria-expanded={cityDropdownOpen}
              >
                <span className="text-amber-500 text-sm">📍</span>
                <span>{selectedCity}</span>
                <span className="text-amber-700 text-xs font-bold ml-0.5">▾</span>
              </button>

              {cityDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setCityDropdownOpen(false)} 
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl border border-amber-300 shadow-2xl z-50 overflow-hidden animate-fade-in-up ring-1 ring-black/10">
                    <div className="px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
                      <span>Select City</span>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded-full">{cities.length} Cities</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto overscroll-contain py-1 divide-y divide-slate-100 bg-white scrollbar-thin">
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedCity(city);
                            setCityDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                            selectedCity === city 
                              ? 'bg-amber-100 text-amber-950 font-extrabold' 
                              : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900 bg-white'
                          }`}
                        >
                          <span className="truncate">{city}</span>
                          {selectedCity === city && <span className="text-emerald-600 font-black text-sm">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Primary Order Now Button with interactive hover pulse */}
            <Link
              href="/instant-order"
              className="px-5 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white hover:text-[#FFEB3B] text-xs sm:text-sm font-black shadow-md hover:shadow-lg hover:scale-103 active:scale-97 flex items-center gap-1.5 transition-all group"
            >
              <span>Order Now</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>

            {/* Browse Products Button */}
            <a
              href="#store-catalog"
              onClick={handleScrollCatalog}
              className="px-4 py-2 rounded-full bg-white/90 hover:bg-white hover:border-amber-400 hover:scale-103 active:scale-97 border border-amber-300 text-xs sm:text-sm font-bold text-slate-900 shadow-xs transition-all cursor-pointer"
            >
              Browse Products
            </a>
          </div>

        </div>

        {/* ─── CARD 2 (Right): Compact Interactive App Showcase & 3D Phone Mockup ─── */}
        <div className="lg:col-span-5 w-full rounded-3xl bg-gradient-to-br from-[#FFFDE7] via-[#FFF9C4] to-[#FFEB3B]/35 border-2 border-amber-300/80 shadow-lg shadow-amber-200/30 p-4 sm:p-5 lg:p-6 flex flex-col items-center justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-amber-400">
          
          {/* Background Decorative Skyline & Glow */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-300/25 rounded-full blur-2xl" />
            <div className="absolute bottom-0 inset-x-0 h-32 flex items-end justify-center opacity-25">
              <svg viewBox="0 0 500 300" className="w-full h-full text-amber-500 fill-current">
                <path d="M250,40 L253,120 L258,200 L268,260 L232,260 L242,200 L247,120 Z" opacity="0.75" />
                <circle cx="250" cy="35" r="5" />
                <rect x="245" y="115" width="10" height="6" rx="2" />
                <rect x="240" y="195" width="20" height="8" rx="3" />
                <path d="M80,260 Q120,200 160,260 Z" opacity="0.5" />
                <path d="M340,260 Q380,190 420,260 Z" opacity="0.5" />
                <rect x="40" y="220" width="40" height="40" opacity="0.3" />
                <rect x="430" y="210" width="50" height="50" opacity="0.3" />
              </svg>
            </div>
          </div>

          {/* Top Floating Badges Row (Top-Left: 100% Genuine | Top-Right: Fastest Delivery) */}
          <div className="w-full flex items-center justify-between mb-1 z-20 pointer-events-none">
            {/* Top-Left: Floating 100% Genuine Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-amber-300 shadow-2xs transform -rotate-2 animate-float">
              <span className="text-sm">📦</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wide">Medikart</span>
                <span className="text-[8px] text-amber-600 font-bold">• 100% Genuine</span>
              </div>
            </div>

            {/* Top-Right: Handwritten Annotation / Feature Callout */}
            <div className="flex flex-col items-end transform rotate-[-2deg] ml-auto">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/95 backdrop-blur-sm border border-amber-300 shadow-2xs">
                <span className="text-amber-500 text-xs animate-pulse">✨</span>
                <span className="font-script text-sm sm:text-base font-bold text-amber-800 whitespace-nowrap">
                  Trusted medicine, Fastest delivery
                </span>
              </div>
              {/* Curved hand-drawn doodle arrow pointing toward the phone */}
              <svg className="w-12 h-3 text-amber-600 mr-3 mt-0.5 opacity-80" viewBox="0 0 60 20" fill="none">
                <path d="M10,2 Q30,16 52,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M44,14 L52,10 L48,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Relative Container for Phone Mockup */}
          <div className="relative flex items-center justify-center w-full my-auto z-10 py-1">
            
            {/* ─── The Smartphone Mockup Screen (Completely Unobstructed) ─── */}
            <div className="relative w-[265px] sm:w-[290px] md:w-[310px] lg:w-[295px] xl:w-[325px] h-[445px] sm:h-[480px] md:h-[510px] lg:h-[490px] xl:h-[520px] bg-slate-900 rounded-[42px] sm:rounded-[46px] p-2.5 sm:p-3 shadow-2xl border-[5px] sm:border-[6px] border-slate-800 transform hover:scale-[1.01] transition-transform duration-300 z-10">
              
              {/* Phone Speaker Notch */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-3.5 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Inner Phone Screen Content */}
              <div className="w-full h-full bg-[#FAF8F5] rounded-[30px] sm:rounded-[34px] overflow-hidden flex flex-col pt-6 sm:pt-7 px-3 sm:px-3.5 pb-3 sm:pb-3.5 relative">
                
                {/* In-App Header */}
                <div className="flex items-center justify-between py-1 border-b border-amber-100/70">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#FFEB3B] flex items-center justify-center text-xs font-black text-slate-900 shadow-2xs">
                      🛒
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs sm:text-[13px] font-black text-slate-900">medikart</div>
                      <div className="text-[8.5px] sm:text-[9.5px] font-bold text-amber-800">{selectedCity} Hub</div>
                    </div>
                  </div>
                  <div className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-700 bg-amber-100 px-2 py-0.5 rounded-full shadow-2xs">
                    ⚡ 45 mins
                  </div>
                </div>

                {/* In-App Tagline */}
                <div className="pt-2 pb-1 text-left">
                  <p className="text-[11px] sm:text-xs font-black text-slate-800 leading-snug">
                    Find medicines from nearest pharmacies
                  </p>
                </div>

                {/* In-App Search Bar */}
                <div className="relative w-full my-1">
                  <div 
                    onClick={handleScrollCatalog}
                    className="flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-1.5 border border-slate-200 shadow-2xs text-xs text-slate-400 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
                  >
                    <span className="text-xs">🔍</span>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">Search medicines, vitamins...</span>
                  </div>
                </div>

                {/* In-App 6-Category Grid with Real Photos & Click Routing */}
                <div className="pt-1.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10.5px] sm:text-[11.5px] font-black text-slate-800 uppercase tracking-tight">Categories</span>
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-700 cursor-pointer hover:underline" onClick={handleScrollCatalog}>See all</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {appCategories.map((cat, i) => (
                      <div 
                        key={i} 
                        onClick={(e) => handleAppCategoryClick(cat, e)}
                        className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-white border border-amber-100 shadow-2xs hover:border-amber-400 hover:bg-amber-50/60 hover:scale-102 active:scale-98 transition-all cursor-pointer group"
                      >
                        {/* Real Photo Thumbnail */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 border border-amber-200 relative bg-amber-50 group-hover:scale-105 transition-transform">
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-800 leading-tight text-left line-clamp-2 group-hover:text-amber-800 transition-colors">
                          {cat.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom In-App Banner Accent */}
                <div className="mt-auto pt-2">
                  <Link 
                    href="/instant-order"
                    className="w-full p-2 rounded-xl sm:rounded-2xl bg-[#FFEB3B] hover:bg-[#FFE01B] border border-amber-300 text-slate-950 flex items-center justify-between shadow-2xs cursor-pointer hover:scale-102 active:scale-98 transition-all"
                  >
                    <div className="text-left leading-tight">
                      <div className="text-[10px] sm:text-[11px] font-black">Prescription Upload</div>
                      <div className="text-[8px] sm:text-[9px] font-bold text-amber-900">Verified in 5 min</div>
                    </div>
                    <span className="text-[10.5px] sm:text-xs font-black bg-white rounded-full px-2.5 py-0.5 text-slate-900 shadow-2xs">Upload</span>
                  </Link>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Floating Badge Row (Bottom-Right, non-overlapping) */}
          <div className="w-full flex justify-end mt-1 pr-1 z-20 pointer-events-none">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-amber-300 shadow-2xs transform rotate-1 animate-float" style={{ animationDelay: '1.5s' }}>
              <span className="text-sm">💊</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-slate-800">Safe Packing</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. TWO FEATURE CALLOUT BLOCKS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10">
        
        {/* Card 1: Prescription Order with Ease */}
        <div className="card-warm p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-white to-amber-50/50 border border-[#F3EFE6] min-h-[220px]">
          <div className="absolute -right-4 -bottom-6 text-8xl font-black text-amber-200/25 pointer-events-none select-none">
            ℞
          </div>

          <div className="relative z-10 max-w-sm text-left">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-3">
              Prescription Service
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-[#1E293B] leading-tight">
              Order your prescription medicines with ease.
            </h2>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed font-medium">
              Upload your prescription, we'll handle the rest — licensed pharmacist verification and rapid fulfillment.
            </p>
          </div>

          <div className="relative z-10 pt-6 flex items-center justify-between">
            <Link
              href="/instant-order"
              className="btn-amber-gradient px-5 py-2.5 text-xs sm:text-sm font-extrabold shadow-amber-glow flex items-center gap-2 group"
            >
              <span>Order Now</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-12 h-14 bg-white rounded-lg border border-amber-200 shadow-sm p-1.5 flex flex-col justify-between transform -rotate-3">
                <span className="text-xs font-black text-amber-700">℞</span>
                <div className="space-y-1">
                  <div className="h-0.5 bg-slate-200 rounded" />
                  <div className="h-0.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-0.5 bg-amber-300 rounded w-1/2" />
                </div>
              </div>
              <div className="w-10 h-12 bg-slate-100 rounded-lg border border-slate-300 shadow-sm p-1 grid grid-cols-2 gap-1 items-center transform rotate-6">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-white border border-slate-200" />
                <div className="w-3 h-3 rounded-full bg-white border border-slate-200" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Need It Now? We've Got You */}
        <div className="card-warm p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-white border border-amber-200/70 min-h-[220px]">
          
          <div className="relative z-10 max-w-sm text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <span>⚡ Express Dispatch</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-[#1E293B] leading-tight">
              Need it now?<br />We've got you.
            </h2>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed font-medium">
              Connected to pharmacies near you for fast delivery all across Pakistan.
            </p>
          </div>

          <div className="relative z-10 pt-6 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-amber-300 text-xs font-bold text-slate-800 shadow-xs">
              <span className="text-amber-500">📍</span>
              <span>{selectedCity}</span>
              <span className="text-amber-600 text-[10px]">▾</span>
            </div>

            <div className="relative flex items-center">
              <div className="text-4xl transform -scale-x-100 drop-shadow-md">
                🛵
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-400 border border-amber-500 flex items-center justify-center text-xs font-black shadow-xs -ml-2 -mt-4">
                🛒
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2.5. 30-DAY MONTHLY MEDICINE REFILL ORDER SECTION
      ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full relative z-10">
        <MonthlyRefillSection initialProducts={initialProducts} />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. FULL-WIDTH CATEGORIES STRIP
      ────────────────────────────────────────────────────────────────────── */}
      <div className="card-warm p-6 sm:p-8 bg-white border border-[#F3EFE6] flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Left Headline, Subtitle & Button */}
        <div className="flex-1 text-left max-w-sm">
          <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-[#1E293B] leading-tight">
            Everything you need for a healthier you.
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
            From everyday essentials to specialised care — all in one place.
          </p>
          <div className="pt-3">
            <a
              href="#store-catalog"
              onClick={handleScrollCatalog}
              className="btn-amber-gradient px-4 py-2 text-xs font-extrabold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Shop Categories</span>
              <span>→</span>
            </a>
          </div>
        </div>

        {/* Middle: 6 Circular Category Photo Cards */}
        <div className="flex-2 grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 w-full lg:w-auto">
          {appCategories.map((cat, idx) => (
            <div
              key={idx}
              onClick={(e) => handleAppCategoryClick(cat, e)}
              className="flex flex-col items-center text-center group cursor-pointer p-2 rounded-2xl hover:bg-amber-50/60 transition-colors"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-300 group-hover:border-amber-500 shadow-xs group-hover:shadow-md transition-all transform group-hover:scale-110 relative bg-amber-50 flex-shrink-0">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="64px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-2 leading-tight max-w-[85px] group-hover:text-amber-700 transition-colors">
                {cat.name}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Handwritten Script Annotation */}
        <div className="hidden xl:flex flex-col items-end text-right pl-4 border-l border-slate-100 flex-shrink-0">
          <div className="font-script text-2xl font-bold text-[#D97706] transform rotate-[-4deg]">
            Trusted pharmacies.<br />Real people. ♡
          </div>
        </div>

      </div>
    </section>
  );
}
