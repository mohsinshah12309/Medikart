"use client";

import React, { useState } from 'react';
import Image from 'next/image';

/**
 * InteractiveLogo — Official Medikart Master Brand Identity
 * Uses the official Medikart logo with dynamic sizing and hover effects.
 */
export default function InteractiveLogo({ 
  className = "" 
}) {
  const [isHovered, setIsHovered] = useState(false);

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
          width={200}
          height={60}
          priority
          className="h-8 sm:h-10 md:h-12 w-auto object-contain"
        />
      </div>
    </div>
  );
}
