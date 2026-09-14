import React from 'react';

export default function BlogsLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-3">
            <div className="h-48 bg-slate-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
