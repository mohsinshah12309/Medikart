import React from "react";
import Link from "next/link";
import {
  Building2,
  FileCheck,
  ShieldCheck,
  Truck,
  Phone,
  Mail,
  ExternalLink,
  Globe,
  Award,
  Users,
  CreditCard,
  Banknote,
  Clock,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Press, Media & Partner Fact Sheet | Medikart Online Pharmacy Pakistan",
  description:
    "Official press, media assets, corporate information, and partnership details for Medikart — a digital healthcare network by Banu Zahrah Pvt Ltd connecting patients with licensed partner pharmacies across Pakistan.",
  keywords: [
    "Medikart press",
    "Medikart media kit",
    "Medikart Pakistan partnerships",
    "Banu Zahrah Pvt Ltd Medikart",
    "online pharmacy media Pakistan",
    "pharmacy network Pakistan facts",
  ],
  alternates: {
    canonical: "https://medikart.pk/press",
  },
  openGraph: {
    title: "Press & Media Fact Sheet — Medikart Pakistan",
    description:
      "Verified corporate facts, operational model, and media contact for Medikart Pakistan (Banu Zahrah Pvt Ltd).",
    url: "https://medikart.pk/press",
    siteName: "Medikart - Authentic Online Pharmacy",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Press & Media Fact Sheet — Medikart Pakistan",
    description:
      "Official press kit and corporate profile for Medikart, Pakistan's licensed digital pharmacy network.",
  },
};

const pressSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "Medikart Press & Media Fact Sheet",
  "description": "Verified corporate and operational profile of Medikart (Banu Zahrah Pvt Ltd).",
  "url": "https://medikart.pk/press",
  "mainEntity": {
    "@type": "Organization",
    "name": "Medikart",
    "legalName": "Banu Zahrah Pvt Ltd",
    "url": "https://medikart.pk",
    "logo": "https://medikart.pk/icon.png",
    "email": "medikart.com@gmail.com",
    "telephone": "+923244489159",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lahore",
      "addressRegion": "Punjab",
      "addressCountry": "PK"
    },
    "sameAs": [
      "https://facebook.com/medikartpk",
      "https://www.instagram.com/medikart.pakistan",
      "https://twitter.com/medikartpk",
      "https://linkedin.com/company/medikart-pk",
      "https://youtube.com/@medikartpk"
    ]
  }
};

export default function PressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pressSchema) }}
      />

      <div className="max-w-5xl mx-auto flex flex-col gap-10 pb-16 px-4 sm:px-6">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF352] via-[#FFF866] to-[#FFE51A] rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-[#F7E53B]">
          <div className="flex flex-col gap-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-[#FFF352] w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FFF352] animate-pulse" />
              Verified Media &amp; Partnership Fact Sheet
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 font-heading tracking-tight leading-tight">
              Press, Media &amp; Corporate Profile
            </h1>
            <p className="text-base sm:text-lg text-slate-900 font-semibold leading-relaxed">
              Official company information, operational benchmarks, and ready-to-cite factual resources for journalists, media publications, directory editors, and prospective pharmacy partners.
            </p>
          </div>
        </div>

        {/* Quick Facts Grid (Citable Data) */}
        <section className="bg-white rounded-3xl border-2 border-yellow-300 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="p-2 bg-yellow-400 text-slate-950 rounded-xl text-lg font-bold">🏛️</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Corporate &amp; Operational Fact Sheet
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Accurate, verified facts regarding Medikart and its operating structure in Pakistan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Brand &amp; Operating Entity
              </span>
              <p className="font-extrabold text-slate-950 text-base">Medikart</p>
              <p className="text-slate-700">A digital healthcare project by <strong className="text-slate-900">Banu Zahrah Pvt Ltd</strong>.</p>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Official Digital Domain
              </span>
              <p className="font-extrabold text-slate-950 text-base">medikart.pk</p>
              <p className="text-slate-700">Canonical online pharmacy platform: <Link href="https://medikart.pk" className="text-amber-800 underline font-bold">https://medikart.pk</Link></p>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Operating Model
              </span>
              <p className="font-bold text-slate-900">Licensed Partner Pharmacy Network</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Connects patients with licensed retail pharmacies and verified pharmaceutical distributors across Pakistan for rapid dispensing and doorstep delivery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Coverage &amp; Delivery Capabilities
              </span>
              <p className="font-bold text-slate-900">2–4 Hr Metropolitan &amp; Nationwide Express</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Intra-city dispatch within 2 to 4 hours across Lahore, Karachi, Islamabad &amp; Rawalpindi; 24–48 hour express courier delivery nationwide across Pakistan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Confirmed Payment Methods
              </span>
              <p className="font-bold text-slate-900">Cash on Delivery (COD) &amp; Kuickpay</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Nationwide Cash on Delivery at customer doorstep, alongside secure online digital billing through Kuickpay integration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Clinical Safety &amp; Quality
              </span>
              <p className="font-bold text-slate-900">100% Authentic Medicines &amp; Cold Chain</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Mandatory pharmacist prescription verification, 2°C–8°C cold-chain storage for insulin and biologics, and strict zero-tolerance policy on controlled narcotics.
              </p>
            </div>
          </div>
        </section>

        {/* Media Kit & Official Boilerplate */}
        <section className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="p-2 bg-yellow-400 text-slate-950 rounded-xl text-lg font-bold">📝</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Standard Boilerplate (For Press &amp; Editorial Citations)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Short and standard descriptions approved for direct quotation in news, articles, and directory listings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Short Summary (50 Words)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                &ldquo;Medikart (medikart.pk) is a digital healthcare delivery network in Pakistan operated by Banu Zahrah Pvt Ltd. Medikart partners with licensed pharmacies and pharmaceutical distributors to deliver 100% authentic prescription medicines, OTC remedies, and monthly refills with 2–4 hour metropolitan delivery and nationwide Cash on Delivery.&rdquo;
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Full Executive Overview (100 Words)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                &ldquo;Medikart is a Pakistani e-pharmacy platform and healthcare logistics network by Banu Zahrah Pvt Ltd. Connecting patients with verified partner retail pharmacies across Lahore, Karachi, Islamabad, and nationwide, Medikart provides genuine medicines, qualified pharmacist prescription review, 30-day chronic medicine refill subscriptions, and specialized cold-chain handling for vaccines and insulin. Medikart supports nationwide Cash on Delivery and online digital billing through Kuickpay.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Partnership & Media Inquiries */}
        <section className="bg-gradient-to-br from-amber-500/10 via-yellow-400/15 to-amber-500/5 rounded-3xl border-2 border-yellow-400 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-yellow-200 px-2.5 py-0.5 rounded-full inline-block">
              Media &amp; Partner Desk
            </span>
            <h3 className="text-2xl font-black text-slate-950 font-heading">
              Interested in Partnering or Feature Coverage?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 max-w-xl leading-relaxed">
              For press inquiries, editorial fact-checking, brand assets, or licensed pharmacy partner enrollment, contact our communications desk directly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="mailto:medikart.com@gmail.com?subject=Press%20/%20Partnership%20Inquiry%20-%20Medikart"
              className="btn-amber-gradient px-6 py-3 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Email Media Desk</span>
            </a>
            <a
              href="https://wa.me/923244489159?text=Hi%20Medikart%2C%20I%20have%20a%20press%2Fpartnership%20inquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-white border-2 border-yellow-400 text-slate-950 hover:bg-yellow-50 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Inquiries</span>
            </a>
          </div>
        </section>

        {/* Key Web Links Table */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
            Canonical Reference Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <Link href="/" className="p-3 rounded-xl bg-slate-50 hover:bg-yellow-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors">
              <span>🏠 Medicine Catalog</span>
              <span className="text-slate-400">/</span>
            </Link>
            <Link href="/instant-order" className="p-3 rounded-xl bg-slate-50 hover:bg-yellow-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors">
              <span>⚡ Instant Rx Upload</span>
              <span className="text-slate-400">/instant-order</span>
            </Link>
            <Link href="/refill" className="p-3 rounded-xl bg-slate-50 hover:bg-yellow-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors">
              <span>🔄 30-Day Monthly Refill</span>
              <span className="text-slate-400">/refill</span>
            </Link>
            <Link href="/blogs" className="p-3 rounded-xl bg-slate-50 hover:bg-yellow-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors">
              <span>📰 Health &amp; Wellness Guides</span>
              <span className="text-slate-400">/blogs</span>
            </Link>
            <Link href="/faqs" className="p-3 rounded-xl bg-slate-50 hover:bg-yellow-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors">
              <span>❓ Frequently Asked Questions</span>
              <span className="text-slate-400">/faqs</span>
            </Link>
            <Link href="/about" className="p-3 rounded-xl bg-slate-50 hover:bg-yellow-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors">
              <span>ℹ️ About Medikart</span>
              <span className="text-slate-400">/about</span>
            </Link>
          </div>
        </section>

        {/* Corporate Disclosure Footer */}
        <div className="text-center text-xs text-slate-400 font-medium">
          Medikart Pakistan • A project by Banu Zahrah Pvt Ltd • Official website: medikart.pk
        </div>
      </div>
    </>
  );
}
