"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { useCart } from "../CartProvider";
import { trackRefillReorderClick, trackBeginCheckout } from "../../lib/analytics";
import "./monthlyRefill.css";

export default function ReorderBar({
  refillData,
  token,
  customer,
  onOrderSuccess,
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [transferring, setTransferring] = useState(false);

  const items = refillData?.items || [];
  const itemCount = refillData?.count || 0;
  const subtotal = refillData?.subtotal || 0;

  const formatPrice = (num) => {
    return typeof num === "number" ? Math.round(num) : num;
  };

  const handle1ClickReorder = async () => {
    if (!items || items.length === 0 || transferring) return;

    try {
      setTransferring(true);

      // 1. Add each refill medicine into the active cart
      for (const it of items) {
        const prodObj = {
          _id: it.productId || it._id,
          productId: it.productId || it._id,
          name: it.name,
          price: it.effectivePrice !== undefined ? it.effectivePrice : it.price,
          effectivePrice: it.effectivePrice !== undefined ? it.effectivePrice : it.price,
          coverImage: it.coverImage,
          isNarcotic: Boolean(it.isNarcotic),
        };
        await addToCart(prodObj, it.quantity || 1);
      }

      // 2. Track analytics event safely
      try {
        trackRefillReorderClick(itemCount, subtotal);
        trackBeginCheckout(items, subtotal);
      } catch (e) {
        console.warn("[analytics] error:", e);
      }

      // 3. Immediately redirect to Checkout page
      router.push("/checkout");
    } catch (err) {
      console.error("Failed to redirect to checkout:", err);
      router.push("/checkout");
    } finally {
      setTransferring(false);
    }
  };

  if (itemCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-40 mt-6 sm:mt-8">
      <div className="refill-reorder-bar p-3.5 sm:p-4 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="w-10 h-10 rounded-xl bg-[#fff850] border border-[#fae845] flex items-center justify-center text-slate-900 shadow-2xs font-black shrink-0">
            ⚡
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Routine ({itemCount} {itemCount === 1 ? "medicine" : "medicines"})
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900">
                PKR {formatPrice(subtotal)}
              </span>
              <span className="text-[11px] text-slate-500">+ delivery & Rs 10 fee</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handle1ClickReorder}
          disabled={transferring}
          className="w-full sm:w-auto btn-refill-primary px-8 py-3.5 rounded-full text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
          title="Transfer monthly routine to checkout immediately"
        >
          {transferring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-[#1a1a1a]" />
          )}
          <span>{transferring ? "Redirecting to Checkout..." : "1-Click Reorder & Checkout"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

