"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function OrderPlacingOverlay({ isPlacing, orderType = "standard" }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Securing connection & validating order...",
    "Verifying medicine stock & pricing...",
    "Routing to licensed Medikart pharmacy...",
    "Generating order confirmation..."
  ];

  useEffect(() => {
    if (!isPlacing) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isPlacing]);

  if (!isPlacing) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl border-2 border-yellow-400 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Animated glowing spinner */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-yellow-100 border-t-yellow-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-amber-200/50 border-b-yellow-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
          <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center text-3xl animate-bounce select-none">
            {orderType === "instant" ? "📄" : orderType === "narcotics" ? "🩺" : "💊"}
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">
          Placing Your Order...
        </h3>
        <p className="text-xs font-semibold text-amber-600 min-h-[20px] transition-all">
          {steps[stepIndex]}
        </p>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Please wait while we register your order with the pharmacy.
        </p>

        {/* Pulsing indicator dots */}
        <div className="flex gap-2 mt-5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}

export function OrderConfirmedCard({
  orderId,
  customer,
  total,
  paymentMethod = "cod",
  orderType = "standard",
  onContinueShopping,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (navigator?.clipboard?.writeText && orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Medikart Support, I have placed an order.\nOrder ID: ${orderId}\nCustomer: ${customer?.name || ''}\nCity: ${customer?.city || ''}`
  );
  const whatsappUrl = `https://wa.me/923314170744?text=${whatsappMessage}`;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 fade-in duration-300">
      {/* Top golden gradient ribbon */}
      <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500"></div>

      {/* Celebration Icon */}
      <div className="relative mb-4 mt-2">
        <div className="w-20 h-20 rounded-full bg-yellow-400/20 border-4 border-yellow-400/40 flex items-center justify-center text-4xl shadow-inner animate-bounce">
          🎉
        </div>
        <span className="absolute -top-1 -right-1 text-2xl animate-spin" style={{ animationDuration: '4s' }}>✨</span>
      </div>

      {/* Status Badge */}
      <span className="px-3.5 py-1 bg-green-100 text-green-800 text-xs font-black rounded-full uppercase tracking-wider mb-2 border border-green-200">
        ✓ Order Successfully Confirmed
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Order Confirmed!
      </h2>
      <p className="text-sm text-slate-500 mt-1.5 max-w-md">
        Thank you <strong className="text-slate-900">{customer?.name || 'Valued Customer'}</strong>! Your order has been placed and is now queued for fulfillment.
      </p>

      {/* Order Reference Box with 1-Click Copy */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 w-full my-6 text-left shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Order Reference ID
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
          >
            {copied ? "✓ Copied!" : "📋 Copy ID"}
          </button>
        </div>
        <div className="font-mono font-black text-slate-900 text-base sm:text-lg break-all select-all">
          {orderId}
        </div>

        {/* Quick order metadata */}
        <div className="border-t border-slate-200 mt-3.5 pt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Customer</span>
            <span className="font-bold text-slate-800 truncate block">
              {customer?.name || "Customer"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Delivery City</span>
            <span className="font-bold text-slate-800 truncate block">
              {customer?.city || "Lahore"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Payment Mode</span>
            <span className="font-bold text-slate-800 uppercase block">
              {paymentMethod === 'card' ? 'Online Card' : 'Cash on Delivery'}
            </span>
          </div>
          {total !== undefined && (
            <div className="col-span-2 sm:col-span-3 bg-white p-2.5 rounded-xl border border-slate-200/70 flex justify-between items-center mt-1">
              <span className="text-slate-500 font-semibold">Total Payable:</span>
              <span className="font-black text-slate-900 text-sm sm:text-base">
                {typeof total === 'number' ? `PKR ${total.toFixed(2)}` : total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery timeframe notice */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 w-full text-xs text-amber-900 text-left flex items-start gap-3 mb-6">
        <span className="text-xl">🕒</span>
        <div>
          <p className="font-bold">Estimated Delivery: 24 – 48 Hours</p>
          <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
            A confirmation receipt has been sent to <strong>{customer?.email || 'your email'}</strong>. Our delivery rider will contact you upon dispatch.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href={`/order-confirmation/${orderId}`}
          className="flex-1 py-3.5 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center gap-1.5"
        >
          <span>View Invoice & Tracking</span>
          <span>→</span>
        </Link>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3.5 px-5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <span>💬</span>
          <span>WhatsApp Support</span>
        </a>

        {onContinueShopping ? (
          <button
            type="button"
            onClick={onContinueShopping}
            className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
          >
            Continue Shopping
          </button>
        ) : (
          <Link
            href="/"
            className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors text-center"
          >
            Continue Shopping
          </Link>
        )}
      </div>
    </div>
  );
}

export function OrderConfirmedModal({
  isOpen,
  orderId,
  customer,
  total,
  paymentMethod = "cod",
  orderType = "standard",
  onClose,
}) {
  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-lg w-full my-auto">
        <OrderConfirmedCard
          orderId={orderId}
          customer={customer}
          total={total}
          paymentMethod={paymentMethod}
          orderType={orderType}
          onContinueShopping={onClose}
        />
      </div>
    </div>
  );
}
