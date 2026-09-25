"use client";

import React from "react";
import { Download, Smartphone, Check, ArrowDownToLine } from "lucide-react";
import { usePwaInstall } from "./PwaInstallProvider";

/**
 * Reusable Install App Button component supporting multiple variants:
 * - "navbar": Desktop header button
 * - "mobile-drawer": Prominent mobile drawer action card
 * - "compact": Small pill for mobile top headers
 * - "footer": Footer quick link
 */
export default function InstallAppButton({ variant = "navbar", className = "" }) {
  const { isInstalled, triggerInstall } = usePwaInstall();

  if (variant === "navbar") {
    return (
      <button
        type="button"
        onClick={triggerInstall}
        className={`h-10 px-3.5 xl:px-4 rounded-full text-xs font-black transition-all duration-200 cursor-pointer border flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
          isInstalled
            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            : "bg-[#FFCB05] hover:bg-yellow-400 text-slate-950 border-amber-300 hover:shadow-xs hover:scale-[1.02] active:scale-95"
        } ${className}`}
        title={isInstalled ? "Medikart App Installed" : "Download & Install Medikart App"}
      >
        {isInstalled ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>App Installed</span>
          </>
        ) : (
          <>
            <Smartphone className="w-3.5 h-3.5 text-slate-950" />
            <span>Download App</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse ml-0.5" />
          </>
        )}
      </button>
    );
  }

  if (variant === "mobile-drawer") {
    return (
      <button
        type="button"
        onClick={triggerInstall}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          isInstalled
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            : "bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-50 border-amber-300 text-slate-950 shadow-xs hover:shadow-md"
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isInstalled ? "bg-emerald-600 text-white" : "bg-slate-950 text-yellow-400"
            }`}
          >
            {isInstalled ? <Check className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-xs text-slate-950">
                {isInstalled ? "Medikart App Active" : "Download Medikart App"}
              </h4>
              {!isInstalled && (
                <span className="text-[9px] px-1.5 py-0.2 bg-slate-950 text-yellow-400 rounded-md font-bold">
                  Free
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 font-medium">
              {isInstalled
                ? "Running installed web app"
                : "Install on phone • Rapid 2-hr medicine delivery"}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          {isInstalled ? (
            <span className="text-emerald-700 text-xs font-bold">✓</span>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-2xs">
              ↓
            </div>
          )}
        </div>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={triggerInstall}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
          isInstalled
            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
            : "bg-amber-200/90 text-slate-950 border-amber-300 shadow-2xs hover:bg-amber-300"
        } ${className}`}
        aria-label="Download Medikart App"
      >
        <Smartphone className="w-3 h-3 text-slate-950" />
        <span>{isInstalled ? "Installed" : "App"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={triggerInstall}
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-amber-700 transition-colors cursor-pointer ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-amber-600" />
      <span>{isInstalled ? "App Installed ✓" : "Download Medikart App"}</span>
    </button>
  );
}
