"use client";

import React, { useState } from "react";
import { useCustomer } from "../CustomerProvider";
import { CalendarSync, Check, Loader2 } from "lucide-react";
import { trackAddToRefill } from "../../lib/analytics";

/**
 * AddToRefillButton
 *
 * Reusable button to add a product to the customer's Monthly Refill list.
 * Supports compact icon mode (for product cards) and full button mode (for product details).
 */
export default function AddToRefillButton({
  product,
  variant = "icon", // "icon" | "button"
  className = "",
}) {
  const { isAuthenticated, isRefillSaved, addToRefill, removeFromRefill, refillItems } =
    useCustomer();
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  // Controlled narcotics cannot be added to automated refills
  if (product.isNarcotic) return null;

  const saved = isRefillSaved(product._id);

  const handleClick = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (loading) return;

    try {
      setLoading(true);
      if (saved) {
        const item = refillItems.find(
          (it) => it.productId === product._id || it.productId?._id === product._id
        );
        if (item) {
          await removeFromRefill(item._id);
        }
      } else {
        await addToRefill(product._id, 1);
        trackAddToRefill(product);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1600);
      }
    } catch (err) {
      console.error("Refill toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer select-none shadow-xs active:scale-98 ${
          saved
            ? "bg-[#fff850] text-[#1a1a1a] border-2 border-[#fae845] hover:bg-[#fae432]"
            : "bg-white text-slate-800 border-2 border-[#fef08a] hover:border-[#fae845] hover:bg-[#fffde0]"
        } ${className}`}
        title={saved ? "Saved in your Monthly Refill" : "Add to Monthly Refill"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
        ) : saved ? (
          <Check className="w-4 h-4 text-emerald-800 stroke-[3]" />
        ) : (
          <CalendarSync className="w-4 h-4 text-amber-700" />
        )}
        <span>
          {loading
            ? "Updating Refill..."
            : saved
            ? "In Monthly Refill"
            : justAdded
            ? "Added to Refill!"
            : "Add to Monthly Refill"}
        </span>
      </button>
    );
  }

  // Compact icon button for ProductCard
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 shadow-xs cursor-pointer select-none ${
        saved
          ? "bg-[#fff850] text-[#1a1a1a] border border-[#fae845] scale-105 shadow-sm"
          : "bg-white/95 text-slate-400 hover:text-amber-800 hover:bg-[#fffde0] border border-slate-200 hover:border-[#fae845] hover:scale-110 opacity-85 group-hover:opacity-100"
      } ${className}`}
      aria-label={saved ? "Remove from monthly refill" : "Add to monthly refill"}
      title={saved ? "Saved in Monthly Refill" : "Add to Monthly Refill"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
      ) : saved ? (
        <CalendarSync className="w-3.5 h-3.5 text-[#1a1a1a] fill-[#fff850]" />
      ) : (
        <CalendarSync className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
