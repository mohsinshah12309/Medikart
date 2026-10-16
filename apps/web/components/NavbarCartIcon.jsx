"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function NavbarCartIcon({ showLabel = false, className = "" }) {
  const { cartCount, isLoaded } = useCart();

  return (
    <Link
      href="/cart"
      prefetch={true}
      className={`relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-slate-800 hover:text-amber-700 hover:bg-amber-50/70 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
      aria-label={cartCount > 0 ? `Shopping Cart with ${cartCount} items` : "Shopping Cart"}
      title="Shopping Cart"
    >
      <span className="text-xl leading-none transition-transform group-hover:scale-105">🛒</span>
      {showLabel && (
        <span className="ml-1.5 text-xs xl:text-sm font-bold text-slate-800">Cart</span>
      )}
      {isLoaded && cartCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-[#FFEE45] text-slate-950 text-[10px] font-black rounded-full min-w-5 h-5 px-1 flex items-center justify-center ring-2 ring-white border border-[#E5D322] shadow-xs pointer-events-none">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}
