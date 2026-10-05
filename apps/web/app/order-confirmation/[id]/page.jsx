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
  const [printDate, setPrintDate] = useState("");

  useEffect(() => {
    setPrintDate(
      new Date().toLocaleString("en-PK", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );

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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, "0");
      return `${day}/${month}/${year} - ${strHours}:${minutes} ${ampm}`;
    } catch {
      return "N/A";
    }
  };

  const codeToDisplay = order?.orderCode || orderId;
  const whatsappMessage = encodeURIComponent(
    `Hello Medikart Support, I have a query regarding my Order #${codeToDisplay}.\nCustomer: ${order?.customer?.name || ""}`
  );
  const whatsappUrl = `https://wa.me/923244489159?text=${whatsappMessage}`;

  const subtotal = order?.totals?.subtotal ?? (order?.items || []).reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
  const deliveryCharge = order?.totals?.deliveryCharge ?? 0;
  const platformFee = order?.totals?.platformFee !== undefined ? order?.totals?.platformFee : 10;
  const discount = order?.totals?.discount ?? 0;
  const grandTotal = order?.totals?.total ?? (subtotal + deliveryCharge + platformFee - discount);

  return (
    <div className="max-w-3xl mx-auto my-4 px-2 sm:px-4 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* Container targeted by print styling */}
      <div
        id="invoice-print-container"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 relative print:border-none print:shadow-none print:p-0 text-slate-800"
      >
        {/* Centered Header with Medikart logo and tagline */}
        <div className="text-center pb-2.5">
          <img
            src="/logo.png"
            alt="Medikart"
            className="h-9 sm:h-10 mx-auto object-contain mb-1"
          />
          <p className="text-xs text-slate-600 font-semibold">Medicines. Faster to you.</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">92 G1 Johar Town, Lahore, Pakistan | Helpline: +92 324 4489159</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-slate-500 text-sm">
            Retrieving official order details and invoice...
          </div>
        )}

        {/* Error / Not Found */}
        {!loading && error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-4 text-sm print:hidden">
            <strong>Order Reference #{orderId}</strong>
            <p className="text-xs mt-1 text-amber-800">
              Your order is being processed in the pharmacy queue. You can track this order with customer support or check back in a few minutes.
            </p>
          </div>
        )}

        {!loading && (
          <>
            {/* Meta Block: 2 Columns bounded by top & bottom borders */}
            <div className="border-y border-slate-300 py-2.5 my-2 text-xs leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 print:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">Name:</span>
                    <span className="font-bold text-slate-900 flex-1">{order?.customer?.name || "Customer"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">Phone Number:</span>
                    <span className="text-slate-800 flex-1">{order?.customer?.phone || "N/A"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">Address:</span>
                    <span className="text-slate-800 flex-1">
                      {order?.customer?.address ? `${order.customer.address}, ` : ""}
                      {order?.customer?.city || "Pakistan"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">Payment Method:</span>
                    <span className="font-bold text-slate-900 flex-1">
                      {order?.paymentMethod === "cod"
                        ? "CashOnDelivery"
                        : order?.paymentMethod === "card"
                        ? "Credit / Online Card"
                        : order?.paymentMethod || "CashOnDelivery"}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="w-28 font-semibold text-slate-600">Order Number:</span>
                    <span className="font-bold text-slate-900 flex-1 font-mono">
                      #{codeToDisplay}
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors print:hidden"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">Date:</span>
                    <span className="text-slate-800 flex-1">{formatInvoiceDate(order?.createdAt)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">City Name:</span>
                    <span className="text-slate-800 flex-1">{order?.customer?.city || "Pakistan"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-semibold text-slate-600">Fulfillment:</span>
                    <span className="text-slate-900 font-semibold flex-1">⚡ Fastest Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Order Pharmacist Review Notice (if awaiting review) */}
            {order?.type === "instant" && order?.status === "awaiting-pharmacist-pricing" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 my-2 text-left print:border-slate-300">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-amber-900 font-bold shrink-0 text-xs">
                    Rx
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950">
                      Prescription Under Pharmacist Review
                    </h3>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-tight">
                      Your prescription has been securely transmitted. A qualified pharmacist is verifying your medicines and preparing the quotation.
                    </p>
                  </div>
                </div>
                {order?.prescriptionUrl && (
                  <div className="mt-2 pt-1.5 border-t border-amber-200/60 print:hidden">
                    <a
                      href={
                        order.prescriptionUrl.startsWith("http")
                          ? order.prescriptionUrl
                          : `${process.env.NEXT_PUBLIC_API_URL || ""}${order.prescriptionUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      View Uploaded Prescription Document ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Centered Order Details Header */}
            <h2 className="text-center font-bold text-xs uppercase tracking-wider my-2.5 text-slate-900">
              Order Details
            </h2>

            {/* Order Details Table */}
            <div className="border border-slate-300 rounded overflow-hidden mb-2.5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-[11px]">
                    <th className="p-2 border-r border-slate-200">Description</th>
                    <th className="p-2 text-center border-r border-slate-200">Quantity</th>
                    <th className="p-2 text-right border-r border-slate-200">Rate</th>
                    <th className="p-2 text-right border-r border-slate-200">Sub Total</th>
                    <th className="p-2 text-right border-r border-slate-200">Discount</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {order?.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => {
                      const itemSubTotal = (it.price || 0) * (it.quantity || 1);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-medium text-slate-900 border-r border-slate-200">
                            {it.name}
                          </td>
                          <td className="p-2 text-center text-slate-700 border-r border-slate-200">
                            {it.quantity} (pack)
                          </td>
                          <td className="p-2 text-right text-slate-700 border-r border-slate-200">
                            PKR {it.price?.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-slate-700 border-r border-slate-200">
                            PKR {itemSubTotal.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-slate-700 border-r border-slate-200">
                            0.0
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            PKR {itemSubTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                        Prescription items pending pharmacist verification.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right-aligned Totals Summary */}
            <div className="flex justify-end my-2.5">
              <div className="w-64 text-xs space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Sub - Total</span>
                  <span>PKR {subtotal?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Discount</span>
                  <span>PKR {discount ? discount.toLocaleString() : "0.0"}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Delivery Charges</span>
                  <span>
                    {deliveryCharge === 0 ? "FREE" : `PKR ${deliveryCharge.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Platform Fee</span>
                  <span>PKR {platformFee}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-400 pt-1.5 mt-1 text-sm">
                  <span>Grand Total</span>
                  <span>PKR {grandTotal?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Policy & Terms Disclaimers */}
            <div className="border-t border-slate-200 pt-2 mt-2 text-[10px] text-slate-500 leading-tight space-y-0.5">
              <p>• 100% genuine medicines dispensed under supervision of qualified registered pharmacists.</p>
              <p>• Goods once sold will not be returned or exchanged unless there is a manufacturer defect or dispensing error reported upon delivery.</p>
              <p>• Cold chain and temperature-sensitive products (e.g. Insulins, Vaccines) are non-returnable once dispatched to guarantee pharmacological integrity.</p>
              <p>• Please inspect package seal, batch number, and expiry date upon delivery before opening.</p>
            </div>

            {/* Printed By Footer */}
            <div className="border-t border-slate-200 mt-2 pt-1.5 text-[10px] text-slate-400 flex justify-between items-center">
              <span>Printed By: Medikart Pharmacy Operations ({printDate || "Recent"})</span>
              <span className="font-mono text-[9px]">DOC-REF: #{codeToDisplay}</span>
            </div>

            {/* Action Buttons (Explicitly hidden when printing) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-3 border-t border-slate-200 print-action-buttons">
              <Link
                href="/"
                className="flex-1 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-xs text-center"
              >
                ← Continue Shopping
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors text-center cursor-pointer shadow-xs"
              >
                🖨️ Print Invoice / PDF
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors text-center"
              >
                💬 WhatsApp Support
              </a>
            </div>
          </>
        )}
      </div>

      {/* Robust Print Stylesheet (Hides headers, footers, chatbots, and isolates invoice container for 1-page A4 print) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            header,
            footer,
            nav,
            aside,
            .print-action-buttons,
            .print-hidden,
            [role="dialog"],
            [aria-label*="WhatsApp"],
            [aria-label*="Medi"] {
              display: none !important;
            }
            #invoice-print-container {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `,
        }}
      />
    </div>
  );
}
