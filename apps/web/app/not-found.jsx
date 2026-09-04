import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  const popularKeywords = ['Panadol', 'Augmentin', 'Brufen', 'Disprin', 'Paracetamol', 'Multivitamin'];

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 text-center relative overflow-hidden">
        {/* Soft Ambient Background Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* 404 Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 border border-yellow-300/80 text-amber-950 font-black text-xs uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            Error 404 • Page Not Found
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Looking for a Medicine?
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              The page or medicine you are looking for does not exist, was moved, or has an invalid address.
            </p>
          </div>

          {/* Search Bar on 404 (Native Form Action for 100% SSR & CSR Reliability) */}
          <form action="/" method="GET" className="w-full max-w-md mt-2">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all shadow-2xs">
              <span className="pl-3 text-slate-400 text-base">🔍</span>
              <input
                type="text"
                name="search"
                placeholder="Search all 6,112 medicines..."
                className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 border border-yellow-500/40"
              >
                Search
              </button>
            </div>
          </form>

          {/* Suggested Quick Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            <span className="text-xs text-slate-400 font-medium">Popular:</span>
            {popularKeywords.map((kw) => (
              <Link
                key={kw}
                href={`/?search=${encodeURIComponent(kw)}`}
                className="text-xs bg-slate-100 hover:bg-yellow-100 hover:text-slate-950 text-slate-700 font-bold px-3 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                {kw}
              </Link>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-6 border-t border-slate-100 w-full">
            <Link
              href="/"
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-yellow-500/50"
            >
              ← Back to Home
            </Link>
            <Link
              href="/instant-order"
              className="px-6 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl transition-all border border-slate-300 shadow-2xs"
            >
              Upload Prescription (Instant Order)
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl transition-all border border-slate-300 shadow-2xs"
            >
              Contact Pharmacist Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
