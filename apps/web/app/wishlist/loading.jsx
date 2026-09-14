import React from 'react';

export default function WishlistLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="h-8 w-52 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="aspect-square bg-slate-100 rounded-xl" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
