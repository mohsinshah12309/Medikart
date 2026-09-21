"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContent, getProducts, getCategories } from '../../lib/api';

export default function AboutPage() {
  const [content, setContent] = useState(null);
  const [totalProducts, setTotalProducts] = useState(6612);
  const [totalCategories, setTotalCategories] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentRes, productsRes, categoriesRes] = await Promise.allSettled([
          getContent(),
          getProducts({ limit: 1 }),
          getCategories(),
        ]);

        if (contentRes.status === "fulfilled" && contentRes.value?.data) {
          setContent(contentRes.value.data);
        }

        if (productsRes.status === "fulfilled" && productsRes.value) {
          const count = productsRes.value.pagination?.total || productsRes.value.total;
          if (count && count > 0) {
            setTotalProducts(count);
          }
        }

        if (categoriesRes.status === "fulfilled" && categoriesRes.value?.data?.categories) {
          const catCount = categoriesRes.value.data.categories.length;
          if (catCount > 0) {
            setTotalCategories(catCount);
          }
        }
      } catch (err) {
        console.error("Failed to load about page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const defaultText = "Welcome to Medikart, Pakistan's trusted digital pharmacy network and healthcare delivery platform. We are committed to solving medicine accessibility by providing 100% authentic prescription medicines, OTC remedies, mother & baby essentials, and healthcare supplies delivered safely to your doorstep.\n\nEvery medication on Medikart is sourced from licensed pharmaceutical distributors and partner retail pharmacies. Orders are reviewed and fulfilled with care and strict adherence to medicine safety standards.";

  const formattedProductCount = totalProducts.toLocaleString();

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-16 px-4 sm:px-6">
      {/* Hero Header Card - Yellow Dominant */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF352] via-[#FFF866] to-[#FFE51A] rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-[#F7E53B]">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-300/30 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-[#FFF352] w-fit shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFF352] animate-pulse shadow-[0_0_8px_#fff352]" />
            Licensed Partner Pharmacy Network
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Authentic Healthcare, Delivered With Care.
          </h1>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
            Medikart connects customers with verified partner pharmacies dedicated to authentic medicines, clinical safety, and nationwide accessibility.
          </p>
        </div>
      </div>

      {/* Dynamic Key Metrics - Yellow & White Theme (Cities Removed) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 bg-white rounded-3xl border-2 border-yellow-400 shadow-md flex flex-col justify-center items-center text-center hover:bg-yellow-50/50 transition-all">
          <span className="text-3xl sm:text-4xl font-black text-slate-950 block">
            {loading ? "6,600+" : `${formattedProductCount}+`}
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-900 mt-1 uppercase tracking-wider">
            Verified Products
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5">Live Catalog Total</span>
        </div>

        <div className="p-6 bg-yellow-400 rounded-3xl border-2 border-yellow-500/60 shadow-md flex flex-col justify-center items-center text-center hover:bg-yellow-300 transition-all">
          <span className="text-3xl sm:text-4xl font-black text-slate-950 block">
            100%
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-950 mt-1 uppercase tracking-wider">
            Authentic Meds
          </span>
          <span className="text-[11px] text-slate-900 font-bold mt-0.5">Genuine &amp; Sealed</span>
        </div>

        <div className="p-6 bg-white rounded-3xl border-2 border-yellow-400 shadow-md flex flex-col justify-center items-center text-center hover:bg-yellow-50/50 transition-all">
          <span className="text-3xl sm:text-4xl font-black text-slate-950 block">
            {totalCategories}+
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-900 mt-1 uppercase tracking-wider">
            Health Categories
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5">From Rx to Mother & Baby</span>
        </div>

        <div className="p-6 bg-yellow-400 rounded-3xl border-2 border-yellow-500/60 shadow-md flex flex-col justify-center items-center text-center hover:bg-yellow-300 transition-all">
          <span className="text-3xl sm:text-4xl font-black text-slate-950 block">
            24/7
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-950 mt-1 uppercase tracking-wider">
            Clinical Support
          </span>
          <span className="text-[11px] text-slate-900 font-bold mt-0.5">AI & Pharmacist Help</span>
        </div>
      </div>

      {/* Main Narrative & Story Card */}
      <div className="bg-white rounded-3xl border-2 border-yellow-300/80 shadow-xl p-6 sm:p-10 md:p-12 flex flex-col gap-10 relative overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700">Loading pharmacy details...</p>
          </div>
        ) : (
          <>
            {/* Mission Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-yellow-400 text-slate-950 rounded-2xl text-xl font-bold shadow-xs">🏥</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Our Mission & Operational Framework
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Setting the gold standard for clinical safety and e-pharmacy integrity in Pakistan
                  </p>
                </div>
              </div>
              <div className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line font-normal mt-2">
                {content?.aboutText || defaultText}
              </div>
            </div>

            {/* Core Quality Commitments Grid */}
            <div className="border-t-2 border-yellow-100 pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Trust & Integrity
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Core Clinical Guarantees
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-yellow-50/70 border-2 border-yellow-200 rounded-2xl flex flex-col gap-3 transition-all hover:border-yellow-400 hover:shadow-md hover:bg-yellow-50">
                  <span className="text-3xl">🔬</span>
                  <h4 className="font-black text-base text-slate-950">100% Genuine Sourcing</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Zero counterfeit tolerance. All items procured through licensed pharmaceutical distributors and partner pharmacies.
                  </p>
                </div>

                <div className="p-6 bg-yellow-50/70 border-2 border-yellow-200 rounded-2xl flex flex-col gap-3 transition-all hover:border-yellow-400 hover:shadow-md hover:bg-yellow-50">
                  <span className="text-3xl">❄️</span>
                  <h4 className="font-black text-base text-slate-950">Cold-Chain Storage</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Dedicated 2°C - 8°C temperature-monitored refrigeration for vaccines, insulin, and biological products.
                  </p>
                </div>

                <div className="p-6 bg-yellow-50/70 border-2 border-yellow-200 rounded-2xl flex flex-col gap-3 transition-all hover:border-yellow-400 hover:shadow-md hover:bg-yellow-50">
                  <span className="text-3xl">🩺</span>
                  <h4 className="font-black text-base text-slate-950">Registered Pharmacists</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Qualified pharmacists review prescription orders, verify dosages, and ensure patient safety before shipping.
                  </p>
                </div>

                <div className="p-6 bg-yellow-50/70 border-2 border-yellow-200 rounded-2xl flex flex-col gap-3 transition-all hover:border-yellow-400 hover:shadow-md hover:bg-yellow-50">
                  <span className="text-3xl">📦</span>
                  <h4 className="font-black text-base text-slate-950">Tamper-Evident Packs</h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Heavy-duty sealed security envelopes and opaque packaging ensuring complete privacy and hygiene.
                  </p>
                </div>
              </div>
            </div>

            {/* Quality & Safety Standards Table */}
            <div className="border-t-2 border-yellow-100 pt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Quality Matrix
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Medikart Quality & Safety Benchmarks
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Our operational protocol and quality benchmarks in Pakistan.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-yellow-300 shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-yellow-400 text-slate-950 border-b-2 border-yellow-500">
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Operational Parameter</th>
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Medikart Standard</th>
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Verification Protocol</th>
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Quality Alignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-100 bg-white">
                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950 flex items-center gap-2">
                        <span>🏷️</span> Medicine Procurement
                      </td>
                      <td className="py-3.5 px-5 text-slate-800 font-semibold">100% Direct from Licensed Distributors &amp; Partner Pharmacies</td>
                      <td className="py-3.5 px-5 text-slate-600">Batch number, expiry validation, and genuine packaging match</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          Verified Sourcing
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950 flex items-center gap-2">
                        <span>❄️</span> Cold Chain Storage
                      </td>
                      <td className="py-3.5 px-5 text-slate-800 font-semibold">2°C – 8°C Monitored Refrigeration with 24/7 Power Redundancy</td>
                      <td className="py-3.5 px-5 text-slate-600">Digital temperature loggers + insulated thermal packs during dispatch</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          WHO Good Storage
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950 flex items-center gap-2">
                        <span>📋</span> Prescription Verification
                      </td>
                      <td className="py-3.5 px-5 text-slate-800 font-semibold">Mandatory Review by Registered Pharmacist (PharmD / B.Pharm)</td>
                      <td className="py-3.5 px-5 text-slate-600">Doctor PMDC/PMC credential cross-check & dosage check</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          Pharmacy Act 1967
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950 flex items-center gap-2">
                        <span>🔒</span> Narcotics & Controlled Drugs
                      </td>
                      <td className="py-3.5 px-5 text-slate-800 font-semibold">Strict Multi-Stage Verification & Physical Prescription Surrender</td>
                      <td className="py-3.5 px-5 text-slate-600">CNIC logging + original doctor prescription collected at delivery</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Control of Narcotics Act
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950 flex items-center gap-2">
                        <span>🛡️</span> Data Privacy & Records
                      </td>
                      <td className="py-3.5 px-5 text-slate-800 font-semibold">AES-256 GCM Encrypted Medical Data & HIPAA-Compliant Architecture</td>
                      <td className="py-3.5 px-5 text-slate-600">Zero plain-text banking or prescription leak; strict staff RBAC</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                          PECA / Data Shield
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Types & Fulfillment Matrix Table */}
            <div className="border-t-2 border-yellow-100 pt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Service Framework
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Order Types & Delivery Matrix
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  How your healthcare and prescription orders are processed and verified.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-yellow-300 shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-yellow-400 text-slate-950 border-b-2 border-yellow-500">
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Service Mode</th>
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Scope of Products</th>
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Pharmacist Action</th>
                      <th className="py-4 px-5 font-black uppercase text-xs tracking-wider">Payment Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-100 bg-white">
                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-yellow-200 rounded-lg text-xs">🛒</span>
                          <span>Standard Catalog Order</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">OTC medicines, vitamins, supplements, personal care & wellness</td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">Batch inspection & sealed tamper packaging</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">Cash on Delivery (COD) / Online Card</td>
                    </tr>

                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-yellow-200 rounded-lg text-xs">📸</span>
                          <span>Instant Rx Upload</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">Doctor prescription slips, hospital discharge lists, rare formulations</td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">Pharmacist reviews Rx, items priced & custom invoice sent to patient</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">Cash on Delivery (COD) / Bank Transfer</td>
                    </tr>

                    <tr className="hover:bg-yellow-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-950">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-yellow-200 rounded-lg text-xs">⚠️</span>
                          <span>Narcotics & Schedule G</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">Controlled sedatives, clinical tranquilizers, oncology pain meds</td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">Dual pharmacist sign-off, patient ID check, physical Rx collection</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">Pre-verified COD / Card</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Navigation Bar - Yellow/White High Contrast */}
            <div className="border-t-2 border-yellow-200 pt-8 flex flex-wrap items-center justify-between gap-4 bg-yellow-50/80 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 md:-mx-12 md:-mb-12 p-6 sm:p-10 rounded-b-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-3.5 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] border-2 border-yellow-500 flex items-center gap-2"
                >
                  <span>💊</span>
                  <span>Explore {formattedProductCount}+ Products</span>
                </Link>
                <Link
                  href="/instant-order"
                  className="px-6 py-3.5 bg-white hover:bg-yellow-100 text-slate-950 font-bold text-sm rounded-2xl transition-all border-2 border-yellow-400 shadow-sm flex items-center gap-2"
                >
                  <span>📄</span>
                  <span>Upload Doctor Prescription</span>
                </Link>
              </div>

              <Link
                href="/contact"
                className="text-sm font-extrabold text-slate-900 hover:text-amber-700 transition-colors flex items-center gap-1.5"
              >
                <span>Have questions or bulk inquiries? Contact us</span>
                <span className="text-base">→</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

