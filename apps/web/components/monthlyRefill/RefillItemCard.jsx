"use client";

import React, { useState, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, Loader2, AlertCircle } from "lucide-react";
import "./monthlyRefill.css";

// Pure helpers hoisted outside component to avoid recreation on every render
const formatPrice = (num) => {
  return typeof num === "number" ? Math.round(num) : num;
};

const getFullUrl = (path) => {
  const fallback = "/uploads/placeholder.webp";
  if (!path || path === "/images/placeholder-product.png") {
    return fallback;
  }
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : '';
  return path.startsWith("http") || path.startsWith("/")
    ? path
    : `${apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
};

function RefillItemCardComponent({ item, onUpdateQuantity, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [imgSrc, setImgSrc] = useState(getFullUrl(item.coverImage));

  const handleQtyChange = useCallback(async (newQty) => {
    if (newQty < 1 || loading) return;
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);

    try {
      setLoading(true);
      await onUpdateQuantity(item._id, newQty);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setLoading(false);
    }
  }, [item._id, loading, onUpdateQuantity]);

  const handleRemoveClick = useCallback(async () => {
    if (loading) return;
    setIsRemoving(true);
    // Smooth fade + collapse delay
    setTimeout(async () => {
      try {
        await onRemove(item._id);
      } catch (err) {
        setIsRemoving(false);
      }
    }, 280);
  }, [item._id, loading, onRemove]);

  const isOutOfStock = item.stockStatus === "out_of_stock";

  return (
    <div
      className={`refill-card p-3 sm:p-4 mb-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 ${
        isRemoving ? "refill-item-removing" : ""
      }`}
    >
      {/* Left: Product Media & Details */}
      <div className="flex items-center gap-3.5 w-full sm:w-auto flex-1 min-w-0">
        <Link
          href={`/products/${item.productId}`}
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#FAF8F5] border border-amber-100 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden group"
        >
          <Image
            src={imgSrc}
            alt={item.name ? `${item.name} — monthly refill medicine` : "Medikart monthly refill medicine"}
            fill
            sizes="80px"
            className="object-contain p-1 transition-transform group-hover:scale-105"
            onError={() => setImgSrc("/uploads/placeholder.webp")}
          />
          {item.discountPercent > 0 && (
            <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded tracking-wider uppercase">
              -{item.discountPercent}%
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/products/${item.productId}`}
              className="text-sm font-black text-slate-900 hover:text-amber-700 transition-colors line-clamp-1 leading-snug"
            >
              {item.name}
            </Link>
            {item.sku && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                {item.sku}
              </span>
            )}
          </div>

          {item.genericName && (
            <p className="text-xs text-slate-500 italic line-clamp-1 mt-0.5">
              {item.genericName}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-bold text-slate-700">
              PKR {formatPrice(item.effectivePrice)}
            </span>
            {item.discountPercent > 0 && (
              <span className="text-[11px] text-slate-400 line-through">
                PKR {formatPrice(item.price)}
              </span>
            )}
            {isOutOfStock && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Out of Stock</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quantity Stepper, Subtotal & Remove Action */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {/* Stepper */}
        <div className="flex items-center gap-1.5 bg-[#FFFBEB] p-1 rounded-xl border border-amber-200/90">
          <button
            type="button"
            onClick={() => handleQtyChange(item.quantity - 1)}
            disabled={item.quantity <= 1 || loading}
            className="w-7 h-7 rounded-lg refill-stepper-btn flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span
            className={`w-8 text-center text-xs font-black text-slate-900 select-none ${
              isPulsing ? "refill-qty-pulsing" : ""
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-amber-700" /> : item.quantity}
          </span>

          <button
            type="button"
            onClick={() => handleQtyChange(item.quantity + 1)}
            disabled={loading}
            className="w-7 h-7 rounded-lg refill-stepper-btn flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Increase quantity"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-[90px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
            Subtotal
          </span>
          <span className="text-sm font-black text-slate-950 block mt-0.5">
            PKR {formatPrice(item.subtotal)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={handleRemoveClick}
          disabled={loading}
          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
          title="Remove from Monthly Refill"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const RefillItemCard = memo(RefillItemCardComponent);
export default RefillItemCard;
