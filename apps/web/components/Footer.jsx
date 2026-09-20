"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Lock,
  CreditCard,
  Banknote,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import InteractiveLogo from "./InteractiveLogo";
import { triggerCategorySelect, scrollToCatalog } from "../lib/catalogEvents";

// SVG Brand Social Icons
function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current stroke-2`} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

/**
 * Site-Wide Medikart Footer Component
 * 
 * Features:
 *  - 4-column + Brand block layout on brand yellow (#FFEB3B / #FFF9C4)
 *  - High-contrast dark typography for optimal accessibility
 *  - Dynamic Category listing synchronized with backend API
 *  - Verified internal routes (Home, Instant Order, Blogs, Refill, About, Contact, Privacy, Terms)
 *  - Prominent red clinical disclaimer bar on white background
 *  - Official trust badges & copyright line
 */
export default function Footer({
  initialCategories = [],
  contactPhone = "+92 324 4489159",
  contactEmail = "support@medikart.pk",
  address = "Plot 12-B, Commercial Area, Phase 5 DHA, Lahore, Pakistan",
}) {
  const [categories, setCategories] = useState(initialCategories);
  const pathname = usePathname();
  const router = useRouter();

  // Load categories if not provided from server layout
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.categories && data.data.categories.length > 0) {
            setCategories(data.data.categories);
          }
        })
        .catch(() => {});
    }
  }, [initialCategories]);

  const handleCategoryClick = (catId, e) => {
    if (e) e.preventDefault();
    triggerCategorySelect(catId, true);
    scrollToCatalog();

    if (pathname !== "/") {
      router.push(`/?category=${catId}#store-catalog`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      if (catId) {
        url.searchParams.set("category", catId);
      } else {
        url.searchParams.delete("category");
      }
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    }
  };

  const handleScrollCatalog = (e) => {
    if (e) e.preventDefault();
    scrollToCatalog();
    if (pathname !== "/") {
      router.push("/#store-catalog");
    }
  };

  const cleanPhone = contactPhone ? contactPhone.replace(/[^0-9]/g, "") : "";

  // Social Profile URLs (Placeholders flagged for client confirmation)
  const socialLinks = [
    {
      name: "Facebook",
      icon: FacebookIcon,
      href: "https://facebook.com/medikartpk",
      hoverColor: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
    },
    {
      name: "Instagram",
      icon: InstagramIcon,
      href: "https://instagram.com/medikartpk",
      hoverColor: "hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]",
    },
    {
      name: "X / Twitter",
      icon: TwitterIcon,
      href: "https://twitter.com/medikartpk",
      hoverColor: "hover:bg-black hover:text-white hover:border-black",
    },
    {
      name: "YouTube",
      icon: YoutubeIcon,
      href: "https://youtube.com/@medikartpk",
      hoverColor: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
    },
  ];

  // Verified active routes for Navigate column
  const navigateLinks = [
    { label: "Home", href: "/" },
    { label: "Instant Order", href: "/instant-order", badge: "Fast" },
    { label: "Health & Medicine Blogs", href: "/blogs" },
    { label: "Prescription Refill", href: "/refill" },
    { label: "About Medikart", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];

  // Verified active routes for Support column
  const supportLinks = [
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Contact Support", href: "/contact" },
    { label: "Prescription Help", href: "/instant-order" },
    { label: "Refill Inquiries", href: "/refill" },
    { label: "FAQs", href: "/faqs" },
    { label: "Return & Refund Policy", href: "/return-refund-policy" },
  ];

  // Display up to top 7 categories in the footer column
  const displayCategories = categories && categories.length > 0 ? categories.slice(0, 7) : [];

  return (
    <footer className="w-full select-none mt-16 relative z-10">
      {/* ─────────────────────────────────────────────────────────────────────
          1. MAIN BRAND YELLOW FOOTER BLOCK (4-Column + Brand Block)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full bg-gradient-to-b from-[#FFFDE0] via-[#FFFEBB] to-[#FFF352]/90 border-t-2 border-[#F7E53B] shadow-inner py-12 sm:py-16">
        <div className="max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 text-left">
            
            {/* ─── COLUMN 1: BRAND BLOCK (lg:col-span-4) ─── */}
            <div className="lg:col-span-4 flex flex-col items-start gap-4">
              <Link href="/" aria-label="Medikart Home" className="inline-block">
                <InteractiveLogo size="md" />
              </Link>

              <p className="text-xs sm:text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                Pakistan's most trusted pharmacy delivery platform
              </p>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium max-w-sm">
                Connecting Pakistani families with licensed neighborhood pharmacies for authentic prescription medicines, clinical devices, and daily wellness delivered rapidly to your doorstep.
              </p>

              {/* Follow Us Section */}
              <div className="pt-2 flex flex-col gap-2.5 w-full">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 font-heading">
                  Follow Us
                </span>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => {
                    const IconComponent = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Follow Medikart on ${social.name}`}
                        className={`w-9 h-9 rounded-xl bg-white/95 border border-amber-300 text-slate-800 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer ${social.hoverColor}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </a>
                    );
                  })}
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chat with Medikart on WhatsApp"
                      className="w-9 h-9 rounded-xl bg-white/95 border border-amber-300 text-slate-800 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ─── COLUMN 2: CATEGORIES (lg:col-span-2) ─── */}
            <div className="lg:col-span-2 flex flex-col items-start gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 font-heading border-b-2 border-amber-400/80 pb-1 w-full">
                Categories
              </h3>
              
              <ul className="flex flex-col gap-2 w-full text-xs sm:text-sm">
                {displayCategories.map((cat) => (
                  <li key={cat._id || cat.slug}>
                    <button
                      type="button"
                      onClick={(e) => handleCategoryClick(cat._id, e)}
                      className="text-left font-semibold text-slate-800 hover:text-amber-950 hover:underline hover:translate-x-1 transition-all flex items-center gap-1.5 cursor-pointer py-0.5"
                    >
                      <span className="text-amber-600 text-[10px] font-black">›</span>
                      <span className="line-clamp-1">{cat.name}</span>
                    </button>
                  </li>
                ))}
                
                {/* Fallback if category API is loading */}
                {displayCategories.length === 0 && (
                  <>
                    <li><span className="text-slate-700 font-semibold">Prescription Medicines</span></li>
                    <li><span className="text-slate-700 font-semibold">OTC Products</span></li>
                    <li><span className="text-slate-700 font-semibold">Vitamins & Supplements</span></li>
                    <li><span className="text-slate-700 font-semibold">Baby Care</span></li>
                    <li><span className="text-slate-700 font-semibold">Personal Care</span></li>
                    <li><span className="text-slate-700 font-semibold">Health Devices</span></li>
                  </>
                )}

                <li className="pt-1">
                  <a
                    href="#store-catalog"
                    onClick={handleScrollCatalog}
                    className="inline-flex items-center gap-1 text-xs font-black text-amber-900 hover:text-slate-950 uppercase tracking-tight transition-colors cursor-pointer"
                  >
                    <span>All Categories</span>
                    <span>→</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* ─── COLUMN 3: NAVIGATE (lg:col-span-2) ─── */}
            <div className="lg:col-span-2 flex flex-col items-start gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 font-heading border-b-2 border-amber-400/80 pb-1 w-full">
                Navigate
              </h3>
              
              <ul className="flex flex-col gap-2 w-full text-xs sm:text-sm">
                {navigateLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-semibold text-slate-800 hover:text-amber-950 hover:underline hover:translate-x-1 transition-all inline-flex items-center gap-1.5 py-0.5"
                    >
                      <span className="text-amber-600 text-[10px] font-black">›</span>
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── COLUMN 4: SUPPORT (lg:col-span-2) ─── */}
            <div className="lg:col-span-2 flex flex-col items-start gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 font-heading border-b-2 border-amber-400/80 pb-1 w-full">
                Support
              </h3>
              
              <ul className="flex flex-col gap-2 w-full text-xs sm:text-sm">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-semibold text-slate-800 hover:text-amber-950 hover:underline hover:translate-x-1 transition-all inline-flex items-center gap-1.5 py-0.5"
                    >
                      <span className="text-amber-600 text-[10px] font-black">›</span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── COLUMN 5: CONTACT US (lg:col-span-2) ─── */}
            <div className="lg:col-span-2 flex flex-col items-start gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 font-heading border-b-2 border-amber-400/80 pb-1 w-full">
                Contact Us
              </h3>
              
              <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-800 font-medium">
                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{address}</span>
                </div>

                {/* Phone */}
                {contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-800 flex-shrink-0" />
                    <a
                      href={`tel:${cleanPhone}`}
                      className="font-bold text-slate-900 hover:text-amber-900 hover:underline transition-colors"
                    >
                      {contactPhone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-800 flex-shrink-0" />
                    <a
                      href={`mailto:${contactEmail}`}
                      className="font-bold text-slate-900 hover:text-amber-900 hover:underline transition-colors break-all"
                    >
                      {contactEmail}
                    </a>
                  </div>
                )}

                {/* Operating Hours */}
                <div className="flex items-center gap-2 pt-1 border-t border-amber-300/60 text-[11px] font-bold text-amber-950">
                  <Clock className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
                  <span>Mon – Sun: 24/7 Rapid Delivery</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. DISCLAIMER + COPYRIGHT BAR (White Background, Red Warning Accent)
      ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="max-w-[1600px] 2xl:max-w-[1720px] mx-auto flex flex-col gap-6">
          
          {/* Clinical & Anti-Fraud Disclaimer Box */}
          <div className="bg-red-50/70 border border-red-200/90 rounded-2xl p-4 sm:p-5 text-left shadow-2xs">
            <p className="text-xs sm:text-[13px] text-red-950 leading-relaxed font-normal">
              <strong className="text-red-700 font-black uppercase tracking-wide mr-1.5">
                Disclaimer:
              </strong>
              Medikart is a service platform that connects customers with different partner pharmacies across Pakistan to deliver medicines as fast as possible, nationwide. We are not a direct medicine manufacturer or supplier — all products are sourced and fulfilled through our verified partner pharmacies, and all medicines are authentic and genuine. Our official website is{" "}
              <strong className="text-red-900 font-bold">medikart.pk</strong>. We are not liable for orders placed through unauthorized platforms — stay vigilant against scams and report any fraudulent websites, apps, or numbers falsely claiming association with Medikart to{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-red-700 font-black underline hover:text-red-900 transition-colors"
              >
                {contactEmail}
              </a>{" "}
              immediately.
            </p>
          </div>

          {/* Bottom Copyright & Trust Badges Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {/* Copyright */}
            <div className="text-center md:text-left font-medium">
              <p>© {new Date().getFullYear()} Medikart. All rights reserved.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pakistan's licensed e-pharmacy network. Powered by authentic local pharmacies.
              </p>
            </div>

            {/* Compliance & Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                <Banknote className="w-3.5 h-3.5 text-slate-600" />
                <span>Cash on Delivery</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                <span>Debit / Credit Card</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
