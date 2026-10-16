"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '../../components/CartProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackBeginCheckout } from '../../lib/analytics';
import PrescriptionUploadCard from '../../components/PrescriptionUploadCard';
import { Lock, ShoppingBag, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    isLoaded,
    cartError,
    setCartError,
    prescriptionFiles,
    setPrescriptionFiles,
    patientName,
    setPatientName,
    pharmacistNotes,
    setPharmacistNotes,
    isConfirmed,
    setIsConfirmed,
  } = useCart();
  const router = useRouter();
  const [removingId, setRemovingId] = useState(null);
  const [prescriptionError, setPrescriptionError] = useState('');

  // Partition items into Regular and Prescription
  const regularItems = cart.filter(
    (item) => !item.isNarcotic && !item.requiresPrescription && item.rxStatus !== 'prescription_required'
  );
  const prescriptionItems = cart.filter(
    (item) => item.isNarcotic || item.requiresPrescription || item.rxStatus === 'prescription_required'
  );
  const hasPrescriptionItems = prescriptionItems.length > 0;

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-400 font-medium">Loading cart...</p>
      </div>
    );
  }

  const handleProceedCheckout = (e) => {
    if (hasPrescriptionItems) {
      if (prescriptionFiles.length === 0) {
        e.preventDefault();
        setPrescriptionError("⚠️ Please upload your doctor's prescription above to proceed with controlled medicines.");
        window.scrollTo({ top: 400, behavior: 'smooth' });
        return;
      }
      if (!patientName.trim()) {
        e.preventDefault();
        setPrescriptionError("⚠️ Please enter the patient's full name for prescription verification.");
        return;
      }
      if (!isConfirmed) {
        e.preventDefault();
        setPrescriptionError("⚠️ Please check the confirmation checkbox to confirm the prescription is valid.");
        return;
      }
    }

    setPrescriptionError('');
    trackBeginCheckout(cart, cartTotal + 10);
  };

  const handleRemove = (productId) => {
    if (window.confirm('Remove this item from your cart?')) {
      setRemovingId(productId);
      setTimeout(() => {
        removeFromCart(productId);
        setRemovingId(null);
      }, 250);
    }
  };

  const renderCartItemRow = (item, isRx = false) => (
    <div
      key={item.productId}
      className={`bg-white rounded-2xl border-2 p-4 shadow-sm flex gap-4 items-center relative group transition-all duration-300 ${
        isRx ? 'border-amber-300/80 bg-amber-50/20' : 'border-yellow-200/80 hover:border-[#FFEE45]'
      } ${removingId === item.productId ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="w-16 h-16 bg-[#FFEE45]/15 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-[#FFEE45]/40">
        <img
          src={
            item.coverImage
              ? item.coverImage.startsWith('http') || item.coverImage.startsWith('/')
                ? item.coverImage
                : `/uploads/${item.coverImage}`
              : '/uploads/placeholder.webp'
          }
          alt={item.name ? `${item.name} — cart medicine item` : 'Medicine thumbnail'}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.target.src = '/uploads/placeholder.webp';
          }}
        />
      </div>

      <div className="flex-grow min-w-0">
        <Link
          href={`/products/${item.slug || item.productSlug || item.productId}`}
          className="font-bold text-sm text-slate-900 hover:text-amber-800 line-clamp-1 transition-colors"
        >
          {item.name}
        </Link>
        <p className="text-xs text-slate-500 mt-0.5 font-bold">
          PKR {item.price.toFixed(2)}
        </p>

        {isRx && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded border border-amber-300 tracking-wide">
              <Lock className="w-2.5 h-2.5" />
              <span>Needs a prescription to order</span>
            </span>
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center border-2 border-[#FFEE45] rounded-xl bg-[#FFEE45]/15">
        <button
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          aria-label="Decrease quantity"
          className="px-2.5 py-1 text-slate-700 hover:text-slate-950 hover:bg-[#FFEE45]/50 rounded-l-xl transition-colors text-sm font-black disabled:opacity-30 cursor-pointer"
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
          className="px-2.5 py-1 text-slate-700 hover:text-slate-950 hover:bg-[#FFEE45]/50 rounded-r-xl transition-colors text-sm font-black disabled:opacity-30 cursor-pointer"
          disabled={item.quantity >= 99}
        >
          +
        </button>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => handleRemove(item.productId)}
        aria-label="Remove item from cart"
        className="text-slate-400 hover:text-red-600 p-2 text-sm transition-colors cursor-pointer"
        title="Remove item"
      >
        ✕
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
        <span className="text-xs font-bold text-slate-500">
          {cart.length} {cart.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Error Feedback Banner */}
      {cartError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-900 text-sm font-bold flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <span>{cartError}</span>
          </div>
          <button
            onClick={() => setCartError(null)}
            className="text-rose-600 hover:text-rose-950 font-black text-xs uppercase px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-lg">
          <span className="text-5xl block animate-float mb-4">🛒</span>
          <h2 className="text-lg font-bold text-slate-900 mt-4">Your cart is empty</h2>
          <p className="text-slate-600 text-sm mt-1">Browse our products and add them to your cart.</p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2.5 bg-[#FFEE45] hover:bg-[#FDD835] text-slate-950 font-black text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] border border-[#E5D322]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* SECTION 1: Regular Items */}
              {regularItems.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Your Regular Items ({regularItems.length})</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {regularItems.map((item) => renderCartItemRow(item, false))}
                  </div>
                </div>
              )}

              {/* SECTION 2: Prescription Items */}
              {hasPrescriptionItems && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-950 pb-1 border-b border-amber-300">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>Prescription Items — Verification Required ({prescriptionItems.length})</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 lowercase">
                      Requires Rx review
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {prescriptionItems.map((item) => renderCartItemRow(item, true))}
                  </div>
                </div>
              )}

              {/* SECTION 3: Prescription Upload Card (Always visible) */}
              <PrescriptionUploadCard
                isRequired={hasPrescriptionItems}
                files={prescriptionFiles}
                setFiles={setPrescriptionFiles}
                patientName={patientName}
                setPatientName={setPatientName}
                notes={pharmacistNotes}
                setNotes={setPharmacistNotes}
                isConfirmed={isConfirmed}
                setIsConfirmed={setIsConfirmed}
                errorMsg={prescriptionError}
                setErrorMsg={setPrescriptionError}
              />
            </div>

            {/* Cart Summary Column */}
            <div className="bg-white rounded-3xl border-2 border-[#FFEE45] p-6 shadow-xl flex flex-col gap-4 h-fit sticky top-24">
              <h3 className="font-black text-slate-950 text-base border-b-2 border-yellow-100 pb-3 uppercase tracking-wider">
                Order Summary
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Subtotal</span>
                <span className="font-black text-slate-950">PKR {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <span>Platform Fee</span>
                  <span className="bg-[#FFEE45]/30 text-amber-950 border border-[#FFEE45] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    Medikart Care
                  </span>
                </span>
                <span className="font-bold text-slate-900">PKR 10.00</span>
              </div>

              <div className="text-xs text-slate-500 italic mt-1 leading-relaxed border-t border-slate-100 pt-3">
                * Delivery charges will be calculated at checkout based on your destination city.
              </div>

              {hasPrescriptionItems && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 leading-relaxed font-medium flex items-start gap-2 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Mixed Order Protected</span>
                    Prescription items are verified by our pharmacist before dispatch. Regular items are prepared immediately.
                  </div>
                </div>
              )}

              {prescriptionError && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-xs text-red-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{prescriptionError}</span>
                </div>
              )}

              <div className="mt-2">
                <Link
                  href="/checkout"
                  prefetch={true}
                  onClick={handleProceedCheckout}
                  className={`w-full inline-block text-center py-3.5 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md border-2 ${
                    hasPrescriptionItems && prescriptionFiles.length === 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 cursor-pointer'
                      : 'bg-[#FFEE45] hover:bg-[#FDD835] active:bg-[#FACC15] text-slate-950 border-[#E5D322] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                  }`}
                >
                  {hasPrescriptionItems && prescriptionFiles.length === 0
                    ? 'Attach Prescription to Proceed →'
                    : 'Proceed to Checkout →'}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
