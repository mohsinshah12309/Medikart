import React from "react";
import Link from "next/link";
import {
  RotateCcw,
  CreditCard,
  Truck,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "Return & Refund Policy | Medikart Online Pharmacy Pakistan",
  description:
    "Official Return & Refund Policy for Medikart. Learn about pre-dispatch order cancellations, online card refund settlements (2 business days), Rs. 10 store service fee, and pharmaceutical return safety rules in Pakistan.",
  keywords: [
    "Medikart return policy",
    "medicine refund Pakistan",
    "order cancellation pharmacy",
    "pharmacy refund timeline Pakistan",
    "damaged medicine replacement"
  ],
  alternates: {
    canonical: "https://medikart.pk/return-refund-policy",
  },
  openGraph: {
    title: "Return & Refund Policy | Medikart Online Pharmacy Pakistan",
    description:
      "Understand Medikart's cancellation terms, card refund turnaround (2 business days), Rs. 10 store fee, and 24-hr damage reporting policy in Pakistan.",
    url: "https://medikart.pk/return-refund-policy",
    siteName: "Medikart - Authentic Online Pharmacy",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Return & Refund Policy | Medikart Pharmacy Pakistan",
    description:
      "Read Medikart's cancellation terms, refund turnaround (2 business days), and pharmaceutical return safety rules.",
  },
};

export default function ReturnRefundPolicyPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 pb-16 px-4 sm:px-6 pt-4 sm:pt-6">
      {/* ─────────────────────────────────────────────────────────────────────
          1. HERO HEADER (Storefront Yellow Dominant)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF352] via-[#FFF866] to-[#FFE51A] rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-[#F7E53B]">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-300/30 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-[#FFF352] w-fit shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFF352] animate-pulse shadow-[0_0_8px_#fff352]" />
            Customer Protection &amp; Transparency
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight font-heading">
            Return &amp; Refund Policy
          </h1>

          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
            Clear, transparent guidelines regarding order cancellations, refund settlements, card processing fees, and pharmaceutical safety standards across Pakistan.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. POLICY OVERVIEW & PLATFORM MODEL
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 p-6 sm:p-9 shadow-md flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-yellow-100 pb-4">
          <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-lg font-black shrink-0 shadow-xs">
            🛡️
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              1. Platform Model &amp; Authenticity Commitment
            </h2>
            <p className="text-xs text-slate-500 font-medium">Effective date: September 2026</p>
          </div>
        </div>

        <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-3 font-normal">
          <p>
            At <strong className="text-slate-950 font-bold">Medikart</strong>, we are committed to delivering 100% authentic, tamper-evident, and properly handled medications to every patient. Medikart functions as a technology service platform connecting consumers with licensed, certified retail partner pharmacies in Pakistan. Medikart is not a direct medicine manufacturer or primary warehouse supplier.
          </p>
          <p>
            All prescription reviews, dispensing, packaging, and dispatching are executed by qualified registered pharmacists in compliance with applicable medicine handling regulations. Because pharmaceutical products directly impact human health and patient safety, strict statutory guidelines govern medicine returns and cancellations as detailed below.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. ORDER CANCELLATION POLICY & KEY DEDUCTIONS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 p-6 sm:p-9 shadow-md flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-yellow-100 pb-4">
          <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-lg font-black shrink-0 shadow-xs">
            📦
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              2. Order Cancellation Rules
            </h2>
            <p className="text-xs text-slate-500 font-medium">Pre-dispatch vs. post-dispatch conditions</p>
          </div>
        </div>

        <div className="text-slate-700 text-sm leading-relaxed space-y-4">
          <p>
            Customers may cancel an unfulfilled order before it is dispatched by our partner pharmacy. Once a cancellation request is accepted before fulfillment, the eligible refund is calculated based on our standard transaction terms.
          </p>

          {/* Callout 1: Delivery Charges on Post-Dispatch Cancellation */}
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <Truck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
              <strong className="font-black uppercase tracking-wide block mb-1">
                Post-Dispatch Cancellation &amp; Incurred Delivery Charges:
              </strong>
              <p>
                If an order is cancelled after dispatch or once out for delivery, the customer is responsible for paying any applicable delivery charges already incurred for that order.
              </p>
            </div>
          </div>

          {/* Callout 2: Non-refundable Rs. 10 Store Fee */}
          <div className="bg-yellow-50/90 border-2 border-yellow-400 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-950 leading-relaxed">
              <strong className="font-black uppercase tracking-wide block mb-1 text-amber-950">
                Non-Refundable Store Service Fee (Rs. 10):
              </strong>
              <p>
                A non-refundable Medikart service/store fee of <strong>Rs. 10</strong> applies to every order and will <strong>NOT</strong> be refunded in the event of cancellation, regardless of payment method.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. CREDIT / DEBIT CARD (CC) PAYMENT CANCELLATIONS & GATEWAY SETTLEMENT
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 p-6 sm:p-9 shadow-md flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-yellow-100 pb-4">
          <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-lg font-black shrink-0 shadow-xs">
            💳
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              3. Card &amp; Online Payment (CC) Cancellations &amp; Gateway Settlement
            </h2>
            <p className="text-xs text-slate-500 font-medium">Online debit/credit card gateway terms &amp; refund timeline</p>
          </div>
        </div>

        <div className="text-slate-700 text-sm leading-relaxed space-y-4">
          {/* Callout 3: CC Transaction Tax Rule */}
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <CreditCard className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
              <strong className="font-black uppercase tracking-wide block mb-1">
                Card Payment Transaction Tax &amp; Gateway Charges:
              </strong>
              <p>
                If an order paid via credit/debit card (CC) is cancelled by the customer, applicable card payment transaction tax/charges will still apply and are non-refundable, in addition to the non-refundable Rs. 10 Medikart store fee.
              </p>
            </div>
          </div>

          {/* Refund Calculation Summary Box */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2">
            <h4 className="font-black text-slate-950 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
              <span>🧮 Net Refund Calculation Formula:</span>
            </h4>
            <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-900 font-bold">
              Net Refund = [Total Order Value] − [Incurred Delivery Fee (if dispatched)] − [Rs. 10 Store Fee] − [Card Gateway Transaction Tax/Charges (where applicable)]
            </div>
          </div>

          {/* Payment Gateway 2 Business Day Settlement Note */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Payment Gateway Merchant Settlement Window</span>
            </h4>
            <p>
              Refunds for the remaining eligible amount are processed back to the original payment method. Card payment settlements and refund reversals are processed with a standard merchant turnaround of <strong className="text-slate-950">2 business days</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. GUEST CHECKOUT ORDERS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 p-6 sm:p-9 shadow-md flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-yellow-100 pb-3">
          <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-lg font-black shrink-0 shadow-xs">
            👤
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              4. Guest Checkout Orders
            </h2>
            <p className="text-xs text-slate-500 font-medium">Equal terms for non-registered users</p>
          </div>
        </div>

        <p className="text-slate-700 text-sm leading-relaxed">
          Medikart fully supports quick guest checkout without mandatory account registration. These same cancellation, non-refundable fee deductions, and refund terms apply equally to guest orders. To request a cancellation or refund for a guest order, simply provide your active phone number and Order ID to our support desk.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          6. MEDICINE RETURN ELIGIBILITY & SAFETY STANDARDS
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 p-6 sm:p-9 shadow-md flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-yellow-100 pb-4">
          <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-lg font-black shrink-0 shadow-xs">
            💊
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              5. Medicine Return Eligibility &amp; Safety Guidelines
            </h2>
            <p className="text-xs text-slate-500 font-medium">Pharmacy standards &amp; patient safety restrictions</p>
          </div>
        </div>

        <div className="text-slate-700 text-sm leading-relaxed space-y-4">
          <p>
            Due to the clinical nature of pharmaceutical products (including temperature sensitivity, sterility, and tamper risk), medicines and clinical goods are <strong>strictly non-returnable</strong> once delivered and unsealed, <strong>EXCEPT</strong> under the following verifiable conditions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl bg-green-50/70 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs sm:text-sm font-black text-green-950 block">
                  Damaged on Arrival
                </strong>
                <span className="text-xs text-green-900 leading-snug">
                  Broken bottles, punctured blister packs, or packaging damaged in transit.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-green-50/70 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs sm:text-sm font-black text-green-950 block">
                  Incorrect Medicine Delivered
                </strong>
                <span className="text-xs text-green-900 leading-snug">
                  Different brand, strength, or item compared to verified prescription/order.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-green-50/70 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs sm:text-sm font-black text-green-950 block">
                  Defective or Expired Product
                </strong>
                <span className="text-xs text-green-900 leading-snug">
                  Manufacturer defects, broken seals, or expired validity date upon receipt.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-green-50/70 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs sm:text-sm font-black text-green-950 block">
                  24-Hour Notice Window
                </strong>
                <span className="text-xs text-green-900 leading-snug">
                  Eligible return claims must be logged within 24 hours of delivery with photographic evidence.
                </span>
              </div>
            </div>
          </div>

          {/* Narcotics and Controlled Substances Policy Note */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div className="text-slate-800 leading-relaxed">
              <strong className="font-extrabold text-slate-950 block mb-1">
                Controlled Substances &amp; Strict Prescription Verification:
              </strong>
              <p>
                In strict compliance with national drug laws and pharmacy regulations, Medikart does not dispense or deliver controlled narcotics, habit-forming psychotropics, or restricted Schedule X substances online. For orders requiring prescription verification, if a valid doctor&apos;s prescription is not supplied upon request, the scheduled items will be voided before dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          7. HOW TO REQUEST A CANCELLATION OR REFUND
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 p-6 sm:p-9 shadow-md flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-yellow-100 pb-4">
          <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-lg font-black shrink-0 shadow-xs">
            ✍️
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              6. How to Request a Cancellation or Refund
            </h2>
            <p className="text-xs text-slate-500 font-medium">Step-by-step assistance from our clinical care team</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-yellow-50/60 border-2 border-yellow-200 flex flex-col gap-2">
            <span className="w-7 h-7 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
              1
            </span>
            <h4 className="font-black text-slate-950 text-sm">Contact Support Promptly</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reach out via our WhatsApp helpline, direct phone, or through the <Link href="/contact" className="text-amber-800 font-bold underline">Contact Page</Link>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-yellow-50/60 border-2 border-yellow-200 flex flex-col gap-2">
            <span className="w-7 h-7 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
              2
            </span>
            <h4 className="font-black text-slate-950 text-sm">Provide Order Details</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quote your Order ID, registered phone number, and brief description (attach photos if claiming damage).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-yellow-50/60 border-2 border-yellow-200 flex flex-col gap-2">
            <span className="w-7 h-7 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
              3
            </span>
            <h4 className="font-black text-slate-950 text-sm">Review &amp; Settlement</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our support desk verifies dispatch status and submits the refund via the secure merchant gateway within 2 business days.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          8. STILL HAVE QUESTIONS? CTA SECTION
      ────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-white via-yellow-50/40 to-amber-50/30 rounded-3xl border-2 border-yellow-300 p-6 sm:p-10 shadow-lg flex flex-col gap-6">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 font-heading">
            Need Clarification?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            Still Have Questions?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Explore our comprehensive FAQ repository or connect directly with our 24/7 customer care team.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: FAQs */}
          <Link
            href="/faqs"
            className="p-5 bg-white rounded-2xl border-2 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50/50 transition-all shadow-xs flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
              ❓
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">Explore FAQs</h4>
              <p className="text-xs text-slate-500 mt-0.5">Quick answers to common questions</p>
            </div>
            <span className="text-xs font-black text-amber-900 flex items-center gap-1 mt-auto">
              <span>View FAQs</span>
              <span>→</span>
            </span>
          </Link>

          {/* Card 2: WhatsApp */}
          <a
            href="https://wa.me/923244489159?text=Hi%20Medikart%20Support,%20I%20have%20a%20question%20about%20the%20Return%20and%20Refund%20policy."
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 bg-white rounded-2xl border-2 border-[#25D366]/40 hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all shadow-xs flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">WhatsApp Live Chat</h4>
              <p className="text-xs text-slate-500 mt-0.5">Instant support desk</p>
            </div>
            <span className="text-xs font-black text-[#15803d] flex items-center gap-1 mt-auto">
              <span>Chat on WhatsApp</span>
              <span>→</span>
            </span>
          </a>

          {/* Card 3: Contact Form */}
          <Link
            href="/contact"
            className="p-5 bg-white rounded-2xl border-2 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50/50 transition-all shadow-xs flex flex-col items-center text-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-yellow-300 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">Contact Support Desk</h4>
              <p className="text-xs text-slate-500 mt-0.5">Log a formal inquiry</p>
            </div>
            <span className="text-xs font-black text-slate-950 flex items-center gap-1 mt-auto">
              <span>Contact Page</span>
              <span>→</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
