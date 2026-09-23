"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, PlusSquare, Smartphone, Download, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import { usePwaInstall } from "./PwaInstallProvider";

export default function InstallModal() {
  const { showInstallModal, setShowInstallModal, isIOS, isInstalled } = usePwaInstall();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!showInstallModal || !mounted || typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={() => setShowInstallModal(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-yellow-300 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#FFF352] via-[#FFCB05] to-[#FFD84D] px-6 py-5 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-yellow-400 flex items-center justify-center font-black shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base font-heading">
                {isInstalled ? "Medikart App Installed" : "Install Medikart App"}
              </h3>
              <p className="text-[11px] font-bold text-slate-800">
                Fast, offline-ready &amp; zero storage clutter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallModal(false)}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isInstalled ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-slate-900">You're All Set!</h4>
              <p className="text-sm text-slate-600 font-medium">
                Medikart is installed on your device. Open it from your home screen for the fastest medicine ordering experience.
              </p>
            </div>
          ) : isIOS ? (
            // iOS Safari Specific Steps
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 text-center">
                Install the official Medikart app to your iPhone / iPad home screen in 2 quick steps:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-black text-slate-900 block">Step 1: Tap the Share Button</span>
                    <span className="text-slate-600 font-medium">
                      In the Safari browser bottom toolbar, tap the <strong>Share</strong> icon (square with arrow pointing up).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 shadow-xs">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-black text-slate-900 block">Step 2: Add to Home Screen</span>
                    <span className="text-slate-600 font-medium">
                      Scroll down in the share menu and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Android / Desktop Chrome / Edge Steps
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 text-center">
                Get lightning-fast 1-tap medicine refills and rapid order tracking:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                    1
                  </div>
                  <div className="text-xs">
                    <span className="font-black text-slate-900 block">Browser Menu</span>
                    <span className="text-slate-600 font-medium">
                      Tap the <strong>3 dots (⋮)</strong> menu in your mobile browser or address bar.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 shadow-xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-black text-slate-900 block">Select Install</span>
                    <span className="text-slate-600 font-medium">
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> to complete setup.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits summary */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-base block">⚡</span>
              <span className="text-[10px] font-bold text-slate-700">Instant Launch</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-base block">🔔</span>
              <span className="text-[10px] font-bold text-slate-700">Refill Alerts</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-base block">🔒</span>
              <span className="text-[10px] font-bold text-slate-700">100% Genuine</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInstallModal(false)}
            className="w-full btn-amber-gradient py-3 rounded-2xl font-black text-xs text-slate-950 shadow-sm cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
