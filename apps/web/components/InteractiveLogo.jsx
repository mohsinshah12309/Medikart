"use client";

import React, { useState } from 'react';
import Image from 'next/image';

/**
 * InteractiveLogo — Official Medikart Master Brand Identity
 * Uses the official Medikart logo with dynamic sizing and hover effects.
 */
export default function InteractiveLogo({ 
  className = "",
  size = "md",
  imageClassName = ""
}) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "h-7 sm:h-8",
    md: "h-8 sm:h-10 md:h-12",
    lg: "h-10 sm:h-12 md:h-14",
    xl: "h-12 sm:h-14 md:h-16"
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

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

      <div className="relative flex items-center transition-transform duration-300 ease-out group-hover:scale-[1.02]">
        <Image
          src="/logo.png"
          alt="Medikart — Medicines. Faster to you."
          width={240}
          height={72}
          priority
          className={`${currentSize} ${imageClassName} w-auto object-contain`}
        />
      </div>
    </div>
  );
}
