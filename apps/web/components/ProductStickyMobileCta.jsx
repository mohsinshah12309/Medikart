"use client";

import React from 'react';
import { ShoppingCart, Zap, AlertTriangle } from 'lucide-react';
import { useCart } from './CartProvider';
import { trackAddToCart } from '../lib/analytics';

export default function ProductStickyMobileCta({ product }) {
  const { addToCart } = useCart();

  if (!product) return null;

  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const hasDiscount = product.discountPercent > 0;
  const effectivePrice = product.effectivePrice || product.price || 0;

  const formatPrice = (num) => {
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product, 1);
    trackAddToCart(product, 1);
  };

  return (
    <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 p-2.5 bg-white/95 backdrop-blur-md border-t border-amber-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Left: Price & Status */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {product.name}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-slate-950">
              PKR {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-slate-400 line-through">
                PKR {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>

        {/* Right: Add to Cart / Out of Stock CTA */}
        <div className="shrink-0">
          {isOutOfStock ? (
            <button
              disabled
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Stock</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 border border-yellow-500/50 cursor-pointer active:scale-95 transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
