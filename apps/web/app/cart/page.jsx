"use client";

import React from 'react';
import { useCart } from '../../components/CartProvider';
import Link from 'next/link';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, isLoaded } = useCart();

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  // Check if any narcotics items are somehow in the cart
  const hasNarcotics = cart.some(item => item.isNarcotic);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-950">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center shadow-sm">
          <span className="text-4xl">🛒</span>
          <h2 className="text-lg font-bold text-gray-900 mt-4">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mt-1">Browse our products and add them to your cart.</p>
          <Link href="/" className="inline-block mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cart items list */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div key={item.productId} className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm flex gap-4 items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                  <img
                    src={item.coverImage?.startsWith('http') ? item.coverImage : `http://localhost:5000${item.coverImage}`}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src = "http://localhost:5000/uploads/placeholder.webp";
                    }}
                  />
                </div>

                <div className="flex-grow">
                  <Link href={`/products/${item.productId}`} className="font-semibold text-sm text-gray-900 hover:text-green-600 line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    PKR {item.price.toFixed(2)}
                  </p>
                  
                  {item.isNarcotic && (
                    <span className="inline-block bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded mt-1">
                      Rx Only - Prescription Required
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-3 py-0.5 text-xs font-semibold w-8 text-center select-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={item.quantity >= 99}
                  >
                    +
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-gray-400 hover:text-red-500 p-2 text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-xl border border-gray-150 p-6 shadow-sm flex flex-col gap-4 h-fit">
            <h3 className="font-bold text-gray-950 text-base border-b border-gray-100 pb-3">Order Summary</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">PKR {cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="text-xs text-gray-500 italic mt-1 leading-relaxed">
              * Delivery charges and taxes will be computed during checkout based on your city.
            </div>

            {hasNarcotics && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                📝 Your cart contains prescription-only (Rx) items. A prescription upload is required at checkout.
              </div>
            )}

            <div className="mt-4">
              <Link
                href="/checkout"
                className="w-full inline-block text-center py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
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
