import React from 'react';

export default function CartLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-1/2 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-12 w-full bg-slate-200 rounded-xl mt-6" />
        </div>
      </div>
    </div>
  );
}
