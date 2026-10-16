import React from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

// 12 Authentic, High-Demand Over-The-Counter & Wellness Essentials in Pakistan
// 100% compliant with DRAP pharmaceutical advertising regulations (No Rx, No Controlled Substances)
const POPULAR_OTC_STAPLES = [
  {
    _id: 'pop-1',
    name: 'Panadol CF Cold & Flu Tablets (100 Tablets)',
    slug: 'panadol-cf-cold-flu-tablets-100-tablets',
    price: 490,
    effectivePrice: 490,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/panadol-cf-cold-flu-tablets-100-tablets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-2',
    name: 'Panadol 500mg Tablets (200 Tablets)',
    slug: 'panadol-500mg-tablets-200-tablets',
    price: 680,
    effectivePrice: 680,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/panadol-500mg-tablets-200-tablets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-3',
    name: 'Disprin 300mg Soluble Tablets (100 Tablets)',
    slug: 'disprin-300mg-soluble-tablets-100-tablets',
    price: 240,
    effectivePrice: 240,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/disprin-300mg-soluble-tablets-100-tablets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-4',
    name: 'Surbex Z High Potency Vitamin B-Complex with Zinc (30 Tablets)',
    slug: 'surbex-z-high-potency-vitamin-b-complex-with-zinc-30-tablets',
    price: 620,
    effectivePrice: 620,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/surbex-z-high-potency-vitamin-b-complex-with-zinc-30-tablets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-5',
    name: 'CaC 1000 Plus Orange Effervescent Tablets (20 Tablets)',
    slug: 'cac-1000-plus-orange-effervescent-tablets-20-tablets',
    price: 540,
    effectivePrice: 540,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/cac-1000-plus-orange-effervescent-tablets-20-tablets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-6',
    name: 'Centrum Silver Tab 30S',
    slug: 'centrum-silver-tab-30s',
    price: 2000,
    effectivePrice: 2000,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/centrum-silver-tab-30s.webp', isPrimary: true }],
  },
  {
    _id: 'pop-7',
    name: 'Calpol 120mg/5ml Pediatric Suspension (60ml)',
    slug: 'calpol-120mg5ml-pediatric-suspension-60ml',
    price: 135,
    effectivePrice: 135,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/calpol-120mg5ml-pediatric-suspension-60ml.webp', isPrimary: true }],
  },
  {
    _id: 'pop-8',
    name: 'Brufen 400mg Tablets (30 Tablets)',
    slug: 'brufen-400mg-tablets-30-tablets',
    price: 360,
    effectivePrice: 360,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/brufen-400mg-tablets-30-tablets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-9',
    name: 'Hydralyte Oral Rehydration Salts (ORS) Lemon (20 Sachets)',
    slug: 'hydralyte-oral-rehydration-salts-ors-lemon-20-sachets',
    price: 320,
    effectivePrice: 320,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/hydralyte-oral-rehydration-salts-ors-lemon-20-sachets.webp', isPrimary: true }],
  },
  {
    _id: 'pop-10',
    name: 'Dettol Antiseptic Disinfectant Liquid (250ml)',
    slug: 'dettol-antiseptic-disinfectant-liquid-250ml',
    price: 490,
    effectivePrice: 490,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/dettol-antiseptic-disinfectant-liquid-250ml.webp', isPrimary: true }],
  },
  {
    _id: 'pop-11',
    name: 'Sensodyne Extra Whitening (70G) Tp',
    slug: 'sensodyne-extra-whitening-70g-tp',
    price: 360,
    effectivePrice: 360,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/sensodyne-extra-whitening-70g-tp.webp', isPrimary: true }],
  },
  {
    _id: 'pop-12',
    name: 'Strepsils Orange with Vitamin C (24 Lozenges)',
    slug: 'strepsils-orange-with-vitamin-c-24-lozenges',
    price: 330,
    effectivePrice: 330,
    stockStatus: 'in_stock',
    requiresPrescription: false,
    images: [{ path: '/images/products/strepsils-orange-with-vitamin-c-24-lozenges.webp', isPrimary: true }],
  },
];

export default function PopularProductsSection({ products = POPULAR_OTC_STAPLES }) {
  const displayProducts = products && products.length > 0 ? products : POPULAR_OTC_STAPLES;

  return (
    <section aria-label="Popular Over-The-Counter Healthcare Products" className="space-y-4 my-6 sm:my-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400/30 text-amber-800 font-black text-xs">
              ⚡
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Popular OTC &amp; Daily Healthcare Essentials
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Frequently ordered authentic pain relief, vitamins, pediatric care, and first-aid staples
          </p>
        </div>

        <Link
          href="/categories/otc"
          className="text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-colors self-start sm:self-auto shrink-0"
        >
          VIEW ALL OTC HEALTH →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayProducts.map((prod) => (
          <ProductCard key={prod._id || prod.slug} product={prod} />
        ))}
      </div>
    </section>
  );
}
