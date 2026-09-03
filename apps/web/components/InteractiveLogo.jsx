"use client";

import React from 'react';

export default function InteractiveLogo() {
  return (
    <div className="relative flex items-center gap-3 group cursor-pointer select-none">
      {/* 3D Pill Animation Container */}
      <div className="relative w-9 h-9 flex items-center justify-center transition-all duration-500 ease-out group-hover:rotate-180 group-hover:scale-110">
        
        {/* Floating cross elements released on hover */}
        <span className="absolute text-[11px] text-yellow-500 font-extrabold select-none pointer-events-none opacity-0 group-hover:opacity-100 group-hover:-translate-y-6 group-hover:-translate-x-3 transition-all duration-700 ease-out z-0">
          +
        </span>
        <span className="absolute text-[9px] text-amber-600 font-extrabold select-none pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-y-6 group-hover:translate-x-4 transition-all duration-750 ease-out z-0">
          +
        </span>

        {/* The Capsule Body */}
        <div className="relative w-5 h-9 flex flex-col items-center justify-center transition-all duration-500 ease-out animate-float group-hover:shadow-[0_0_18px_rgba(234,179,8,0.5)] rounded-full z-10">
          {/* Top Half: Vivid Yellow */}
          <div className="w-4.5 h-4 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-full relative shadow-[inset_-1px_1.5px_2px_rgba(255,255,255,0.6)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
            {/* Gloss Shine */}
            <div className="absolute top-0.5 left-0.5 w-1 h-2 bg-white/70 rounded-full blur-[0.2px]" />
          </div>
          
          {/* Joint Line gap spacer */}
          <div className="h-0.5 w-4 bg-slate-400/30 z-20 group-hover:opacity-0 transition-opacity duration-300" />

          {/* Bottom Half: Solid Slate Neutral */}
          <div className="w-4.5 h-4 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-full relative shadow-[inset_-1px_-1.5px_2px_rgba(0,0,0,0.4)] transition-transform duration-500 ease-out group-hover:translate-y-1.5">
            {/* Gloss Shine */}
            <div className="absolute bottom-0.5 right-0.5 w-1 h-2 bg-white/30 rounded-full blur-[0.2px]" />
          </div>
        </div>
        
        {/* Glow halo behind capsule on hover */}
        <div className="absolute w-7 h-7 rounded-full bg-yellow-400/25 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
      </div>

      {/* Brand Text */}
      <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-yellow-600 transition-colors duration-300 flex items-center">
        Medikart
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 ml-1 group-hover:scale-125 transition-transform" />
      </span>
    </div>
  );
}
