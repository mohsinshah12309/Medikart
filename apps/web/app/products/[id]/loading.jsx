import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-24 bg-slate-200 rounded-md" />

      {/* Main card skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Gallery column */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl border border-slate-200" />
          <div className="flex gap-2">
            <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
            <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
            <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
          </div>
        </div>

        {/* Info column */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-20 bg-slate-100 rounded-md" />
              <div className="h-6 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-10 w-40 bg-slate-200 rounded-lg mt-6" />
            <div className="space-y-2 pt-6">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 rounded" />
              <div className="h-3 w-4/6 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="space-y-3 pt-6">
            <div className="h-12 w-full bg-slate-200 rounded-xl" />
            <div className="h-12 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
