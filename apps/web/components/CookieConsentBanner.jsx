"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, Check, X, Settings } from 'lucide-react';
import { getCookieConsent } from '../lib/analytics';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent has already been given
    const consent = getCookieConsent();
    if (!consent) {
      // Show after short gentle delay
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (status, customCategories = null) => {
    const payload = {
      status,
      categories: customCategories || {
        essential: true,
        analytics: status === 'accepted',
        marketing: status === 'accepted',
      },
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem('medikart_cookie_consent', JSON.stringify(payload));
      // Dispatch custom event to notify AnalyticsProvider immediately
      window.dispatchEvent(new CustomEvent('medikart_cookie_consent_updated', { detail: payload }));
    } catch (err) {
      console.error("Failed to save cookie consent:", err);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Cookie Consent" className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-amber-200 shadow-2xl p-5 sm:p-6 text-slate-900 ring-1 ring-black/5">
        
        {/* Banner Header */}
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            🍪
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-black font-heading text-slate-900 leading-tight">
              We Value Your Privacy &amp; Health Data
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Medikart uses essential cookies for shopping cart security and optional analytics to enhance medicine delivery. Read our{' '}
              <Link href="/privacy-policy" className="text-amber-800 font-bold underline hover:text-amber-950">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        {/* Manage Preferences Drawer */}
        {showManage && (
          <div className="my-3 pt-3 border-t border-slate-100 space-y-2.5 bg-slate-50/70 p-3 rounded-2xl">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">Essential &amp; Security</span>
                <p className="text-[11px] text-slate-500">Required for cart, auth, and prescription uploads</p>
              </div>
              <span className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Always Active</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <div>
                <span className="font-bold text-slate-900">Analytics &amp; Performance</span>
                <p className="text-[11px] text-slate-500">Helps us monitor site speed and optimize delivery</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => saveConsent('accepted')}
            className="flex-1 py-2 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            Accept All
          </button>

          <button
            type="button"
            onClick={() => saveConsent('rejected', { essential: true, analytics: false, marketing: false })}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            Reject Non-Essential
          </button>

          {showManage ? (
            <button
              type="button"
              onClick={() => saveConsent('custom', preferences)}
              className="py-2 px-3.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowManage(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Manage Preferences"
              aria-label="Manage Cookie Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </aside>
  );
}
