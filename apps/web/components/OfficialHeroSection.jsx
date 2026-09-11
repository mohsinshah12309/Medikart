"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { triggerCategorySelect, scrollToCatalog } from '../lib/catalogEvents';

const DEFAULT_CITIES = ['Lahore'];

export default function OfficialHeroSection({ initialCity = 'Lahore', categories = [] }) {
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [cities, setCities] = useState(DEFAULT_CITIES);

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

  const trustBadges = [
    { icon: '⚡', label: 'Fast Delivery' },
    { icon: '📍', label: 'Nearest Pharmacies' },
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
    <section className="relative w-full flex flex-col gap-6 sm:gap-8 pt-2 pb-4 select-none">
      {/* ─────────────────────────────────────────────────────────────────────
          1. MAIN HERO BANNER (Left: Content | Right: Phone Mockup & Skyline)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-30 w-full rounded-3xl bg-gradient-to-br from-[#FFFDF7] via-[#FFFBEB] to-[#FEF3C7]/40 border border-[#F3EFE6] shadow-warm-card p-6 sm:p-10 lg:p-12 min-h-[500px] flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* Background Decorative Radiant Glow & Subtle Arcs (Clipped to Banner) */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-amber-300/35 via-yellow-200/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-200/20 rounded-full blur-2xl" />
        </div>

        {/* ─── Left Column: Brand Copy, Trust Badges, City Selector & CTA ─── */}
        <div className="relative z-10 flex-1 max-w-xl flex flex-col items-start gap-6 text-left">
          
          {/* Top Wordmark & Proximity Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-amber-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#1E293B]">Medikart</span>
            <span className="text-amber-400 font-bold">•</span>
            <span className="text-xs font-semibold text-amber-800">Medicines. Nearest to you.</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.12] text-[#1E293B]">
            Your medicines,<br />
            <span className="bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-xs">
              just a tap away.
            </span>
          </h1>

          {/* Real Benefit-Led Copy */}
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-md">
            Authentic prescription and daily wellness medicines delivered rapidly from licensed neighborhood pharmacies right to your doorstep.
          </p>

          {/* 4 Circular Trust Badges Row */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full pt-1">
            {trustBadges.map((badge, idx) => (
              <div 
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF9C3]/90 hover:bg-[#FEF08A] transition-all border border-[#FEF08A] text-xs font-bold text-[#1E293B] shadow-xs"
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="whitespace-nowrap">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Location Selector Pill & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            
            {/* City Selector Pill with interactive scrollable dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-amber-50/50 border border-amber-300 text-sm font-bold text-[#1E293B] shadow-xs transition-all cursor-pointer"
                aria-haspopup="true"
                aria-expanded={cityDropdownOpen}
              >
                <span className="text-amber-500 text-base">📍</span>
                <span>{selectedCity}</span>
                <span className="text-amber-600 text-xs font-bold ml-1">▾</span>
              </button>

              {cityDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setCityDropdownOpen(false)} 
                  />
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl border border-amber-200 shadow-2xl z-50 overflow-hidden animate-fade-in-up ring-1 ring-black/5">
                    <div className="px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
                      <span>Select City</span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded-full">{cities.length} Cities</span>
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
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                            selectedCity === city 
                              ? 'bg-amber-100/90 text-amber-900 font-extrabold' 
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

            {/* Primary Amber Gradient CTA Button */}
            <Link
              href="/instant-order"
              className="btn-amber-gradient px-6 py-2.5 text-sm font-extrabold shadow-amber-glow flex items-center gap-2 group"
            >
              <span>Order Now</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>

            {/* Fully Functional Browse Products Smooth Scroll Button */}
            <a
              href="#store-catalog"
              onClick={handleScrollCatalog}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-amber-50/70 border border-[#F3EFE6] hover:border-amber-300 text-sm font-bold text-[#1E293B] shadow-xs transition-all cursor-pointer"
            >
              Browse Products
            </a>
          </div>
        </div>

        {/* ─── Right Column: Master Phone Mockup & Skyline ── */}
        <div className="relative z-10 w-full lg:w-[460px] flex flex-col items-center justify-center pt-8 sm:pt-10 lg:pt-6">
          
          {/* Handwritten Annotation on Top-Right */}
          <div className="w-full flex justify-end mb-2 pr-2 sm:pr-6 z-20 pointer-events-none">
            <div className="flex flex-col items-end transform rotate-[-3deg]">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-amber-200 shadow-xs">
                <span className="text-amber-500 text-xs animate-pulse">✨</span>
                <span className="font-script text-lg sm:text-2xl font-bold text-[#D97706] whitespace-nowrap">
                  Trusted medicine,Fastest delivery
                </span>
              </div>
              {/* Playful curved hand-drawn doodle arrow pointing toward the phone */}
              <svg className="w-16 h-5 text-amber-500 mr-4 mt-0.5 opacity-80" viewBox="0 0 60 20" fill="none">
                <path d="M10,2 Q30,16 52,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M44,14 L52,10 L48,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Relative Container for Phone and Floating Badges */}
          <div className="relative flex items-center justify-center w-full">
            
            {/* Skyline Illustration Backdrop */}
            <div className="absolute inset-0 flex items-end justify-center opacity-30 pointer-events-none z-0 overflow-hidden">
              <svg viewBox="0 0 500 300" className="w-full h-full text-amber-400 fill-current">
                <path d="M250,40 L253,120 L258,200 L268,260 L232,260 L242,200 L247,120 Z" opacity="0.75" />
                <circle cx="250" cy="35" r="5" />
                <rect x="245" y="115" width="10" height="6" rx="2" />
                <rect x="240" y="195" width="20" height="8" rx="3" />
                <path d="M80,260 Q120,200 160,260 Z" opacity="0.5" />
                <path d="M340,260 Q380,190 420,260 Z" opacity="0.5" />
                <rect x="40" y="220" width="40" height="40" opacity="0.3" />
                <rect x="430" y="210" width="50" height="50" opacity="0.3" />
                <path d="M80,60 L120,75 L95,85 L90,105 L105,88 Z" fill="#F59E0B" opacity="0.85" />
              </svg>
            </div>

            {/* Floating Medicine Box (Behind Phone Left) */}
            <div className="absolute -left-4 top-12 hidden sm:flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200 p-2.5 shadow-md transform -rotate-6 z-20">
              <span className="text-xl">📦</span>
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Medikart</span>
              <span className="text-[8px] text-slate-500 font-bold">100% Genuine</span>
            </div>

            {/* Floating Safe Packing Pill (Behind Phone Right) */}
            <div className="absolute -right-3 bottom-12 hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200 px-3 py-1.5 shadow-md transform rotate-6 z-20">
              <span className="text-lg">💊</span>
              <div className="text-left">
                <div className="text-[10px] font-extrabold text-slate-800 leading-tight">Safe Packing</div>
                <div className="text-[8px] font-bold text-emerald-600">Sanitized Box</div>
              </div>
            </div>

            {/* ─── The Smartphone Mockup Screen ─── */}
            <div className="relative w-[280px] sm:w-[305px] h-[520px] sm:h-[550px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-[5px] border-slate-800 transform hover:scale-[1.01] transition-transform duration-300 z-10">
              
              {/* Phone Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Inner Phone Screen Content */}
              <div className="w-full h-full bg-[#FAF8F5] rounded-[36px] overflow-hidden flex flex-col pt-7 px-3.5 pb-3.5 select-none relative">
                
                {/* In-App Header */}
                <div className="flex items-center justify-between py-2 border-b border-amber-100/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs font-black text-slate-900">
                      🛒
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs font-black text-slate-900">medikart</div>
                      <div className="text-[8px] font-bold text-amber-700">{selectedCity} Hub</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    ⚡ 45 mins
                  </div>
                </div>

                {/* In-App Tagline */}
                <div className="pt-2.5 pb-1.5 text-left">
                  <p className="text-[11px] font-extrabold text-slate-700 leading-tight">
                    Find medicines from nearest pharmacies
                  </p>
                </div>

                {/* In-App Search Bar */}
                <div className="relative w-full my-1">
                  <div 
                    onClick={handleScrollCatalog}
                    className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-200/80 shadow-xs text-xs text-slate-400 cursor-pointer hover:border-amber-300 transition-colors"
                  >
                    <span>🔍</span>
                    <span className="text-[10.5px] font-medium text-slate-400">Search medicines, vitamins...</span>
                  </div>
                </div>

                {/* In-App 6-Category Grid with Real Photos & Click Routing */}
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Categories</span>
                    <span className="text-[10px] font-bold text-amber-600 cursor-pointer hover:underline" onClick={handleScrollCatalog}>See all</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {appCategories.map((cat, i) => (
                      <div 
                        key={i} 
                        onClick={(e) => handleAppCategoryClick(cat, e)}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-amber-100/80 shadow-xs hover:border-amber-300 hover:bg-amber-50/50 transition-all cursor-pointer group"
                      >
                        {/* Real Photo Thumbnail */}
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-amber-200 relative bg-amber-50 group-hover:scale-105 transition-transform">
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-800 leading-tight text-left line-clamp-2 group-hover:text-amber-800 transition-colors">
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
                    className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 flex items-center justify-between shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <div className="text-left leading-tight">
                      <div className="text-[10px] font-black">Prescription Upload</div>
                      <div className="text-[8px] font-semibold text-slate-800">Pharmacist verifies in 5 min</div>
                    </div>
                    <span className="text-xs font-black bg-white/85 rounded-full px-2 py-0.5">Upload</span>
                  </Link>
                </div>

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
