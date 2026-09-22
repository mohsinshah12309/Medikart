import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Medikart Online Pharmacy Pakistan',
  description: 'Terms of service, payment processing rules, pre-dispatch cancellation policy, prescription verification, and patient rights on Medikart Pakistan.',
  keywords: [
    'Medikart terms and conditions',
    'online pharmacy legal terms Pakistan',
    'prescription drug laws Pakistan',
    'pharmacy cancellation terms'
  ],
  alternates: {
    canonical: 'https://medikart.pk/terms-and-conditions',
  },
  openGraph: {
    title: 'Terms & Conditions | Medikart Online Pharmacy Pakistan',
    description: 'Terms of service, payments, cancellation policies, and prescription verification in Pakistan.',
    url: 'https://medikart.pk/terms-and-conditions',
    siteName: 'Medikart - Authentic Online Pharmacy',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms and Conditions | Medikart Pharmacy Pakistan',
    description: 'Read the terms of service, payment policies, and prescription compliance rules for Medikart.',
  },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 flex flex-col gap-8 pb-16">
      {/* Header Banner - Brand Yellow Dominant */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF352] via-[#FFF866] to-[#FFE51A] rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-[#F7E53B]">
        {/* Ambient Glow Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-300/30 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-[#FFF352] w-fit shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFF352] animate-pulse shadow-[0_0_8px_#fff352]" />
            Legal Agreement &amp; Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
            Effective date: September 2026. Please review these terms carefully before placing orders, uploading prescriptions, or using Medikart healthcare services.
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 shadow-xl p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed">
        
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
            In compliance with national pharmacy regulations and applicable narcotics control laws:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs sm:text-sm">
            <li>Any order containing prescription-only medicines (Rx) or controlled substances requires a valid, legible doctor's prescription uploaded before fulfillment.</li>
            <li>Uploaded prescriptions are verified by licensed pharmacists. Orders lacking valid prescription or attempting illicit acquisition will be rejected.</li>
            <li>Medikart reserves the right to request physical presentation of the original prescription upon doorstep delivery.</li>
          </ul>
        </section>

        {/* 4. Orders, Pricing & Online Payment Gateway */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            4. Orders, Pricing &amp; Payment Terms
          </h2>
          <p>
            All prices are listed in Pakistani Rupees (PKR) inclusive of applicable taxes. Available payment methods include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Cash on Delivery (COD):</strong> Pay cash directly to the authorized courier upon package delivery.</li>
            <li><strong>Online Card Gateway:</strong> Secure online debit/credit card payments (Visa/MasterCard) processed via 256-bit SSL encrypted gateway.</li>
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
            <li><strong>Refund Processing:</strong> Approved card refunds will be processed with merchant gateway settlement within 2 business days.</li>
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
            These terms shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes arising out of or related to these Terms and Conditions shall be subject to the exclusive jurisdiction of the competent courts of Pakistan.
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
          <div className="bg-yellow-50/70 rounded-2xl p-4 border-2 border-yellow-200 text-xs space-y-1">
            <p><strong>Medikart Customer Legal Support</strong></p>
            <p>Email: <a href="mailto:medikart.com@gmail.com" className="text-amber-800 font-bold hover:underline">medikart.com@gmail.com</a></p>
            <p>Helpline: <a href="https://wa.me/923244489159" className="text-amber-800 font-bold hover:underline">+92 324 4489159</a></p>
          </div>
        </section>

        {/* Footer Navigation CTA */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
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
