import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getMedicinesByLetter } from '../../../lib/api';

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
const LETTERS = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0-9'
];

export async function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({ params, searchParams }) {
  const { letter } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPage = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  const displayLetter = letter.toUpperCase();
  const pageSuffix = currentPage > 1 ? ` (Page ${currentPage})` : '';
  const title = `Medicines Starting with "${displayLetter}"${pageSuffix} | Medikart A-Z Index`;
  const description = `Browse all DRAP-registered prescription and OTC medicines starting with "${displayLetter}" on Medikart Pakistan. Compare prices, check availability, and order with Cash on Delivery nationwide.`;

  const canonicalUrl = currentPage > 1
    ? `${SITE_URL}/medicines-a-z/${letter}?page=${currentPage}`
    : `${SITE_URL}/medicines-a-z/${letter}`;

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
}

export default async function MedicineAZLetterPage({ params, searchParams }) {
  const { letter } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPage = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  const normalizedLetter = (letter || 'a').toLowerCase();
  if (!LETTERS.includes(normalizedLetter)) {
    notFound();
  }

  let products = [];
  let total = 0;
  let totalPages = 1;

  try {
    const res = await getMedicinesByLetter(normalizedLetter, {
      page: currentPage,
      limit: 200,
    });
    if (res?.data) {
      products = res.data.products || [];
      total = res.data.total || products.length;
      totalPages = res.data.totalPages || 1;
    }
  } catch (err) {
    console.error(`Failed to fetch medicines for letter ${normalizedLetter}:`, err.message);
  }

  const displayLetter = normalizedLetter.toUpperCase();

  // Breadcrumbs Schema
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
        name: 'Medicines A-Z Index',
        item: `${SITE_URL}/medicines-a-z/a`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Letter ${displayLetter}`,
        item: `${SITE_URL}/medicines-a-z/${normalizedLetter}`,
      },
    ],
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-800 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/medicines-a-z/a" className="hover:text-amber-800 transition-colors">Medicines A-Z</Link>
        <span>/</span>
        <span className="font-bold text-slate-900">Letter {displayLetter}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-2">
              <span>📚</span> A-Z Medicine Directory
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              Medicines Starting with "{displayLetter}"
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-medium">
              Authentic prescription pharmaceuticals and essential over-the-counter medicines sourced through verified partner retail pharmacies across Pakistan.
            </p>
          </div>
          <div className="text-right sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">{total}</span>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Products Listed</span>
          </div>
        </div>
      </div>

      {/* A-Z Letter Navigation Bar */}
      <nav aria-label="A-Z Alphabet Navigation" className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-3xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Browse by Letter:</span>
          <span className="text-xs font-bold text-amber-800">Showing {displayLetter}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {LETTERS.map((ltr) => {
            const isActive = ltr === normalizedLetter;
            return (
              <Link
                key={ltr}
                href={`/medicines-a-z/${ltr}`}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all ${
                  isActive
                    ? 'bg-yellow-400 text-slate-950 border-2 border-yellow-500 shadow-xs font-black scale-105'
                    : 'bg-slate-50 text-slate-700 hover:bg-yellow-50 hover:text-slate-950 border border-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={`Medicines starting with ${ltr.toUpperCase()}`}
              >
                {ltr.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Products Directory Grid */}
      <section aria-label={`Products starting with ${displayLetter}`} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Directory Listing — Page {currentPage} of {totalPages}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Showing {products.length} of {total} products
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <p className="text-base font-bold text-slate-700">No products found starting with "{displayLetter}".</p>
            <p className="text-xs text-slate-500">
              Need a medicine not listed? Upload your prescription slip via{' '}
              <Link href="/instant-order" className="text-amber-800 font-bold underline">
                Instant Order
              </Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((prod) => {
              const isOutOfStock = prod.stockStatus === 'out_of_stock';
              const priceFormatted = typeof prod.effectivePrice === 'number'
                ? prod.effectivePrice.toFixed(2)
                : (prod.price ? prod.price.toFixed(2) : '0.00');

              return (
                <Link
                  key={prod._id || prod.slug}
                  href={`/products/${prod.slug || prod._id}`}
                  className="group bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-warm-card transition-all flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                        {prod.name}
                      </h3>
                      {prod.requiresPrescription && (
                        <span className="shrink-0 text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          Rx
                        </span>
                      )}
                    </div>
                    {prod.genericName && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                        {prod.genericName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      Rs. {priceFormatted}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOutOfStock
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Server-Rendered Pagination */}
        {totalPages > 1 && (
          <nav aria-label="A-Z Index Pagination" className="pt-8 flex items-center justify-center gap-2 flex-wrap">
            {currentPage > 1 && (
              <Link
                href={`/medicines-a-z/${normalizedLetter}?page=${currentPage - 1}`}
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
                  href={`/medicines-a-z/${normalizedLetter}?page=${pageNumber}`}
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
                href={`/medicines-a-z/${normalizedLetter}?page=${currentPage + 1}`}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl transition-colors"
                aria-label="Next page"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
