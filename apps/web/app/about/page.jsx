"use client";

import React, { useState, useEffect } from 'react';
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

  const defaultText = "Welcome to Medikart, your premier destination for healthcare needs. We are dedicated to providing high-quality medicines, healthcare products, and consultation services to your doorstep safely and reliably. Our online pharmacy facilitates access to standard Cash on Delivery items as well as secure compliance-oriented prescription workflows.";

  return (
    <div className="max-w-3xl mx-auto bg-[#0a232a]/45 p-8 rounded-3xl border border-teal-955/65 shadow-2xl backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
      <div className="flex items-center gap-3 border-b border-teal-950/60 pb-4">
        <span className="text-3xl">🛡️</span>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">About Medikart</h1>
      </div>
      
      {loading ? (
        <div className="py-8 text-center text-slate-500">Loading details...</div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
            {content?.aboutText || defaultText}
          </div>

          {/* Clinical trust highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 border-t border-teal-950/40 pt-6">
            <div className="p-4 bg-slate-950/15 border border-teal-955/20 rounded-2xl text-center">
              <span className="text-2xl block mb-1.5">🔬</span>
              <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">100% Authentic</h4>
              <p className="text-[11px] text-slate-500 mt-1">Verified partner pharmacy sources only</p>
            </div>
            
            <div className="p-4 bg-slate-950/15 border border-teal-955/20 rounded-2xl text-center">
              <span className="text-2xl block mb-1.5">📦</span>
              <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Safe Delivery</h4>
              <p className="text-[11px] text-slate-500 mt-1">Cash on Delivery with packaging tracking</p>
            </div>

            <div className="p-4 bg-slate-950/15 border border-teal-955/20 rounded-2xl text-center">
              <span className="text-2xl block mb-1.5">💊</span>
              <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Rx Compliance</h4>
              <p className="text-[11px] text-slate-500 mt-1">Verified pharmacist prescription checks</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
