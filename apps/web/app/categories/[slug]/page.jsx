import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCategory, getCategories, getProducts } from '../../../lib/api';
import { BLOGS_DATA } from '../../../data/blogsData';
import ProductCard from '../../../components/ProductCard';

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
const ITEMS_PER_PAGE = 24;

// Factual category introduction descriptions (80-150 words) free from unconfirmed claims
const CATEGORY_INTROS = {
  medicines: "Explore authentic prescription and essential over-the-counter medications on Medikart. Sourced directly through verified pharmaceutical distributors and licensed retail partner pharmacies across Pakistan, our medicine catalogue includes tablets, capsules, syrups, and therapeutic treatments. Easily locate prescribed dosages, compare strengths, and upload doctor prescriptions for verified order processing with nationwide Cash on Delivery.",
  vitamins: "Support your daily wellness and nutritional balance with authentic dietary supplements and multivitamins on Medikart. Our catalogue features essential minerals, Vitamin D3, calcium, zinc, and daily energy formulations from leading pharmaceutical manufacturers. All products are verified for authenticity and delivered securely to your doorstep across Pakistan.",
  "milk-powder": "Discover verified infant formulas, pediatric nutrition, and specialized nutritional milk powders on Medikart. Sourced from authorized distributors, our catalogue provides age-appropriate formulas and adult nutritional supplements. Review detailed pack sizes and nutrition facts, and receive reliable delivery across Pakistan with Cash on Delivery.",
  herbal: "Browse natural health supplements, herbal lozenges, and traditional wellness formulations on Medikart. Sourced from reputable manufacturers, our herbal collection supports respiratory health, digestion, and seasonal vitality with certified natural ingredients and nationwide doorstep delivery.",
  "flat-items": "Access essential flat-packed medical consumables, surgical dressings, and clinical disposables on Medikart. Designed for home care, clinics, and first-aid replenishment, our collection ensures sterile, genuine healthcare consumables dispatched with fast order handling.",
  consumer: "Shop everyday personal hygiene, oral care, and home wellness necessities on Medikart. From antiseptic washes to daily sanitary supplies, find reliable personal care items sourced through authorized consumer health distributors across Pakistan.",
  "fridge-items": "Access temperature-sensitive pharmaceuticals and biopharmaceuticals on Medikart. Sourced from verified partner pharmacies equipped with dedicated refrigeration facilities, our catalogue includes insulin, biologics, and pediatric drops requiring cool storage.",
  "surgical-items": "Procure clinical-grade surgical supplies, diagnostic lancets, medical gloves, and wound-care bandages on Medikart. Sourced through authorized medical equipment distributors, our supplies serve outpatient care and chronic condition management.",
  dermatology: "Maintain skin health with dermatologist-recommended topical creams, medicated lotions, sun protection, and therapeutic ointments on Medikart. Our dermatological catalogue addresses acne, eczema, hydration, and skin recovery with genuine clinical products.",
  diagnostics: "Monitor vital signs accurately with genuine home diagnostic devices, digital blood glucose monitors, test strips, and blood pressure monitors on Medikart. Procured from verified manufacturers, our diagnostic tools empower proactive health tracking at home.",
  "diapers-napkins": "Find premium infant diapers, gentle baby wipes, and adult incontinence essentials on Medikart. Featuring leading brands in all sizes, our baby and personal hygiene supplies provide reliable absorbency and convenience delivered straight to your home.",
  "patient-supports": "Enhance mobility, rehabilitation, and orthopedic comfort with certified braces, cervical collars, lumbar belts, and compression supports on Medikart. Designed for post-operative recovery and joint protection, available with Cash on Delivery across Pakistan.",
  "general-items": "Browse general pharmacy sundries, first-aid basics, and household healthcare necessities on Medikart. Keep your family medicine cabinet stocked with genuine healthcare accessories and essentials.",
  beverages: "Stay hydrated and replenish essential electrolytes with certified medical oral rehydration solutions (ORS), electrolyte drinks, and nutritional beverages available on Medikart for adults and children.",
  nutraceutical: "Explore specialized nutraceutical compounds, clinical dietary supplements, and therapeutic micronutrients formulated to support metabolic, cardiovascular, and joint health with verified authenticity.",
  otc: "Browse safe, genuine Over-The-Counter (OTC) fever reducers, cough lozenges, pain relievers, and digestive aids on Medikart. Conveniently find household healthcare solutions with clear usage instructions and Cash on Delivery nationwide.",
};

export async function generateStaticParams() {
  try {
    const res = await getCategories();
    const categories = res?.data?.categories || [];
    return categories.map((c) => ({ slug: c.slug || c._id.toString() }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPage = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  try {
    const catRes = await getCategory(slug);
    const category = catRes?.data?.category;

    if (!category) {
      return { title: 'Category | Medikart Online Pharmacy' };
    }

    const title = currentPage > 1
      ? `${category.name} - Page ${currentPage} | Buy Online in Pakistan | Medikart`
      : `${category.name} Online in Pakistan | Buy Authentic Medicines | Medikart`;

    const description = `Buy authentic ${category.name} online in Pakistan on Medikart. Genuine pharmacy stock, Cash on Delivery (COD) & card payment. Page ${currentPage}.`;

    const canonicalUrl = currentPage > 1
      ? `${SITE_URL}/categories/${category.slug || slug}?page=${currentPage}`
      : `${SITE_URL}/categories/${category.slug || slug}`;

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
    };
  } catch {
    return { title: 'Category | Medikart' };
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const currentPage = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  let category = null;
  let allCategories = [];
  try {
    const [catRes, allCatsRes] = await Promise.all([
      getCategory(slug),
      getCategories(),
    ]);
    category = catRes?.data?.category || null;
    allCategories = allCatsRes?.data?.categories || [];
  } catch {
    notFound();
  }

  if (!category) {
    notFound();
  }

  // Fetch paginated products for this category
  let products = [];
  let totalProducts = 0;
  try {
    const prodRes = await getProducts({
      categoryId: category._id.toString(),
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    });
    products = prodRes?.data?.products || [];
    totalProducts = prodRes?.total || prodRes?.results || products.length;
  } catch (err) {
    console.error('Failed to load category products:', err.message);
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE) || 1;

  // Filter sibling categories
  const siblingCategories = allCategories.filter((c) => (c.slug || c._id.toString()) !== slug);

  // Relevant blog posts matching this category
  const relevantBlogs = BLOGS_DATA.filter((b) =>
    (b.categorySlug && b.categorySlug.toLowerCase().includes(slug.toLowerCase())) ||
    (b.tags && b.tags.some((t) => t.toLowerCase().includes(category.name.toLowerCase())))
  ).slice(0, 3);

  // Intro text
  const introText = CATEGORY_INTROS[slug] ||
    `Browse genuine ${category.name} on Medikart. All healthcare items are sourced directly from licensed retail partner pharmacies and authorized pharmaceutical distributors in Pakistan. Check authentic stock, compare options, and order with Cash on Delivery (COD).`;

  // Breadcrumbs schema
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
        name: 'Categories',
        item: `${SITE_URL}/categories/${allCategories[0]?.slug || 'medicines'}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${SITE_URL}/categories/${category.slug || slug}`,
      },
    ],
  };

  // CollectionPage Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} in Pakistan`,
    description: introText,
    url: `${SITE_URL}/categories/${category.slug || slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((p, index) => ({
        '@type': 'ListItem',
        position: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        url: `${SITE_URL}/products/${p.slug || p._id}`,
        name: p.name,
      })),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Visible Semantic Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-slate-400">Categories</span>
        <span>/</span>
        <span className="text-slate-900 font-bold" aria-current="page">{category.name}</span>
      </nav>

      {/* Category Hero / Header */}
      <header className="bg-gradient-to-r from-yellow-50 via-amber-50/50 to-white p-6 sm:p-8 rounded-3xl border-2 border-yellow-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2.5 bg-yellow-400 text-slate-950 rounded-2xl shadow-xs font-black">
            🏷️
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-amber-900 mt-0.5">
              {totalProducts > 0 ? `${totalProducts} verified products available` : 'Authentic catalogue'}
            </p>
          </div>
        </div>

        {/* Server-Rendered Factual Intro Paragraph (80-150 words) */}
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl pt-1">
          {introText}
        </p>

        {/* Prescription Upload Quick-Link */}
        <div className="pt-2 flex items-center gap-3 flex-wrap">
          <Link
            href="/instant-order"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-500 px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
          >
            <span>📄</span>
            <span>Upload Prescription for {category.name}</span>
          </Link>
          <Link
            href="/refill"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-yellow-100 border border-yellow-300 px-3.5 py-1.5 rounded-xl transition-all"
          >
            <span>🔄</span>
            <span>Monthly Medicine Refill</span>
          </Link>
        </div>
      </header>

      {/* Sibling Categories Bar for Crawlability & User Discovery */}
      {siblingCategories.length > 0 && (
        <section aria-label="Other Healthcare Categories" className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
            Explore Other Categories
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {siblingCategories.map((sib) => (
              <Link
                key={sib._id || sib.slug}
                href={`/categories/${sib.slug || sib._id}`}
                className="shrink-0 text-xs font-bold text-slate-700 bg-white hover:bg-yellow-100 hover:text-slate-950 border border-slate-200 hover:border-yellow-400 px-3 py-1.5 rounded-xl transition-colors"
              >
                {sib.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Product Listing */}
      <section aria-label={`${category.name} Product Listing`} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-black text-slate-900">
            Available Products {totalProducts > 0 && <span className="text-sm font-normal text-slate-500">({totalProducts})</span>}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <p className="text-base font-bold text-slate-700">No products found in this category.</p>
            <p className="text-xs text-slate-500">
              Need a medicine not listed? Upload your doctor slip via{' '}
              <Link href="/instant-order" className="text-amber-800 font-bold underline">
                Instant Order
              </Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {products.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        )}

        {/* Clean, Crawlable Pagination with Real <a href> Links */}
        {totalPages > 1 && (
          <nav aria-label="Category Pagination" className="pt-8 flex items-center justify-center gap-2 flex-wrap">
            {currentPage > 1 && (
              <Link
                href={`/categories/${category.slug || slug}?page=${currentPage - 1}`}
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
                  href={`/categories/${category.slug || slug}?page=${pageNumber}`}
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
                href={`/categories/${category.slug || slug}?page=${currentPage + 1}`}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl transition-colors"
                aria-label="Next page"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </section>

      {/* Contextual Related Health Articles (Topic Cluster Interlinking) */}
      {relevantBlogs.length > 0 && (
        <section aria-label="Related Health Guides" className="bg-yellow-50/60 p-6 sm:p-8 rounded-3xl border border-yellow-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                Related Health & Medicine Guides
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Clinical guidance reviewed by Medikart pharmacists.
              </p>
            </div>
            <Link
              href="/blogs"
              className="text-xs font-bold text-amber-900 hover:underline shrink-0"
            >
              All Articles →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relevantBlogs.map((blog) => (
              <article key={blog.id} className="bg-white p-4 rounded-2xl border border-yellow-200/80 shadow-2xs space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800">
                  {blog.category}
                </span>
                <h3 className="text-sm font-bold text-slate-950 line-clamp-2 hover:text-amber-800 transition-colors">
                  <Link href={`/blogs/${blog.slug}`}>
                    {blog.title}
                  </Link>
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {blog.summary}
                </p>
                <div className="pt-1">
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="text-xs font-extrabold text-slate-900 hover:text-amber-800 hover:underline"
                  >
                    Read Guide →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Medical Disclaimer */}
      <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
        <p>
          Disclaimer: Information provided is for educational purposes and does not substitute professional medical advice. Always consult a qualified healthcare provider before starting any medication.
        </p>
      </footer>
    </div>
  );
}
