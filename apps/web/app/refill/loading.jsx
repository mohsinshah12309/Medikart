import React from 'react';

export default function RefillLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="bg-gradient-to-r from-[#FFFBEB] via-[#fff850]/30 to-[#FFFBEB] rounded-3xl border border-amber-200 p-8 space-y-3">
        <div className="h-6 w-36 bg-amber-200/80 rounded-full" />
        <div className="h-8 w-64 bg-amber-300/60 rounded-xl" />
        <div className="h-4 w-96 bg-amber-100 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-white rounded-2xl border border-amber-100 p-4 space-y-3">
            <div className="w-12 h-12 bg-[#fffde0] rounded-xl" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
            <div className="h-8 w-full bg-amber-100 rounded-lg mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
