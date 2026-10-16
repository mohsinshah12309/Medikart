import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getBrand, getBrands } from '../../../lib/api';
import ProductCard from '../../../components/ProductCard';
import { getPriorityLandingPage, getAllPriorityLandingSlugs } from '../../../data/priorityLandingPagesData';
import { ShieldCheck, Truck, Clock, AlertTriangle, MessageCircle, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
const ITEMS_PER_PAGE = 24;

export async function generateStaticParams() {
  try {
    const res = await getBrands();
    const brands = res?.data?.brands || [];
    if (brands.length > 0) {
      return brands.map((b) => ({ slug: b.slug }));
    }
  } catch {}
  return getAllPriorityLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPage = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  const priority = getPriorityLandingPage(slug);
  if (priority && currentPage === 1) {
    return {
      title: { absolute: priority.metaTitle },
      description: priority.metaDescription,
      alternates: {
        canonical: `${SITE_URL}/brands/${slug}`,
      },
      openGraph: {
        title: priority.metaTitle,
        description: priority.metaDescription,
        url: `${SITE_URL}/brands/${slug}`,
        siteName: 'Medikart',
        locale: 'en_PK',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: priority.metaTitle,
        description: priority.metaDescription,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
    };
  }

  try {
    const res = await getBrand(slug, { page: currentPage, limit: ITEMS_PER_PAGE });
    const brand = res?.data?.brand;
    if (!brand) {
      return {
        title: 'Brand | Medikart',
        robots: { index: false, follow: false },
      };
    }

    const pageSuffix = currentPage > 1 ? ` (Page ${currentPage})` : '';
    const title = `${brand.name} Products & Price in Pakistan${pageSuffix} | Medikart`;
    const description = `Buy authentic ${brand.name} healthcare products & medicines online in Pakistan. Verified partner pharmacy stock, genuine quality, and nationwide Cash on Delivery.`;

    const canonicalUrl = currentPage > 1
      ? `${SITE_URL}/brands/${slug}?page=${currentPage}`
      : `${SITE_URL}/brands/${slug}`;

    return {
      title: { absolute: title },
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Medikart',
        locale: 'en_PK',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
    };
  } catch {
    return {
      title: 'Brand | Medikart',
      robots: { index: false, follow: true },
    };
  }
}

export default async function BrandHubPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPage = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  let brand = null;
  let products = [];
  let total = 0;
  let totalPages = 1;

  try {
    const res = await getBrand(slug, { page: currentPage, limit: ITEMS_PER_PAGE });
    if (res?.data) {
      brand = res.data.brand;
      products = res.data.products || [];
      total = res.data.total || products.length;
      totalPages = res.data.totalPages || 1;
    }
  } catch (err) {
    console.error(`Failed to load brand hub for ${slug}:`, err.message);
  }

  const priority = getPriorityLandingPage(slug);

  if (!brand) {
    if (priority) {
      brand = {
        name: priority.name,
        slug: priority.slug,
        description: priority.whatItIs,
        badge: 'Verified OTC',
      };
    } else {
      notFound();
    }
  }

  // Schema.org Breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Brands',
        item: `${SITE_URL}/brands`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: brand.name,
        item: `${SITE_URL}/brands/${slug}`,
      },
    ],
  };

  // Schema.org CollectionPage
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: priority ? priority.h1 : `${brand.name} Healthcare Products in Pakistan`,
    description: priority ? priority.metaDescription : brand.description,
    url: `${SITE_URL}/brands/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_URL}/products/${p.slug || p._id}`,
        name: p.name,
      })),
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-800 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/brands" className="hover:text-amber-800 transition-colors">Brands</Link>
        <span>/</span>
        <span className="font-bold text-slate-900">{brand.name}</span>
      </nav>

      {/* ─── PRIORITY OTC BRAND FAMILY LANDING HERO (Model: Panadol) ─── */}
      {priority ? (
        <section aria-label={`${priority.name} Overview`} className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50/60 to-white p-6 sm:p-8 rounded-3xl border border-amber-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Verified OTC Healthcare Essential • {priority.manufacturer}</span>
              </span>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Draft: {priority.editorialDraftNote}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                {priority.h1}
              </h1>

              {/* 40 to 60 word answer-first direct summary */}
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-semibold max-w-4xl bg-white/70 p-4 rounded-2xl border border-amber-200/60 shadow-3xs">
                {priority.answerFirstSummary}
              </p>
            </div>

            {/* Factual Delivery Section naming Lahore and confirmed express cities */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-950">
                    Doorstep Delivery in Lahore &amp; Express Cities
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {priority.deliveryFacts.shippingFee}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 font-bold block mb-0.5">Lahore Express Delivery</span>
                  <span className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{priority.deliveryFacts.expressTime}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Covering all major Lahore residential &amp; commercial sectors.</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 font-bold block mb-0.5">Karachi, Islamabad &amp; Rawalpindi</span>
                  <span className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{priority.deliveryFacts.expressTime}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Fulfilled via verified licensed partner pharmacies.</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 font-bold block mb-0.5">Nationwide Courier</span>
                  <span className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>{priority.deliveryFacts.nationwideTime}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Available across all Pakistani cities with Cash on Delivery.</span>
                </div>
              </div>

              {/* Prominent WhatsApp Quick Order Button */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-600 font-medium">
                  Need rapid confirmation or bulk household packs? Order directly via our certified pharmacy desk.
                </p>
                <a
                  href={`https://wa.me/923244489159?text=${encodeURIComponent(priority.deliveryFacts.whatsappPrefilledText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-black shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ─── STANDARD MANUFACTURER BRAND HUB HEADER ─── */
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 p-2.5 flex items-center justify-center shrink-0 relative overflow-hidden shadow-2xs">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} official manufacturer logo`}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                    priority
                  />
                ) : (
                  <span className="text-base font-black text-slate-800">{brand.shortCode || brand.name.slice(0, 3)}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {brand.name}
                  </h1>
                  {brand.badge && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {brand.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                  {brand.description}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-100">
              <span className="text-2xl sm:text-3xl font-black text-amber-900">{total}</span>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Catalog Products</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-700">Explore in Categories:</span>
            <Link
              href="/categories/medicines"
              className="px-3 py-1 rounded-full bg-white hover:bg-yellow-100 border border-amber-200 text-slate-800 font-medium transition-colors"
            >
              All Medicines
            </Link>
            <Link
              href="/categories/otc"
              className="px-3 py-1 rounded-full bg-white hover:bg-yellow-100 border border-amber-200 text-slate-800 font-medium transition-colors"
            >
              OTC Health
            </Link>
            <Link
              href="/categories/vitamins"
              className="px-3 py-1 rounded-full bg-white hover:bg-yellow-100 border border-amber-200 text-slate-800 font-medium transition-colors"
            >
              Vitamins &amp; Supplements
            </Link>
            <Link
              href="/medicines-a-z/a"
              className="px-3 py-1 rounded-full bg-white hover:bg-yellow-100 border border-amber-200 text-slate-800 font-medium transition-colors"
            >
              A-Z Directory
            </Link>
          </div>
        </div>
      )}

      {/* ─── CATALOG PRODUCTS LISTING (Only products that exist in our catalog with real prices and stock) ─── */}
      <section aria-label={`${brand.name} Catalog Products`} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Available {brand.name} Formulations in Stock {total > 0 && <span className="text-sm font-normal text-slate-500">({total})</span>}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <p className="text-base font-bold text-slate-700">No products found for {brand.name}.</p>
            <p className="text-xs text-slate-500">
              Need a specific {brand.name} item? Upload your doctor slip via{' '}
              <Link href="/instant-order" className="text-amber-800 font-bold underline">
                Instant Order
              </Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {products.map((prod) => (
              <ProductCard key={prod._id || prod.slug} product={prod} />
            ))}
          </div>
        )}

        {/* Server-Rendered Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Brand Hub Pagination" className="pt-8 flex items-center justify-center gap-2 flex-wrap">
            {currentPage > 1 && (
              <Link
                href={`/brands/${slug}?page=${currentPage - 1}`}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl transition-colors"
                aria-label="Previous page"
              >
                ← Previous
              </Link>
            )}

            {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
              let pageNumber = idx + 1;
              if (totalPages > 7) {
                if (currentPage > 4) {
                  pageNumber = currentPage - 3 + idx;
                }
                if (pageNumber > totalPages) return null;
              }

              const isCurrent = pageNumber === currentPage;
              return (
                <Link
                  key={pageNumber}
                  href={`/brands/${slug}?page=${pageNumber}`}
                  className={`w-9 h-9 flex items-center justify-center text-xs sm:text-sm font-black rounded-xl transition-colors ${
                    isCurrent
                      ? 'bg-yellow-400 text-slate-950 border-2 border-yellow-500 shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-yellow-50'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {pageNumber}
                </Link>
              );
            })}

            {currentPage < totalPages && (
              <Link
                href={`/brands/${slug}?page=${currentPage + 1}`}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl transition-colors"
                aria-label="Next page"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </section>

      {/* ─── EDUCATIONAL & CLINICAL SAFETY SECTIONS (Unique, useful copy; NO dosage numbers; DRAP compliant) ─── */}
      {priority && (
        <section aria-label={`${priority.name} Consumer Guidance`} className="space-y-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What It Is */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 space-y-3">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>What is {priority.name}?</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {priority.whatItIs}
              </p>
            </div>

            {/* What to Check on the Label */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 space-y-3">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>What to Check on the Label (Authenticity Verification)</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {priority.whatToCheckOnLabel.map((check, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black shrink-0">✓</span>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Available Pack Types in Pakistan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <span>Available {priority.name} Pack Types &amp; Strengths</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {priority.availablePacks.map((pack, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <h4 className="text-xs font-black text-slate-900">{pack.name}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{pack.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* When to See a Doctor */}
          <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200/80 space-y-3">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <span>When to Consult a Physician</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 font-medium">
              {priority.whenToSeeDoctor.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                  <span className="text-amber-800 font-black shrink-0">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pharmacist Safety Advisory (Strictly No Dosages; Direct to Label) */}
          <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200/80 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
              <span>⚠️ Clinical Safety &amp; Dosage Disclaimer</span>
            </h3>
            <p className="text-xs text-red-950 leading-relaxed font-medium">
              {priority.pharmacistWarning}
            </p>
          </div>

          {/* Contextual Cluster Interlinking */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black text-slate-900">
                Related OTC Brands &amp; Health Categories
              </h3>
              <Link href="/brands" className="text-xs font-bold text-amber-800 hover:underline">
                View All Brands →
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/categories/otc"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 font-bold text-slate-800 transition-colors"
              >
                Category: Over-The-Counter (OTC)
              </Link>
              <Link
                href="/categories/medicines"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 font-bold text-slate-800 transition-colors"
              >
                Category: Essential Medicines
              </Link>
              {priority.relatedBrands.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/brands/${rel.slug}`}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 font-bold text-slate-800 transition-colors"
                >
                  Brand: {rel.name}
                </Link>
              ))}
              <Link
                href="/medicines-a-z/p"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 font-bold text-slate-800 transition-colors"
              >
                Medicines A-Z Index (Letter P)
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
