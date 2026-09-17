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
    sm: { height: 46, width: 155, imgClass: "h-10 sm:h-11 w-auto" },
    md: { height: 64, width: 215, imgClass: "h-13 sm:h-15 md:h-16 w-auto" },
    lg: { height: 80, width: 270, imgClass: "h-16 sm:h-18 md:h-20 w-auto" },
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
