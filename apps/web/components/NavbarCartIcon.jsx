"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function NavbarCartIcon() {
  const { cartCount, isLoaded } = useCart();

  return (
    <Link href="/cart" prefetch={true} className="relative p-1.5 xl:p-2 text-slate-700 hover:text-yellow-600 transition-colors flex items-center group shrink-0" aria-label="Shopping Cart">
      <span className="text-lg xl:text-xl group-hover:scale-110 transition-transform">🛒</span>
      <span className="ml-1 text-xs xl:text-sm font-bold hidden sm:inline text-slate-800 group-hover:text-yellow-600">Cart</span>
      {isLoaded && cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white shadow-sm">
          {cartCount}
        </span>
      )}
    </Link>
  );
}
