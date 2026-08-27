"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function NavbarCartIcon() {
  const { cartCount, isLoaded } = useCart();

  return (
    <Link href="/cart" className="relative p-2 text-slate-350 hover:text-emerald-400 transition-colors flex items-center">
      <span className="text-xl">🛒</span>
      <span className="ml-1 text-sm font-semibold hidden sm:inline">Cart</span>
      {isLoaded && cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
}
