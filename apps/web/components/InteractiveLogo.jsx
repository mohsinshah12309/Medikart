"use client";

import React, { useState } from 'react';

/**
 * InteractiveLogo — Master Brand Identity (2026 Revision)
 * Faithfully matches media_1788806774980.jpg:
 * - High-speed shopping cart with 3 motion streaks on left
 * - Certified white medical cross centered on the basket
 * - Angled glossy capsule resting inside the cart
 * - Lowercase bold "medikart" with organic green leaf accent on "i"
 * - Persistent tagline: "Medicines. Delivered Fast."
 */
export default function InteractiveLogo({ 
  size = "md", 
  showTagline = true, 
  tagline = "Medicines. Delivered Fast.",
  className = "" 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Sizing scales
  const sizeMap = {
    sm: { iconSize: 34, titleSize: "text-xl", tagSize: "text-[10px]" },
    md: { iconSize: 44, titleSize: "text-2xl", tagSize: "text-[11px]" },
    lg: { iconSize: 56, titleSize: "text-3xl", tagSize: "text-xs" },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className={`relative inline-flex items-center gap-3 select-none group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Medikart — Medicines. Delivered Fast."
    >
      {/* ─── Master Logo Icon ──────────────────────────────────────────────── */}
      <div 
        className="relative flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
        style={{ width: current.iconSize, height: current.iconSize }}
      >
        {/* Ambient Amber Glow on Hover */}
        <div 
          className="absolute inset-0 rounded-full bg-amber-400/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />

        {/* Floating Medical Micro-Crosses on Hover */}
        <span 
          className="absolute -top-1 -right-1 text-[11px] font-black text-amber-500 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 group-hover:translate-x-1 transition-all duration-500 ease-out"
        >
          +
        </span>
        <span 
          className="absolute -bottom-1 -left-1 text-[9px] font-black text-yellow-500 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-y-2 group-hover:-translate-x-1 transition-all duration-700 ease-out"
        >
          +
        </span>

        {/* Master Scalable SVG Icon */}
        <svg 
          viewBox="0 0 100 90" 
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Amber-Gold Cart Gradient */}
            <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#FACC15" />
            </linearGradient>

            {/* Glossy Capsule Yellow Half */}
            <linearGradient id="capsuleYellow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>

            {/* Glossy Capsule White Half */}
            <linearGradient id="capsuleWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>

            {/* Wheel Gradient */}
            <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* 1. Motion Streaks (3 horizontal rounded speed lines on left) */}
          <g className="transition-transform duration-300 group-hover:-translate-x-1">
            <rect x="6" y="24" width="22" height="7" rx="3.5" fill="#FBBF24" />
            <rect x="0" y="36" width="25" height="7" rx="3.5" fill="#FBBF24" />
            <rect x="8" y="48" width="18" height="6.5" rx="3.25" fill="#FBBF24" />
          </g>

          {/* 2. Interactive 3D Capsule (Tilted at 35deg inside cart) */}
          <g 
            className="transition-transform duration-500 ease-out origin-center"
            style={{
              transform: isHovered 
                ? "translate(50px, 20px) rotate(42deg) scale(1.08)" 
                : "translate(52px, 24px) rotate(32deg)",
            }}
          >
            {/* Yellow Top Half */}
            <path
              d="M-7,-18 C-7,-24 7,-24 7,-18 L7,0 L-7,0 Z"
              fill="url(#capsuleYellow)"
            />
            {/* Specular Shine on Yellow */}
            <ellipse cx="2.5" cy="-14" rx="2" ry="4" fill="rgba(255,255,255,0.6)" />
            {/* Capsule Divider seam */}
            <line x1="-7" y1="0" x2="7" y2="0" stroke="rgba(217,119,6,0.4)" strokeWidth="1" />
            {/* White Bottom Half */}
            <path
              d="M-7,0 L7,0 L7,16 C7,22 -7,22 -7,16 Z"
              fill="url(#capsuleWhite)"
            />
            {/* Soft Shadow on White */}
            <ellipse cx="-2.5" cy="12" rx="1.5" ry="3" fill="rgba(203,213,225,0.5)" />
          </g>

          {/* 3. Main Shopping Cart Basket Body */}
          <path
            d="M 28 20 
               C 34 20, 36 28, 41 33
               C 45 28, 52 24, 60 27
               C 66 22, 73 25, 78 31
               C 81 35, 80 43, 75 51
               C 71 58, 66 64, 46 64
               C 32 64, 28 54, 26 44
               C 24 35, 18 20, 28 20 Z"
            fill="url(#cartGrad)"
            className="drop-shadow-sm"
          />

          {/* Cart Handle / Rim Curve Accent */}
          <path
            d="M 20 23 C 23 18, 30 18, 34 20"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* 4. Certified Medical Cross Centered on Cart */}
          <g 
            className="transition-transform duration-300 group-hover:scale-110 origin-center"
            style={{ transformOrigin: "52px 45px" }}
          >
            <rect 
              x="47.5" 
              y="35" 
              width="9" 
              height="20" 
              rx="3.5" 
              fill="#FFFFFF" 
              className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
            />
            <rect 
              x="42" 
              y="40.5" 
              width="20" 
              height="9" 
              rx="3.5" 
              fill="#FFFFFF" 
              className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
            />
          </g>

          {/* 5. Cart Wheels */}
          <circle cx="38" cy="74" r="8" fill="url(#wheelGrad)" />
          <circle cx="38" cy="74" r="3.5" fill="#FEF3C7" />

          <circle cx="62" cy="74" r="8" fill="url(#wheelGrad)" />
          <circle cx="62" cy="74" r="3.5" fill="#FEF3C7" />
        </svg>
      </div>

      {/* ─── Brand Wordmark & Tagline ───────────────────────────────────────── */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline tracking-tight font-extrabold text-[#1E293B] group-hover:text-amber-600 transition-colors duration-200">
          <span className={`${current.titleSize} font-heading font-black tracking-tight`}>
            med
          </span>

          {/* Letter "i" with Signature Green Leaf Accent */}
          <span className={`relative inline-block ${current.titleSize} font-heading font-black`}>
            <span>ı</span>
            <svg 
              viewBox="0 0 24 24" 
              width="12"
              height="12"
              style={{ width: 12, height: 12 }}
              className="absolute -top-1.5 left-[1px] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12"
              fill="#10B981"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM17.5 9.5C16.5 13.5 13 16.5 9 17.5C8.5 17.5 8 17 8.5 16.5C12.5 12.5 15.5 9 16.5 8C17 7.5 17.5 8 17.5 9.5Z" />
              <path d="M6 18C8 13 14 7 20 4C20 10 14 16 9 18C8 18.5 6.5 18.5 6 18Z" />
            </svg>
          </span>

          <span className={`${current.titleSize} font-heading font-black tracking-tight`}>
            kart
          </span>
        </div>

        {/* Official Tagline */}
        {showTagline && (
          <span className={`${current.tagSize} font-bold text-amber-700 tracking-wide mt-1 whitespace-nowrap`}>
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
