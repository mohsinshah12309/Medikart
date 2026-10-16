"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const FALLBACK_BANNERS = [
  {
    _id: "hero-1",
    title: "100% Genuine Pharmacy Sourced Medicines",
    subtitle: "Consult with registered pharmacists and order authentic prescription & OTC medicines.",
    badgeText: "Licensed Pharmacy Partners",
    ctaText: "Upload Prescription",
    ctaLink: "/instant-order",
    secondaryText: "Browse Medicines",
    secondaryLink: "/categories/medicines",
    imageUrl: "/banners/hero-1.webp",
  },
  {
    _id: "hero-2",
    title: "Family Daily Wellness & Vitamins",
    subtitle: "Boost your family immunity with verified multivitamins, calcium & vital supplements.",
    badgeText: "Essential Immunity",
    ctaText: "Shop Daily Wellness",
    ctaLink: "/categories/vitamins",
    secondaryText: "Learn More",
    secondaryLink: "/about",
    imageUrl: "/banners/hero-2.webp",
  },
  {
    _id: "hero-3",
    title: "Dermatological Skincare & Glow",
    subtitle: "Specialist skin hydration, sunblocks, and dermatologist-tested therapeutic creams.",
    badgeText: "Dermatology Specialist",
    ctaText: "Explore Skincare",
    ctaLink: "/categories/dermatology",
    secondaryText: "View Products",
    secondaryLink: "/categories/dermatology",
    imageUrl: "/banners/hero-3.webp",
  },
  {
    _id: "hero-4",
    title: "Rapid Doorstep Medicine Delivery",
    subtitle: "Fast, secure delivery with Cash on Delivery and verified partner pharmacies across Pakistan.",
    badgeText: "Express Doorstep Service",
    ctaText: "Order Now",
    ctaLink: "/instant-order",
    secondaryText: "Browse All Categories",
    secondaryLink: "/categories/medicines",
    imageUrl: "/banners/hero-4.webp",
  },
];

export default function HeroBannerCarousel({ initialBanners = [] }) {
  const [banners, setBanners] = useState(
    initialBanners && initialBanners.length > 0 ? initialBanners : FALLBACK_BANNERS
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("next"); // "next" | "prev"
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef(null);

  // Swipe / Drag references
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  // Sync with initialBanners or fetch if empty
  useEffect(() => {
    if (initialBanners && initialBanners.length > 0) {
      setBanners(initialBanners);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/banners?placement=hero`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.banners && data.data.banners.length > 0) {
            setBanners(data.data.banners);
          }
        })
        .catch(() => {});
    }
  }, [initialBanners]);

  const pauseBriefly = useCallback(() => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  }, []);

  const handleNext = useCallback(() => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (idx) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? "next" : "prev");
    setCurrentIndex(idx);
    pauseBriefly();
  };

  // Continuous Auto-slide every 4.5 seconds (resumes automatically after interaction)
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, banners.length, handleNext]);

  // Touch Swipe for mobile devices
  const handleTouchStart = (e) => {
    dragStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0]?.clientX || 0;
    const diff = dragStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      pauseBriefly();
    }
  };

  // Mouse Drag Swipe for desktop/laptop trackpad
  const handleMouseDown = (e) => {
    // Only drag on main left click and ignore clicks on buttons or links
    if (e.button !== 0 || e.target.closest("a, button")) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
  };
  const handleMouseUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = dragStartX.current - e.clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      pauseBriefly();
    }
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden group select-none shadow-sm hover:shadow-md transition-shadow duration-300 cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      role="region"
      aria-label="Promotional Banners Carousel"
    >
      {/* Slides Container */}
      <div className="relative w-full min-h-[340px] sm:min-h-[380px] md:min-h-[420px] overflow-hidden rounded-3xl bg-amber-400">
        {banners.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide._id || idx}
              aria-hidden={!isActive}
              className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out flex items-center ${
                isActive
                  ? "opacity-100 translate-x-0 z-10 pointer-events-auto"
                  : idx < currentIndex
                  ? "opacity-0 -translate-x-full z-0 pointer-events-none"
                  : "opacity-0 translate-x-full z-0 pointer-events-none"
              }`}
            >
              {/* Card Background & Gradient */}
              <div className="relative w-full h-full bg-gradient-to-r from-amber-300 via-yellow-400 to-yellow-300 text-slate-900 overflow-hidden flex items-center border border-yellow-400/90 rounded-3xl">
                {/* Ambient Soft Lighting Orbs */}
                <div className="absolute top-0 right-1/3 w-80 h-80 bg-white/35 blur-3xl rounded-full pointer-events-none z-0" />
                <div className="absolute bottom-0 left-10 w-64 h-64 bg-amber-500/25 blur-3xl rounded-full pointer-events-none z-0" />

                {/* Right Side: High-Resolution Real People Photography */}
                {slide.imageUrl && (
                  <div className="absolute top-0 right-0 w-full sm:w-1/2 md:w-[52%] h-full z-0 overflow-hidden pointer-events-none">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title ? `${slide.title} — healthcare promotion` : "Medikart healthcare promotion banner"}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 55vw"
                      priority={idx === 0}
                      className="object-cover object-center opacity-90 sm:opacity-100"
                    />
                    {/* Seamless Left Gradient Blend Mask */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-400/80 to-transparent hidden sm:block w-36" />
                    <div className="absolute inset-0 bg-yellow-400/65 sm:hidden" />
                  </div>
                )}

                {/* Left Side: Copy & CTA */}
                <div className="relative z-10 w-full sm:w-[62%] md:w-[58%] px-6 sm:px-10 md:px-12 py-8 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-900 text-yellow-400 w-fit shadow-xs mb-3 border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]" />
                    {slide.badgeText || "100% Authentic Pharmacy"}
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-2 sm:mb-3">
                    {slide.title}
                  </h2>

                  <p className="text-xs sm:text-sm md:text-base text-slate-800 font-medium leading-relaxed max-w-md mb-5 sm:mb-6">
                    {slide.subtitle || "Order authentic prescription & OTC medicines online with fast doorstep delivery."}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={slide.ctaLink || slide.linkUrl || "/instant-order"}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-yellow-400 font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer border border-slate-900"
                    >
                      {slide.ctaText || "Upload Prescription"}
                    </Link>
                    <a
                      href={slide.secondaryLink || "#store-catalog"}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white/95 hover:bg-white active:scale-[0.98] text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all border border-slate-300 shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      {slide.secondaryText || "Browse Catalog"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Prev / Next Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
              pauseBriefly();
            }}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center text-xl font-black transition-all hover:scale-110 active:scale-95 cursor-pointer border border-slate-200 opacity-90 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
              pauseBriefly();
            }}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center text-xl font-black transition-all hover:scale-110 active:scale-95 cursor-pointer border border-slate-200 opacity-90 group-hover:opacity-100"
          >
            ›
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "w-7 bg-yellow-400 shadow-[0_0_8px_#facc15]"
                  : "w-2.5 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
