import React from 'react';

export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6 animate-pulse">
      <div className="h-8 w-60 bg-slate-200 rounded-lg" />
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-24 bg-slate-100 rounded-xl" />
        <div className="h-14 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
