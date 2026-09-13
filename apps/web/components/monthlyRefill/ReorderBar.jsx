"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Loader2, CheckCircle2, MapPin, X, ArrowRight } from "lucide-react";
import "./monthlyRefill.css";

export default function ReorderBar({
  refillData,
  token,
  customer,
  onOrderSuccess,
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  // Form states
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Karachi");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const items = refillData?.items || [];
  const itemCount = refillData?.count || 0;
  const subtotal = refillData?.subtotal || 0;

  const formatPrice = (num) => {
    return typeof num === "number" ? Math.round(num) : num;
  };

  const handleOpenModal = () => {
    setError("");
    setPhone(customer?.phone || phone || "");
    setIsModalOpen(true);
  };

  const handleReorderSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!address.trim() || address.trim().length < 3) {
      setError("Please enter your complete delivery address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError("Please provide a valid contact phone number.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${apiUrl}/customer/monthly-refill/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          phone: phone.trim(),
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to place monthly refill order");
      }

      setPlacedOrder(data?.data?.order);
      if (onOrderSuccess) {
        onOrderSuccess(data?.data?.order);
      }
    } catch (err) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (itemCount === 0) return null;

  return (
    <>
      {/* Sticky Bottom Summary Bar */}
      <div className="sticky bottom-4 z-40 mt-6 sm:mt-8">
        <div className="refill-reorder-bar p-3.5 sm:p-4 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-xl">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-[#fff850] border border-[#fae845] flex items-center justify-center text-slate-900 shadow-2xs font-black">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monthly Routine ({itemCount} {itemCount === 1 ? "medicine" : "medicines"})
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-900">
                  PKR {formatPrice(subtotal)}
                </span>
                <span className="text-[11px] text-slate-500">+ delivery & Rs 10 fee</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full sm:w-auto btn-refill-primary px-7 py-3 rounded-full text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Zap className="w-4 h-4 fill-[#1a1a1a]" />
            <span>Reorder Now (30-Day Cycle)</span>
          </button>
        </div>
      </div>

      {/* Confirmation & Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FFFBEB] via-[#fff850]/40 to-[#FFFBEB] p-5 sm:p-6 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fff850] border border-[#fae845] flex items-center justify-center text-lg shadow-2xs">
                  💊
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                    {placedOrder ? "Order Confirmed!" : "Confirm Monthly Refill"}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {placedOrder
                      ? "Your 30-day reminder has been refreshed."
                      : "Review your delivery address to place order."}
                  </p>
                </div>
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/80 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            {placedOrder ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Order Successfully Placed!
                </h4>
                <p className="text-xs font-bold text-amber-900 mt-1 bg-amber-50 py-1.5 px-3 rounded-full inline-block border border-amber-200">
                  Order #{placedOrder.orderCode || placedOrder._id}
                </p>
                <p className="text-xs text-slate-500 mt-3 max-w-sm mx-auto">
                  Our pharmacists are preparing your monthly refill items for delivery.
                  We will also send your next reminder in approximately 30 days!
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href={`/order-confirmation/${placedOrder._id}`}
                    className="btn-refill-primary px-6 py-2.5 rounded-full text-xs font-black shadow-xs inline-flex items-center justify-center gap-2"
                  >
                    <span>View Order Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setPlacedOrder(null);
                    }}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReorderSubmit} className="p-5 sm:p-6">
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {error}
                  </div>
                )}

                {/* Items preview snippet */}
                <div className="mb-4 bg-[#fffde0] p-3 rounded-2xl border border-[#fef08a] max-h-32 overflow-y-auto">
                  <p className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1.5">
                    Refill Medicines ({itemCount}):
                  </p>
                  <ul className="space-y-1">
                    {items.map((it) => (
                      <li
                        key={it._id}
                        className="text-xs text-slate-800 flex justify-between font-medium"
                      >
                        <span>
                          {it.name} <span className="text-amber-800 font-bold">×{it.quantity}</span>
                        </span>
                        <span className="font-bold">PKR {formatPrice(it.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Delivery Address */}
                <div className="mb-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, apartment/house number, area"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                    />
                  </div>
                </div>

                {/* City & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Karachi, Lahore, Islamabad"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                        paymentMethod === "cod"
                          ? "border-[#fae845] bg-[#fffde0] text-slate-900 shadow-2xs"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="accent-amber-600"
                      />
                      <span>Cash on Delivery</span>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                        paymentMethod === "card"
                          ? "border-[#fae845] bg-[#fffde0] text-slate-900 shadow-2xs"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="accent-amber-600"
                      />
                      <span>Debit / Credit Card</span>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-refill-primary px-6 py-2.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{loading ? "Placing Order..." : "Confirm & Place Order"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
