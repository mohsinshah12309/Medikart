import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBrands } from '../../lib/api';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';

export const metadata = {
  title: 'Pharmaceutical & Healthcare Brands in Pakistan | Medikart',
  description: 'Explore verified pharmaceutical manufacturers and OTC healthcare brands available on Medikart. Sourced from licensed partner pharmacies with nationwide Cash on Delivery.',
  alternates: {
    canonical: `${SITE_URL}/brands`,
  },
  openGraph: {
    title: 'Pharmaceutical & Healthcare Brands in Pakistan | Medikart',
    description: 'Explore verified pharmaceutical manufacturers and OTC healthcare brands on Medikart.',
    url: `${SITE_URL}/brands`,
    siteName: 'Medikart',
    locale: 'en_PK',
    type: 'website',
  },
};

export default async function BrandsDirectoryPage() {
  let brands = [];
  try {
    const res = await getBrands();
    brands = res?.data?.brands || [];
  } catch (err) {
    console.error('Failed to load brands directory:', err.message);
  }

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
    ],
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-800 transition-colors">Home</Link>
        <span>/</span>
        <span className="font-bold text-slate-900">Brands Directory</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
          <span>🏛️</span> Verified Manufacturers &amp; Brands
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
          Pharmaceutical &amp; Healthcare Brands in Pakistan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
          Medikart connects you directly with genuine medicines and healthcare essentials manufactured by Pakistan's leading cGMP-certified and DRAP-licensed pharmaceutical enterprises.
        </p>
      </div>

      {/* Brand Hubs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-400 hover:shadow-warm-card transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:border-amber-300 transition-colors">
                  {b.logo ? (
                    <Image
                      src={b.logo}
                      alt={`${b.name} logo`}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-800">{b.shortCode || b.name.slice(0, 3)}</span>
                  )}
                </div>
                {b.badge && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200">
                    {b.badge}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                  {b.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-800 group-hover:translate-x-0.5 transition-transform">
              <span>Explore Brand Products</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
