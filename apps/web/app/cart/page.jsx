"use client";

import React from 'react';
import { useCart } from '../../components/CartProvider';
import Link from 'next/link';
import { trackBeginCheckout } from '../../lib/analytics';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, isLoaded } = useCart();

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-400 font-medium">Loading cart...</p>
      </div>
    );
  }

  // Check if any narcotics items are somehow in the cart
  const hasNarcotics = cart.some(item => item.isNarcotic);

  const handleProceedCheckout = () => {
    trackBeginCheckout(cart, cartTotal + 10);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-lg">
          <span className="text-5xl block animate-float mb-4">🛒</span>
          <h2 className="text-lg font-bold text-slate-900 mt-4">Your cart is empty</h2>
          <p className="text-slate-600 text-sm mt-1">Browse our products and add them to your cart.</p>
          <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-sm active:scale-[0.98]">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {hasNarcotics && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
              <span className="text-2xl">🩺</span>
              <div>
                <h3 className="text-sm font-black text-amber-950">
                  Prescription Required (Controlled / Rx Items in Cart)
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Your cart includes regulated prescription medicine. To complete your purchase, you must upload a doctor's prescription (PDF or Image) on the checkout page before OTP code generation.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div key={item.productId} className="bg-white rounded-2xl border-2 border-yellow-200/80 p-4 shadow-sm flex gap-4 items-center relative group hover:border-yellow-400 hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-yellow-50/50 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-yellow-200">
                  <img
                    src={item.coverImage ? (item.coverImage.startsWith('http') || item.coverImage.startsWith('/') ? item.coverImage : `/uploads/${item.coverImage}`) : '/uploads/placeholder.webp'}
                    alt={item.name ? `${item.name} — cart medicine item` : 'Medicine thumbnail'}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src = "/uploads/placeholder.webp";
                    }}
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <Link href={`/products/${item.productId}`} className="font-bold text-sm text-slate-900 hover:text-amber-800 line-clamp-1 transition-colors">
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5 font-bold">
                    PKR {item.price.toFixed(2)}
                  </p>
                  
                  {item.isNarcotic && (
                    <span className="inline-block bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-300 mt-1 uppercase tracking-wider">
                      Rx Only - Prescription Required
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border-2 border-yellow-300 rounded-xl bg-yellow-50/50">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-950 hover:bg-yellow-200/80 rounded-l-xl transition-colors text-sm font-black disabled:opacity-30 cursor-pointer"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-2 py-1 text-xs font-black w-7 text-center select-none text-slate-950">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-950 hover:bg-yellow-200/80 rounded-r-xl transition-colors text-sm font-black disabled:opacity-30 cursor-pointer"
                    disabled={item.quantity >= 99}
                  >
                    +
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => { if (window.confirm('Remove this item from your cart?')) removeFromCart(item.productId); }}
                  aria-label="Remove item from cart"
                  className="text-slate-400 hover:text-red-600 p-2 text-sm transition-colors cursor-pointer"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-3xl border-2 border-yellow-300/90 p-6 shadow-xl flex flex-col gap-4 h-fit">
            <h3 className="font-black text-slate-950 text-base border-b-2 border-yellow-100 pb-3 uppercase tracking-wider">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="font-black text-slate-950">PKR {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <span>Platform Fee</span>
                <span className="bg-yellow-100 text-amber-900 border border-yellow-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">Medikart Care</span>
              </span>
              <span className="font-bold text-slate-900">PKR 10.00</span>
            </div>
            
            <div className="text-xs text-slate-500 italic mt-1 leading-relaxed border-t border-slate-100 pt-3">
              * Delivery charges will be computed during checkout based on your destination city.
            </div>

            {hasNarcotics && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed font-medium">
                📝 Your cart contains prescription-only (Rx) items. A prescription upload is required at checkout.
              </div>
            )}

            <div className="mt-4">
              <Link
                href="/checkout"
                onClick={handleProceedCheckout}
                className="w-full inline-block text-center py-3.5 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg border-2 border-yellow-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                Proceed to Checkout →
              </Link>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

