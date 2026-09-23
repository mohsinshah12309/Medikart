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

  const prodId = product._id || product.productId || product.id;
  const saved = isRefillSaved(prodId);

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
          (it) =>
            String(it.productId) === String(prodId) ||
            String(it.productId?._id) === String(prodId) ||
            String(it._id) === String(prodId)
        );
        if (item) {
          await removeFromRefill(item._id);
        }
      } else {
        await addToRefill(prodId, 1, product);
        try {
          trackAddToRefill(product);
        } catch (e) {
          console.warn("[analytics] trackAddToRefill error:", e);
        }
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

  // Compact prominent icon button for ProductCard
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer select-none relative group/refill ${
        saved
          ? "bg-[#FFF352] text-slate-950 border-2 border-[#F5D800] scale-105 shadow-md ring-2 ring-yellow-300/70"
          : "bg-amber-100/95 text-amber-950 hover:text-slate-950 hover:bg-[#FFF352] border-1.5 border-amber-300 hover:border-amber-400 hover:scale-110 shadow-xs"
      } ${className}`}
      aria-label={saved ? "Remove from monthly refill" : "Add to monthly refill reminder"}
      title={saved ? "Saved in Monthly Refill (Click to remove)" : "Add to Monthly Refill Reminder"}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
      ) : saved ? (
        <Check className="w-4 h-4 text-emerald-900 stroke-[3]" />
      ) : justAdded ? (
        <Check className="w-4 h-4 text-emerald-700 stroke-[3] animate-bounce" />
      ) : (
        <CalendarSync className="w-4 h-4 text-amber-950 stroke-[2.25] group-hover/refill:scale-110 transition-transform" />
      )}
    </button>
  );
}
