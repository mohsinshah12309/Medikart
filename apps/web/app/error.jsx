'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to internal client console only; never expose sensitive error stacks directly in UI
    console.error('Storefront Application Error Boundary caught:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-[#F3EFE6] shadow-warm-card p-8 md:p-10 text-center relative overflow-hidden">
        {/* Ambient Warm Amber Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-3xl shadow-2xs">
            ⚠️
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              Something Went Wrong
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
              We encountered an unexpected issue while loading this page. Please try refreshing or return to the homepage. If the problem persists, our support team is available on WhatsApp to assist you.
            </p>

            {/* Developer debug info: strictly hidden in production to prevent information disclosure */}
            {isDev && error?.message && (
              <details className="mt-3 text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 max-w-md mx-auto">
                <summary className="cursor-pointer font-bold text-amber-800 select-none">
                  Developer Debug Details (Development Only)
                </summary>
                <div className="mt-2 font-mono text-[11px] text-red-600 bg-red-50 p-2 rounded-lg break-all">
                  {error.message}
                </div>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 w-full">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-amber-gradient px-6 py-2.5 text-sm font-black shadow-amber-glow flex items-center gap-2 cursor-pointer"
            >
              🔄 Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-2.5 bg-white hover:bg-amber-50/50 active:bg-amber-100/50 text-slate-800 font-bold text-sm rounded-full transition-all border border-amber-300 shadow-2xs"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
