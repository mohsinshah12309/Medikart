"use client";

import React, { useState } from 'react';
import Image from 'next/image';

/**
 * InteractiveLogo — Official Medikart Master Brand Identity
 * Uses the official Medikart logo with dynamic sizing and hover effects.
 */
export default function InteractiveLogo({ 
  size = "md", 
  showTagline = true, 
  tagline = "Medicines. Faster to you.",
  className = "" 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Sizing scales (height in pixels, matched for wide horizontal logo aspect ratio)
  const sizeMap = {
    sm: { height: 40, width: 130, imgClass: "h-9 sm:h-10 w-auto" },
    md: { height: 56, width: 185, imgClass: "h-11 sm:h-13 md:h-14 w-auto" },
    lg: { height: 72, width: 235, imgClass: "h-14 sm:h-16 md:h-18 w-auto" },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className={`relative inline-flex items-center select-none group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Medikart — Medicines. Faster to you."
    >
      {/* Ambient Amber/Yellow Glow on Hover */}
      <div 
        className="absolute -inset-1 rounded-2xl bg-amber-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />

      <div className="relative flex items-center transition-transform duration-300 ease-out group-hover:scale-[1.03]">
        <Image
          src="/logo.png"
          alt="Medikart — Medicines. Faster to you."
          width={current.width}
          height={current.height}
          priority
          className={`${current.imgClass} object-contain`}
        />
      </div>
    </div>
  );
}
