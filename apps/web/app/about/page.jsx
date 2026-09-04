"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContent } from '../../lib/api';

export default function AboutPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await getContent();
        if (res && res.data) {
          setContent(res.data);
        }
      } catch (err) {
        console.error("Failed to load about page content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const defaultText = "Welcome to Medikart, Pakistan's premier licensed digital pharmacy and healthcare platform. We are dedicated to providing authentic prescription and over-the-counter medicines, surgical supplies, and wellness essentials delivered safely to your doorstep.\n\nOur pharmacy operates with rigorous quality control, ensuring that every medication is sourced directly from licensed pharmaceutical manufacturers and verified by qualified pharmacists. With standardized Cash on Delivery across major cities and secure prescription upload workflows, Medikart makes healthcare reliable, accessible, and compliant.";

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50/40 to-amber-50/50 rounded-3xl p-8 md:p-12 text-slate-900 shadow-md border border-slate-200">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-300/15 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300/70 w-fit shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]" />
            Licensed Pharmacy Partner
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            About Medikart
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            Your trusted healthcare partner dedicated to authentic medicines, clinical safety, and nationwide accessibility.
          </p>
        </div>
      </div>

      {/* Main Content & Story Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 md:p-12 flex flex-col gap-8 relative overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Loading pharmacy details...</p>
          </div>
        ) : (
          <>
            {/* Story Text Section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>🏥</span> Our Mission & Standards
              </h2>
              <div className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal max-w-prose">
                {content?.aboutText || defaultText}
              </div>
            </div>

            {/* Key Clinical Trust Pillars */}
            <div className="border-t border-slate-200 pt-8 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Core Quality Commitments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 transition-all hover:border-yellow-400/80 hover:shadow-sm">
                  <span className="text-3xl">🔬</span>
                  <h4 className="font-extrabold text-sm text-slate-900">100% Authentic</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Strict supply-chain controls. Every item is verified from licensed distributors.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 transition-all hover:border-yellow-400/80 hover:shadow-sm">
                  <span className="text-3xl">📦</span>
                  <h4 className="font-extrabold text-sm text-slate-900">Safe Logistics</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Sealed medical packaging with Cash on Delivery across Pakistan.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 transition-all hover:border-yellow-400/80 hover:shadow-sm">
                  <span className="text-3xl">💊</span>
                  <h4 className="font-extrabold text-sm text-slate-900">Rx Compliance</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Licensed pharmacists review and verify all prescription and narcotics orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Catalog Metrics / Stats */}
            <div className="border-t border-slate-200 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-200/80">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 block">6,112+</span>
                <span className="text-xs text-slate-600 font-bold mt-1 block">Cataloged Items</span>
              </div>
              <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-200/80">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 block">100%</span>
                <span className="text-xs text-slate-600 font-bold mt-1 block">Authentic Meds</span>
              </div>
              <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-200/80">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 block">10+</span>
                <span className="text-xs text-slate-600 font-bold mt-1 block">Cities Served</span>
              </div>
              <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-200/80">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 block">24/7</span>
                <span className="text-xs text-slate-600 font-bold mt-1 block">AI Assistance</span>
              </div>
            </div>

            {/* Action Navigation Bar */}
            <div className="border-t border-slate-200 pt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-yellow-500/50"
                >
                  Browse Store Catalog
                </Link>
                <Link
                  href="/instant-order"
                  className="px-6 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl transition-all border border-slate-300 shadow-2xs"
                >
                  Upload Prescription
                </Link>
              </div>
              <Link
                href="/contact"
                className="text-sm font-bold text-slate-700 hover:text-yellow-600 transition-colors"
              >
                Need Help? Contact Support →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
