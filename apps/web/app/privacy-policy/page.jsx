import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Medikart Online Pharmacy',
  description: 'Learn how Medikart protects patient data, partners with licensed pharmacies, and safeguards your health information.',
  alternates: {
    canonical: 'https://medikart.pk/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | Medikart Online Pharmacy',
    description: 'Learn how Medikart protects patient data and partners with licensed pharmacies.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Medikart Pharmacy',
    description: 'Learn how Medikart protects patient data and ensures medical privacy.',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/40 rounded-3xl border border-amber-200/70 p-6 sm:p-10 mb-8 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
          <span>🛡️ Patient Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Last updated: September 2026. Your health information and privacy are protected with 256-bit encryption and strict medical confidentiality standards.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed">
        
        {/* Important Platform & Pharmacy Sourcing Clarification Box */}
        <section className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-black text-base">
            <span>💊</span>
            <h2>Platform Operation &amp; Authentic Medicine Sourcing</h2>
          </div>
          <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
            <strong>Platform Sourcing Notice:</strong> Medikart is <strong>not a direct medicine manufacturer or primary pharmaceutical supplier</strong>. Medikart operates as a secure digital technology platform and healthcare fulfillment network that connects customers with licensed, verified partner pharmacies across Pakistan to fulfill and deliver orders rapidly to your doorstep.
          </p>
          <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
            <strong>Authenticity Guarantee:</strong> All prescription and over-the-counter medicines ordered via Medikart are sourced exclusively from these authorized, DRAP-licensed partner pharmacies. All products are <strong>100% authentic, genuine, unadulterated, and strictly non-counterfeit</strong>, stored under certified temperature-controlled conditions prior to dispatch.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            1. Information We Collect
          </h2>
          <p>
            When you browse Medikart, place an order, upload a prescription, or create an account, we may collect the following categories of information:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Personal Contact Information:</strong> Name, phone number, email address, and delivery street address with city.</li>
            <li><strong>Prescription Documents:</strong> Images or PDF copies of medical prescriptions uploaded for instant ordering or controlled (Rx) medicines.</li>
            <li><strong>Order &amp; Transaction History:</strong> Medicines purchased, order references, payment method choices (Cash on Delivery or Kuickpay card payments), and 30-day refill schedules.</li>
            <li><strong>Technical &amp; Device Information:</strong> IP address, browser type, operating system, device identifiers, and anonymized browsing activity.</li>
          </ul>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            2. How We Use Your Information
          </h2>
          <p>
            We process your personal and health-related data strictly for legitimate healthcare and fulfillment purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>To transmit prescription orders to licensed pharmacists for clinical verification and dosage inspection.</li>
            <li>To dispatch riders from nearest partner pharmacies for rapid doorstep delivery.</li>
            <li>To provide automated 30-day monthly refill reminders and order confirmation notifications via SMS, email, and WhatsApp.</li>
            <li>To maintain mandatory narcotics and DRAP regulatory fulfillment logs where required by law.</li>
            <li>To improve platform security, prevent fraud, and optimize customer experience.</li>
          </ul>
        </section>

        {/* 3. Cookies and Analytics */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            3. Cookies and Analytics Tracking
          </h2>
          <p>
            Medikart uses cookies and local storage tokens to retain your active shopping cart, remember your city preferences, and keep you securely logged in. Non-essential analytical cookies (e.g., Google Analytics 4) are strictly gated and only activated after you provide explicit consent through our cookie consent banner. You may update or revoke your cookie choices at any time.
          </p>
        </section>

        {/* 4. Third-Party Sharing and Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            4. Third-Party Sharing &amp; Data Security
          </h2>
          <p>
            We never sell, rent, or trade your personal health data to advertisers. Information is shared only with:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Licensed Partner Pharmacies:</strong> To dispense and package authentic medicines as prescribed.</li>
            <li><strong>Payment &amp; Logistics Partners:</strong> Kuickpay for card payment tokenization, and authorized delivery personnel for parcel dropoff.</li>
            <li><strong>Regulatory Authorities:</strong> Where legally mandated by DRAP (Drug Regulatory Authority of Pakistan) or healthcare regulatory bodies.</li>
          </ul>
          <p className="pt-2">
            All data in transit is protected using industry-standard 256-bit TLS/SSL encryption and stored on secure cloud servers with restricted role-based access.
          </p>
        </section>

        {/* 5. User Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            5. Your Rights and Choices
          </h2>
          <p>
            You have the right to access, review, update, or request deletion of your account and personal details at any time. You can also opt out of promotional newsletters while retaining essential transactional order notifications.
          </p>
        </section>

        {/* 6. Contact Pharmacist & Privacy Support */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 font-heading">
            6. Contact Us Regarding Privacy
          </h2>
          <p>
            If you have questions regarding this Privacy Policy, prescription handling, or data security, please reach out to our privacy compliance officer:
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1">
            <p><strong>Medikart Privacy &amp; Healthcare Compliance</strong></p>
            <p>Email: <a href="mailto:medikart.com@gmail.com" className="text-amber-700 font-bold hover:underline">medikart.com@gmail.com</a></p>
            <p>Support Hotline / WhatsApp: <a href="https://wa.me/923244489159" className="text-amber-700 font-bold hover:underline">+92 324 4489159</a></p>
            <p>Lahore / Karachi, Pakistan</p>
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
            href="/terms-and-conditions"
            className="text-xs font-bold text-slate-600 hover:text-amber-700 transition-colors"
          >
            View Terms and Conditions →
          </Link>
        </div>

      </div>
    </div>
  );
}
