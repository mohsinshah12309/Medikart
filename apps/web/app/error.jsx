'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Storefront Application Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center text-3xl shadow-2xs">
            ⚠️
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Something Went Wrong
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
              {error?.message && !error.message.includes('fetch failed') && !error.message.includes('status 500')
                ? error.message
                : 'We experienced an unexpected network or server communication issue. Please check your connection and retry.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 w-full">
            <button
              type="button"
              onClick={() => reset()}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-yellow-500/50 cursor-pointer flex items-center gap-2"
            >
              🔄 Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl transition-all border border-slate-300 shadow-2xs"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
