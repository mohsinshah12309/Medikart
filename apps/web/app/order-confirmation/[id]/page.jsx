"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params?.id || '';
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (navigator?.clipboard?.writeText && orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Medikart Support, I have a query regarding my Order.\nOrder ID: ${orderId}`
  );
  const whatsappUrl = `https://wa.me/923314170744?text=${whatsappMessage}`;

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Top yellow highlight bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500"></div>

        {/* Celebration icon badge */}
        <div className="relative mb-5 mt-2">
          <div className="w-20 h-20 rounded-full bg-yellow-400/20 border-4 border-yellow-400/40 flex items-center justify-center text-4xl shadow-inner animate-bounce">
            🎉
          </div>
          <span className="absolute -top-1 -right-1 text-2xl animate-spin" style={{ animationDuration: '4s' }}>✨</span>
        </div>

        <span className="px-3.5 py-1 bg-green-100 text-green-800 text-xs font-black rounded-full uppercase tracking-wider mb-2">
          Order Verified & Placed
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Thank you for choosing Medikart! Your order has been registered and our certified pharmacy team is preparing it for prompt delivery.
        </p>

        {/* Order Reference Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 w-full my-6 text-left shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Order Reference Number
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-xs font-bold px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              {copied ? "✓ Copied!" : "📋 Copy ID"}
            </button>
          </div>
          <div className="font-mono font-black text-slate-900 text-base sm:text-lg break-all select-all">
            {orderId}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Keep this order reference handy when contacting customer support for fast tracking.
          </p>
        </div>

        {/* Delivery Progress Steps */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
            Order Fulfillment Process
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 p-2 rounded-xl bg-white border border-green-200 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs">✓</span>
              <div>
                <strong className="text-slate-900 block">1. Placed</strong>
                <span className="text-slate-400 text-[10px]">Registered</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 p-2 rounded-xl bg-white border border-yellow-300 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-950 font-bold flex items-center justify-center text-xs animate-pulse">2</span>
              <div>
                <strong className="text-slate-900 block">2. Verification</strong>
                <span className="text-slate-400 text-[10px]">Pharmacy Review</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 p-2 rounded-xl bg-slate-100 border border-slate-200 opacity-60">
              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs">3</span>
              <div>
                <strong className="text-slate-900 block">3. Packing</strong>
                <span className="text-slate-400 text-[10px]">Quality Sealed</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 p-2 rounded-xl bg-slate-100 border border-slate-200 opacity-60">
              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs">4</span>
              <div>
                <strong className="text-slate-900 block">4. Delivery</strong>
                <span className="text-slate-400 text-[10px]">24-48 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery & Billing Notice */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 w-full text-xs text-amber-900 text-left flex items-start gap-3 mb-6">
          <span className="text-xl">📦</span>
          <div>
            <p className="font-bold">Confirmation Email Dispatched</p>
            <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
              We have sent a receipt with your items, delivery address, and billing summary to your verified email. If you selected Cash on Delivery, payment is collected upon package arrival.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 py-3 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg text-center"
          >
            Continue Shopping
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>WhatsApp Support</span>
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}
