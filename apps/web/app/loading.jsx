import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse max-w-[1600px] 2xl:max-w-[1720px] mx-auto w-full py-4 px-2">
      {/* Hero Skeleton */}
      <div className="h-44 sm:h-64 bg-gradient-to-r from-amber-50 via-yellow-100/60 to-amber-50 rounded-3xl w-full border border-amber-200/60 flex items-center justify-center">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>Loading Medikart Storefront...</span>
        </div>
      </div>

      {/* Categories & Products Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-amber-100 rounded-2xl p-3 flex flex-col gap-2.5 shadow-2xs">
            <div className="aspect-square bg-amber-50/80 rounded-xl w-full" />
            <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-7 bg-amber-100/70 rounded-xl mt-auto w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
