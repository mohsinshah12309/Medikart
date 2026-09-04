import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse max-w-7xl mx-auto w-full">
      {/* Hero Skeleton */}
      <div className="h-64 bg-slate-200/70 rounded-3xl w-full" />

      {/* Catalog Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex flex-col gap-3 bg-white p-5 rounded-2xl border border-slate-200">
          <div className="h-5 bg-slate-200 rounded w-1/2 mb-2" />
          <div className="h-8 bg-slate-100 rounded-xl w-full" />
          <div className="h-8 bg-slate-100 rounded-xl w-full" />
          <div className="h-8 bg-slate-100 rounded-xl w-full" />
          <div className="h-8 bg-slate-100 rounded-xl w-full" />
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
              <div className="aspect-square bg-slate-100 rounded-xl w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded-xl mt-auto w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
