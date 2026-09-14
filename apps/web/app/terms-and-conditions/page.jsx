import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Medikart Online Pharmacy',
  description: 'Terms of service, Kuickpay payments, order cancellation policy (FR-AD-39), prescription verification, and patient rights.',
  alternates: {
    canonical: 'https://medikart.pk/terms-and-conditions',
  },
  openGraph: {
    title: 'Terms & Conditions | Medikart Online Pharmacy',
    description: 'Terms of service, payments, cancellation policies, and prescription verification.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms and Conditions | Medikart Pharmacy',
    description: 'Read the terms of service, payment policies, and prescription compliance rules for Medikart.',
  },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/40 rounded-3xl border border-amber-200/70 p-6 sm:p-10 mb-8 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
          <span>📜 Legal Agreement &amp; Compliance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight mb-3">
          Terms &amp; Conditions
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Effective date: September 2026. Please read these terms carefully before placing orders or using Medikart healthcare services.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed">
        
        {/* 1. Use of Service & Platform Model */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            1. Acceptance of Terms &amp; Platform Model
          </h2>
          <p>
            By accessing or using Medikart website and services, you agree to be bound by these Terms and Conditions and our Privacy Policy. Medikart functions as an online marketplace and technology connector linking consumers with licensed, certified retail pharmacies in Pakistan. Medikart itself is not a pharmaceutical manufacturer.
          </p>
        </section>

        {/* 2. Account Responsibilities */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            2. Customer Accounts &amp; Security
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and one-time verification codes (OTP). You agree to provide accurate and complete contact details, delivery address, and active mobile numbers for order fulfillment.
          </p>
        </section>

        {/* 3. Prescription & Narcotics Verification Requirements */}
        <section className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-950 font-black text-base">
            <span>℞</span>
            <h2 className="font-heading">3. Prescription (Rx) &amp; Narcotics Regulations</h2>
          </div>
          <p className="text-slate-800 text-xs sm:text-sm">
            In compliance with the Drug Regulatory Authority of Pakistan (DRAP) and applicable narcotics control laws:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs sm:text-sm">
            <li>Any order containing prescription-only medicines (Rx) or controlled substances requires a valid, legible doctor's prescription uploaded before fulfillment.</li>
            <li>Uploaded prescriptions are verified by licensed pharmacists. Orders lacking valid prescription or attempting illicit acquisition will be rejected.</li>
            <li>Medikart reserves the right to request physical presentation of the original prescription upon doorstep delivery.</li>
          </ul>
        </section>

        {/* 4. Orders, Pricing & Kuickpay Payment Gateway */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            4. Orders, Pricing &amp; Payment Terms
          </h2>
          <p>
            All prices are listed in Pakistani Rupees (PKR) inclusive of applicable taxes. Available payment methods include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Cash on Delivery (COD):</strong> Pay cash directly to the authorized courier upon package delivery.</li>
            <li><strong>Kuickpay Digital Gateway:</strong> Secure online debit/credit card payments and bill payment vouchers processed via 256-bit SSL encrypted gateway.</li>
          </ul>
          <p className="pt-1">
            In the event of an instant prescription order awaiting pharmacist pricing, the order total is finalized only after pharmacist review and customer approval.
          </p>
        </section>

        {/* 5. Cancellation and Refund Policy (FR-AD-39 & FR-SYS-10) */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            5. Cancellation &amp; Refund Policy
          </h2>
          <p>
            In accordance with requirements FR-AD-39 and FR-SYS-10:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Order Cancellation:</strong> Customers may cancel an unfulfilled order through customer support or WhatsApp prior to pharmacy dispatch. Once an order is out for delivery, cancellations cannot be processed.</li>
            <li><strong>Damaged or Incorrect Items:</strong> If any delivered medicine is damaged in transit, expired, or incorrect, notify Medikart within 24 hours of delivery with photographic evidence for immediate replacement or full refund.</li>
            <li><strong>Opened / Temperature-Sensitive Medicines:</strong> Due to hygiene and pharmaceutical safety standards, cold-chain items (e.g. insulin, vaccines) and opened tamper-evident seals cannot be returned once accepted.</li>
            <li><strong>Refund Processing:</strong> Approved card refunds via Kuickpay will be credited back to the original source account within 5 to 7 business days.</li>
          </ul>
        </section>

        {/* 6. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            6. Medical Disclaimer &amp; Limitation of Liability
          </h2>
          <p>
            The content, health blogs, and medicine information available on Medikart are for educational and informational purposes only and do not constitute medical advice or diagnosis. Always consult a qualified physician or healthcare provider regarding medical conditions or medication regimen. Medikart and its partner pharmacies are not liable for adverse reactions resulting from patient misuse or inaccurate prescription uploads.
          </p>
        </section>

        {/* 7. Governing Law & Jurisdiction Placeholder */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
          <h2 className="text-base font-black text-slate-900 font-heading">
            7. Governing Law &amp; Jurisdiction
          </h2>
          <p className="text-xs sm:text-sm text-slate-700">
            These terms shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes arising out of or related to these Terms and Conditions shall be subject to the exclusive jurisdiction of the competent courts of <strong>[Jurisdiction / City: e.g., Lahore / Karachi, Pakistan]</strong>.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            8. Inquiries &amp; Legal Support
          </h2>
          <p>
            For questions or notices regarding these Terms, please contact our support team:
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1">
            <p><strong>Medikart Customer Legal Support</strong></p>
            <p>Email: <a href="mailto:medikart.com@gmail.com" className="text-amber-700 font-bold hover:underline">medikart.com@gmail.com</a></p>
            <p>Helpline: <a href="https://wa.me/923244489159" className="text-amber-700 font-bold hover:underline">+92 324 4489159</a></p>
          </div>
        </section>

        {/* Footer Navigation CTA */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-all shadow-xs"
          >
            ← Back to Storefront
          </Link>
          <Link
            href="/privacy-policy"
            className="text-xs font-bold text-slate-600 hover:text-amber-700 transition-colors"
          >
            View Privacy Policy →
          </Link>
        </div>

      </div>
    </div>
  );
}
