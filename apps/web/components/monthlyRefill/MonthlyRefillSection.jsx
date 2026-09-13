"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomer } from "../CustomerProvider";
import RefillItemCard from "./RefillItemCard";
import ReorderBar from "./ReorderBar";
import {
  CalendarSync,
  ShoppingBag,
  Bell,
  Clock,
  Sparkles,
  Loader2,
  Trash2,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import "./monthlyRefill.css";

export default function MonthlyRefillSection() {
  const {
    customer,
    token,
    isAuthenticated,
    isLoading,
    refillData,
    refillItems,
    refillCount,
    isRefillLoading,
    refreshRefill,
    updateRefillQuantity,
    removeFromRefill,
    clearRefill,
  } = useCustomer();

  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshRefill();
    }
  }, [isAuthenticated, refreshRefill]);

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear your monthly refill list?")) {
      try {
        setClearing(true);
        await clearRefill();
      } catch (err) {
        console.error("Failed to clear refill:", err);
      } finally {
        setClearing(false);
      }
    }
  };

  // ─── Guest Guard: Compact prompt, never render CRUD or break guest checkout ───
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="mt-12 pt-8 border-t border-amber-200/80">
        <div className="bg-gradient-to-r from-[#FFFBEB] via-[#fff850]/20 to-[#FFFBEB] border-2 border-dashed border-[#fae845] rounded-3xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 bg-white rounded-2xl border border-amber-200 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xs">
            ⚡
          </div>
          <h3 className="text-lg font-black text-slate-900 font-heading">
            Automated Monthly Refill
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            Log in to save routine medicines, get automatic 30-day email reminders, and reorder with a single click.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/login?redirect=/wishlist"
              className="btn-refill-primary px-6 py-2.5 rounded-full text-xs font-black shadow-xs flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log in to your account</span>
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all shadow-2xs"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading State ───
  if (isLoading || isRefillLoading) {
    return (
      <div className="mt-12 pt-8 border-t border-amber-200/80">
        <div className="py-14 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading your monthly refill routine...</p>
        </div>
      </div>
    );
  }

  // Format next reminder date if available
  const nextReminderFormatted = refillData?.nextReminderAt
    ? new Date(refillData.nextReminderAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div id="monthly-refill-section" className="mt-12 pt-8 border-t-2 border-amber-200/80">
      {/* Refill Section Header Banner */}
      <div className="bg-gradient-to-r from-[#FFFBEB] via-[#fffde0] to-[#FFFBEB] border-2 border-[#fae845] rounded-3xl p-6 sm:p-7 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#fff850] rounded-2xl border-2 border-[#fae845] flex items-center justify-center text-2xl shadow-xs text-slate-900 flex-shrink-0 font-black">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Monthly Medicine Refill
              </h2>
              <span className="refill-badge text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>30-Day Auto Cycle</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Your recurring health routine. You have{" "}
              <span className="font-black text-amber-950">{refillCount} medicines</span> saved for automated reordering.
            </p>
          </div>
        </div>

        {/* Next reminder badge & actions */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
          {nextReminderFormatted && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-amber-900 shadow-2xs">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Next Reminder: {nextReminderFormatted}</span>
            </div>
          )}

          {refillCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1 border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear List</span>
            </button>
          )}
        </div>
      </div>

      {/* Routine Benefits Pill Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-3 rounded-2xl border border-amber-100/80 flex items-center gap-2.5 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
          <p className="text-xs text-slate-700 font-bold leading-tight">
            One-Click Instant Reorder with saved details
          </p>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-amber-100/80 flex items-center gap-2.5 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-slate-700 font-bold leading-tight">
            Automatic Mailjet email reminder every 30 days
          </p>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-amber-100/80 flex items-center gap-2.5 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-slate-700 font-bold leading-tight">
            Live catalog pricing & automatic discount application
          </p>
        </div>
      </div>

      {/* Items List or Empty State */}
      {refillItems && refillItems.length > 0 ? (
        <div className="space-y-3">
          {refillItems.map((item) => (
            <RefillItemCard
              key={item._id}
              item={item}
              onUpdateQuantity={updateRefillQuantity}
              onRemove={removeFromRefill}
            />
          ))}

          {/* Sticky Reorder Bar */}
          <ReorderBar
            refillData={refillData}
            token={token}
            customer={customer}
            onOrderSuccess={() => refreshRefill()}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border-2 border-dashed border-[#fef08a] rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 bg-[#fffde0] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-[#fae845]">
            🗓️
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
            No Medicines in Your Monthly Refill Yet
          </h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Never run out of your essential medicines. Tap the <strong>Refill (⚡)</strong> icon on any product to save it to your 30-day recurring medicine routine.
          </p>
          <div className="mt-6">
            <Link
              href="/#store-catalog"
              className="inline-flex items-center gap-2 btn-refill-primary px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-black shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog Medicines</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
