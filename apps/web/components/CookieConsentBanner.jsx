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
    <aside aria-label="Cookie Consent" className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-[55] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-amber-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-4 sm:p-5 text-slate-900 ring-1 ring-black/5">
        
        {/* Banner Header */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-2xs">
            🍪
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h2 className="text-xs sm:text-sm font-black font-heading text-slate-950 leading-tight">
                We Value Your Privacy &amp; Health Data
              </h2>
              <button
                type="button"
                onClick={() => saveConsent('rejected', { essential: true, analytics: false, marketing: false })}
                className="text-slate-400 hover:text-slate-700 p-0.5 text-xs font-bold leading-none sm:hidden"
                aria-label="Dismiss cookie banner"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
              Medikart uses essential cookies for shopping cart security and optional analytics to enhance medicine delivery. Read our{' '}
              <Link href="/privacy-policy" className="text-amber-800 font-bold underline hover:text-amber-950">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        {/* Manage Preferences Drawer */}
        {showManage && (
          <div className="my-2.5 pt-2.5 border-t border-slate-100 space-y-2 bg-slate-50/80 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs">Essential &amp; Security</span>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Required for cart, auth, and prescription uploads</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Always Active</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <div>
                <span className="font-bold text-slate-900 text-xs">Analytics &amp; Performance</span>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Helps us monitor site speed and optimize delivery</p>
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => saveConsent('accepted')}
            className="flex-1 min-w-[100px] py-2 px-3 sm:px-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer text-center"
          >
            Accept All
          </button>

          <button
            type="button"
            onClick={() => saveConsent('rejected', { essential: true, analytics: false, marketing: false })}
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
          >
            Reject Non-Essential
          </button>

          {showManage ? (
            <button
              type="button"
              onClick={() => saveConsent('custom', preferences)}
              className="py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-all cursor-pointer"
            >
              Save
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
