"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const FALLBACK_BANNERS = [
  {
    _id: "hero-1",
    title: "100% Genuine Certified Medicines",
    subtitle: "Consult with licensed pharmacists and order authentic prescription & OTC medicines.",
    badgeText: "Licensed Pharmacy Partner",
    ctaText: "Upload Prescription",
    ctaLink: "/instant-order",
    secondaryText: "Browse Catalog",
    secondaryLink: "#store-catalog",
    imageUrl: "/banners/hero-1.jpg",
  },
  {
    _id: "hero-2",
    title: "Family Daily Wellness & Vitamins",
    subtitle: "Boost your family immunity with verified multivitamins, calcium & vital supplements.",
    badgeText: "Essential Immunity",
    ctaText: "Shop Daily Wellness",
    ctaLink: "#store-catalog",
    secondaryText: "Learn More",
    secondaryLink: "/about",
    imageUrl: "/banners/hero-2.jpg",
  },
  {
    _id: "hero-3",
    title: "Dermatological Skincare & Glow",
    subtitle: "Specialist skin hydration, sunblocks, and dermatologist-tested therapeutic creams.",
    badgeText: "Dermatology Specialist",
    ctaText: "Explore Skincare",
    ctaLink: "#store-catalog",
    secondaryText: "View Products",
    secondaryLink: "#store-catalog",
    imageUrl: "/banners/hero-3.jpg",
  },
  {
    _id: "hero-4",
    title: "Doorstep Medicine Delivery in 30 Mins",
    subtitle: "Fast, secure, temperature-controlled delivery with Cash on Delivery across Pakistan.",
    badgeText: "Express Doorstep Service",
    ctaText: "Order Now",
    ctaLink: "/instant-order",
    secondaryText: "Browse All Categories",
    secondaryLink: "#store-catalog",
    imageUrl: "/banners/hero-4.jpg",
  },
];

export default function HeroBannerCarousel({ initialBanners = [] }) {
  const [banners, setBanners] = useState(
    initialBanners.length > 0 ? initialBanners : FALLBACK_BANNERS
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isTransitioning = useRef(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const handler = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  // Fetch from API if initialBanners not loaded
  useEffect(() => {
    if (initialBanners.length > 0) {
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

  const advanceSlide = (targetIndex) => {
    if (isTransitioning.current || banners.length <= 1) return;
    isTransitioning.current = true;

    if (isFlipped) {
      // Front side is currently hidden, set target on front and flip back to 0deg
      setCurrentIndex(targetIndex);
      setIsFlipped(false);
    } else {
      // Back side is currently hidden, set target on back and flip to 180deg
      setNextIndex(targetIndex);
      setIsFlipped(true);
    }

    setTimeout(() => {
      isTransitioning.current = false;
    }, 700);
  };

  const handleNext = () => {
    const active = isFlipped ? nextIndex : currentIndex;
    const target = (active + 1) % banners.length;
    advanceSlide(target);
  };

  const handlePrev = () => {
    const active = isFlipped ? nextIndex : currentIndex;
    const target = (active - 1 + banners.length) % banners.length;
    advanceSlide(target);
  };

  // Auto-advance every 2 seconds
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused, banners.length, isFlipped, currentIndex, nextIndex]);

  const activeDisplayIndex = isFlipped ? nextIndex : currentIndex;

  const renderSlideContent = (slide) => {
    if (!slide) return null;
    return (
      <div className="relative w-full h-full min-h-[340px] sm:min-h-[380px] md:min-h-[420px] bg-gradient-to-r from-amber-300 via-yellow-400 to-yellow-300 text-slate-900 rounded-3xl overflow-hidden shadow-md flex items-center border border-yellow-400/90">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-white/30 blur-[70px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none z-0" />

        {/* Right Side: High-Resolution Real People Photography */}
        {slide.imageUrl && (
          <div className="absolute top-0 right-0 w-full sm:w-1/2 md:w-[52%] h-full z-0 overflow-hidden">
            <Image
              src={slide.imageUrl}
              alt={slide.title ? `${slide.title} — healthcare promotion` : "Medikart healthcare promotion banner"}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 55vw"
              priority
              className="object-cover object-center opacity-90 sm:opacity-100 transition-transform duration-700 group-hover:scale-105"
            />
            {/* Seamless Left Gradient Blend Mask */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-400/80 to-transparent hidden sm:block w-36" />
            <div className="absolute inset-0 bg-yellow-400/60 sm:hidden" />
          </div>
        )}

        {/* Left Side: Copy & CTA */}
        <div className="relative z-10 w-full sm:w-[62%] md:w-[58%] px-6 sm:px-10 md:px-12 py-8 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-900 text-yellow-400 w-fit shadow-xs mb-3 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]" />
            {slide.badgeText || "100% Authentic Pharmacy"}
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-2 sm:mb-3 drop-shadow-2xs">
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
    );
  };

  return (
    <div
      className="relative w-full h-full group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ perspective: prefersReducedMotion ? "none" : "1200px" }}
    >
      {/* 3D Flip Card Container */}
      <div
        className="relative w-full h-full rounded-3xl"
        style={{
          transformStyle: prefersReducedMotion ? "flat" : "preserve-3d",
          transform: prefersReducedMotion
            ? "none"
            : `rotateY(${isFlipped ? 180 : 0}deg)`,
          transition: prefersReducedMotion
            ? "opacity 0.3s ease-in-out"
            : "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Front Face */}
        <div
          className="w-full rounded-3xl"
          style={{
            backfaceVisibility: prefersReducedMotion ? "visible" : "hidden",
            WebkitBackfaceVisibility: prefersReducedMotion ? "visible" : "hidden",
          }}
        >
          {renderSlideContent(banners[currentIndex])}
        </div>

        {/* Back Face (Rotated 180deg) */}
        <div
          className="absolute inset-0 w-full h-full rounded-3xl"
          style={{
            backfaceVisibility: prefersReducedMotion ? "visible" : "hidden",
            WebkitBackfaceVisibility: prefersReducedMotion ? "visible" : "hidden",
            transform: prefersReducedMotion ? "none" : "rotateY(180deg)",
            display: prefersReducedMotion && !isFlipped ? "none" : "block",
          }}
        >
          {renderSlideContent(banners[nextIndex])}
        </div>
      </div>

      {/* Manual Prev / Next Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center text-base font-black transition-all hover:scale-110 active:scale-95 cursor-pointer border border-slate-200 opacity-80 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center text-base font-black transition-all hover:scale-110 active:scale-95 cursor-pointer border border-slate-200 opacity-80 group-hover:opacity-100"
          >
            ›
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-900/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => advanceSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeDisplayIndex
                  ? "w-6 bg-yellow-400 shadow-[0_0_6px_#facc15]"
                  : "w-2 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
