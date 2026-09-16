"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params?.id || "";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    setLoading(true);

    fetch(`${apiUrl}/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found or unavailable");
        return res.json();
      })
      .then((data) => {
        setOrder(data.data?.order || null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  const handleCopyId = () => {
    const code = order?.orderCode || orderId;
    if (navigator?.clipboard?.writeText && code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleString("en-PK", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  const codeToDisplay = order?.orderCode || orderId;
  const whatsappMessage = encodeURIComponent(
    `Hello Medikart Support, I have a query regarding my Order #${codeToDisplay}.\nCustomer: ${order?.customer?.name || ""}`
  );
  const whatsappUrl = `https://wa.me/923244489159?text=${whatsappMessage}`;

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 print:p-0 print:m-0 print:max-w-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative print:border-none print:shadow-none">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Medikart Logo" className="h-11 w-auto object-contain" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Licensed Online Pharmacy &amp; Healthcare Fulfillment Network
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
              Order Reference
            </span>
            <div className="flex items-center sm:justify-end gap-2 mt-0.5">
              <span className="font-mono text-lg font-black text-slate-900 select-all">
                #{codeToDisplay}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[11px] font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors print:hidden"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <span className="text-xs text-slate-400 block mt-0.5">
              {formatDateTime(order?.createdAt)}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-slate-500 text-sm">
            Retrieving official order details and invoice...
          </div>
        )}

        {/* Error / Not Found */}
        {!loading && error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-6 text-sm">
            <strong>Order Reference #{orderId}</strong>
            <p className="text-xs mt-1 text-amber-800">
              Your order is being processed in the pharmacy queue. You can track this order with customer support or check back in a few minutes.
            </p>
          </div>
        )}

        {!loading && (
          <>
            {/* Status & Customer Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold block mb-1">Delivery Address</span>
                <p className="font-bold text-slate-900">{order?.customer?.name || "Customer"}</p>
                <p className="text-slate-600">{order?.customer?.phone}</p>
                <p className="text-slate-600 mt-0.5">
                  {order?.customer?.address ? `${order.customer.address}, ` : ""}
                  {order?.customer?.city || "Pakistan"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold block mb-1">Order Status &amp; Type</span>
                <div className="flex items-center gap-2 mb-1">
                  <span className="capitalize font-bold text-slate-800">
                    {order?.type === "instant" ? "⚡ Instant Prescription Order" : "Standard Order"}
                  </span>
                </div>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase ${
                    order?.status === "delivered"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : order?.status === "awaiting-pharmacist-pricing"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}>
                    {order?.status === "awaiting-pharmacist-pricing"
                      ? "Awaiting Pharmacist Pricing"
                      : order?.status || "Pending Fulfillment"}
                  </span>
                </div>
                <p className="text-slate-500 mt-2 text-[11px]">
                  Payment Mode: <strong className="uppercase text-slate-700">{order?.paymentMethod || "Cash on Delivery"}</strong> ({order?.paymentState || "Unpaid"})
                </p>
              </div>
            </div>

            {/* Instant Order Pharmacist Review Notice if unpriced */}
            {order?.type === "instant" && order?.status === "awaiting-pharmacist-pricing" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold shrink-0 text-sm">
                    Rx
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      Doctor's Prescription Under Pharmacist Review
                    </h3>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Your prescription has been securely transmitted to our licensed pharmacy team. A qualified pharmacist is reviewing your required medicines and preparing the quotation. You will be notified once the quotation is finalized.
                    </p>
                  </div>
                </div>

                {order?.prescriptionUrl && (
                  <div className="mt-4 pt-3 border-t border-amber-200/60">
                    <span className="text-[11px] font-bold text-amber-900 block mb-2">Uploaded Prescription Document:</span>
                    <a
                      href={order.prescriptionUrl.startsWith("http") ? order.prescriptionUrl : `http://localhost:5000${order.prescriptionUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-semibold text-blue-700 hover:underline"
                    >
                      View Uploaded Prescription File ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Itemized Medicine Table (if items are priced or standard order) */}
            {order?.items && order.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Itemized Medicine Quotation / Invoice
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3">Medicine Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{it.name}</td>
                          <td className="p-3 text-center text-slate-700">{it.quantity}</td>
                          <td className="p-3 text-right text-slate-700">PKR {it.price?.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            PKR {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary Card */}
                <div className="flex justify-end mt-4">
                  <div className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>PKR {order.totals?.subtotal?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee:</span>
                      <span>
                        {order.totals?.deliveryCharge === 0
                          ? "FREE"
                          : `PKR ${order.totals?.deliveryCharge || 0}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Fee:</span>
                      <span>PKR {order.totals?.platformFee !== undefined ? order.totals.platformFee : 10}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2 text-sm">
                      <span>Total Amount:</span>
                      <span className="text-slate-950">
                        PKR {order.totals?.total?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Delivery & Pharmacy Notice */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 mb-6 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <span className="font-bold text-slate-900 block">Estimated Doorstep Delivery Time</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Express Local Dispatch: <strong>45–60 mins</strong> • Standard Regional Fulfillment: <strong>24–48 hours</strong>
                  </p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-[11px] shrink-0">
                Partner Pharmacy Active
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 print:hidden">
              <Link
                href="/"
                className="flex-1 py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-xs text-center"
              >
                ← Continue Shopping
              </Link>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-colors text-center"
              >
                Print Invoice
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors text-center"
              >
                WhatsApp Pharmacist Support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
