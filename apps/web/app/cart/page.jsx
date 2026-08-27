"use client";

import React from 'react';
import { useCart } from '../../components/CartProvider';
import Link from 'next/link';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, isLoaded } = useCart();

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-400">Loading cart...</p>
      </div>
    );
  }

  // Check if any narcotics items are somehow in the cart
  const hasNarcotics = cart.some(item => item.isNarcotic);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="bg-[#0a232a]/45 rounded-3xl border border-teal-955/65 p-12 text-center shadow-2xl backdrop-blur-md">
          <span className="text-5xl block animate-bounce mb-4">🛒</span>
          <h2 className="text-lg font-bold text-slate-200 mt-4">Your cart is empty</h2>
          <p className="text-slate-450 text-sm mt-1">Browse our products and add them to your cart.</p>
          <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98]">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div key={item.productId} className="bg-[#0a232a]/45 rounded-2xl border border-teal-955/65 p-4 shadow-xl backdrop-blur-md flex gap-4 items-center relative group">
                <div className="w-16 h-16 bg-slate-950/15 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-teal-955/40">
                  <img
                    src={item.coverImage?.startsWith('http') ? item.coverImage : `http://localhost:5000${item.coverImage}`}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src = "http://localhost:5000/uploads/placeholder.webp";
                    }}
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <Link href={`/products/${item.productId}`} className="font-bold text-sm text-slate-100 hover:text-emerald-450 line-clamp-1 transition-colors">
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                    PKR {item.price.toFixed(2)}
                  </p>
                  
                  {item.isNarcotic && (
                    <span className="inline-block bg-purple-500/10 text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-500/20 mt-1 uppercase tracking-wider">
                      Rx Only - Prescription Required
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-teal-955/50 rounded-xl bg-slate-950/20">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-100 transition-colors text-sm font-bold disabled:opacity-30"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-2 py-1 text-xs font-bold w-7 text-center select-none text-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-100 transition-colors text-sm font-bold disabled:opacity-30"
                    disabled={item.quantity >= 99}
                  >
                    +
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-slate-500 hover:text-rose-450 p-2 text-sm transition-colors cursor-pointer"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-[#0a232a]/55 rounded-2xl border border-teal-955/65 p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 h-fit">
            <h3 className="font-extrabold text-slate-100 text-base border-b border-teal-950/60 pb-3 uppercase tracking-wider">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Subtotal</span>
              <span className="font-bold text-slate-100">PKR {cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="text-xs text-slate-500 italic mt-1 leading-relaxed border-t border-teal-950/60 pt-3">
              * Delivery charges and taxes will be computed during checkout based on your city.
            </div>

            {hasNarcotics && (
              <div className="bg-purple-950/25 border border-purple-500/20 rounded-xl p-3.5 text-xs text-purple-300 leading-relaxed">
                📝 Your cart contains prescription-only (Rx) items. A prescription upload is required at checkout.
              </div>
            )}

            <div className="mt-4">
              <Link
                href="/checkout"
                className="w-full inline-block text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-[#04151a] font-extrabold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/5 active:scale-[0.98]"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
