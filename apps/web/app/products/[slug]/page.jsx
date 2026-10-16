import React from 'react';
import { getProduct, getProducts, getProductContextualLinks } from '../../../lib/api';
import ProductGallery from '../../../components/ProductGallery';
import ProductCard from '../../../components/ProductCard';
import { BLOGS_DATA } from '../../../data/blogsData';

import AddToCartButton from '../../../components/AddToCartButton';
import AddToRefillButton from '../../../components/monthlyRefill/AddToRefillButton';
import RelatedProducts from '../../../components/RelatedProducts';
import ProductStickyMobileCta from '../../../components/ProductStickyMobileCta';
import BackButton from '../../../components/BackButton';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect, RedirectType } from 'next/navigation';

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export async function generateStaticParams() {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';
    const res = await fetch(`${apiUrl}/products?limit=50`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const products = data?.data?.products || [];
      return products.map((p) => ({ slug: p.slug || p._id.toString() }));
    }
  } catch {
    // Offline build fallback
  }
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  let product = null;
  try {
    const res = await getProduct(slug);
    product = res?.data?.product;
  } catch (_) {}

  if (!product) {
    return {
      title: 'Product Not Found | Medikart',
      robots: { index: false, follow: false },
    };
  }

  const isNarcoticProduct = Boolean(product.isNarcotic || product.rxStatus === 'narcotic');

  // Do not call redirect() inside generateMetadata in Next.js App Router (handled in page component)
  if (OBJECT_ID_REGEX.test(slug) && product.slug && product.slug !== slug) {
    return {
      title: `${product.name} | Medikart`,
      robots: isNarcoticProduct ? { index: false, follow: true } : { index: false, follow: true },
      alternates: {
        canonical: `${SITE_URL}/products/${product.slug}`,
      },
    };
  }

    const effectivePrice = product.effectivePrice || product.price;
    const priceFormatted = typeof effectivePrice === 'number' ? effectivePrice.toFixed(2) : effectivePrice;
    const genericStr = product.genericName ? ` (${product.genericName})` : '';

    const title = `${product.name}${genericStr} - Price in Pakistan | Buy Online | Medikart`;

    const rxNote = (product.requiresPrescription || product.isNarcotic)
      ? 'Licensed doctor prescription verified before dispatch.'
      : 'Order online with fast delivery & Cash on Delivery (COD).';

    const description = `Buy authentic ${product.name}${genericStr} online in Pakistan at best price Rs. ${priceFormatted} PKR. Genuine DRAP-registered stock from licensed partner pharmacies in Lahore, Karachi, Islamabad & nationwide. ${rxNote}`;

    const canonicalUrl = `${SITE_URL}/products/${product.slug || slug}`;

    let ogImageUrl = `${SITE_URL}/og-image.png`;
    if (product.coverImage) {
      ogImageUrl = product.coverImage.startsWith('http')
        ? product.coverImage
        : `${SITE_URL}${product.coverImage}`;
    } else if (product.images && product.images.length > 0 && product.images[0].path) {
      const imgPath = product.images[0].path;
      ogImageUrl = imgPath.startsWith('http') ? imgPath : `${SITE_URL}${imgPath}`;
    }

    return {
      title: { absolute: title },
      description,
      robots: isNarcoticProduct ? { index: false, follow: true } : { index: true, follow: true },
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
        images: [
          {
            url: ogImageUrl,
            width: 800,
            height: 800,
            alt: `${product.name} price in Pakistan - Medikart`,
          },
        ],
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: [ogImageUrl],
      },
    };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  let product = null;
  let contextualData = null;
  try {
    const [prodRes, contextRes] = await Promise.all([
      getProduct(slug),
      getProductContextualLinks(slug).catch(() => null),
    ]);
    if (prodRes?.data?.product) {
      product = prodRes.data.product;
    }
    contextualData = contextRes?.data || null;
  } catch (err) {
    console.error('Failed to load product detail:', err.message);
  }

  if (!product) {
    notFound();
  }

  // 301 Permanent Redirect for old ObjectId URLs to new clean slug URLs
  if (OBJECT_ID_REGEX.test(slug) && product.slug && product.slug !== slug) {
    redirect(`/products/${product.slug}`, RedirectType.permanent);
  }

  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const effectivePrice = product.effectivePrice || product.price;

  const formatPrice = (num) => {
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  const productImageUrl = product.coverImage
    ? (product.coverImage.startsWith('http') ? product.coverImage : `${SITE_URL}${product.coverImage}`)
    : `${SITE_URL}/og-image.png`;

  const canonicalUrl = `${SITE_URL}/products/${product.slug || slug}`;
  const firstCategory = product.categoryIds && product.categoryIds.length > 0 ? product.categoryIds[0] : null;

  const brandFamily = contextualData?.brandFamily || [];
  const sameIngredient = contextualData?.sameIngredient || [];
  const relatedProducts = contextualData?.relatedProducts || [];
  const brandHub = contextualData?.brandHub || null;

  // 1 to 3 related health guides matched by category and keywords
  const catSlug = firstCategory?.slug || '';
  const prodTokens = (product.name || '').toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
  const relatedBlogs = BLOGS_DATA.filter((b) => {
    const matchCat = catSlug && b.categorySlug && b.categorySlug.toLowerCase().includes(catSlug.toLowerCase());
    const matchTag = b.tags && b.tags.some((tag) => prodTokens.some((token) => tag.toLowerCase().includes(token)));
    return matchCat || matchTag;
  }).slice(0, 3);

  // Real, Schema.org-compliant Product JSON-LD (Includes Google Merchant Listings & Free Listings fields)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    image: [productImageUrl],
    description: product.description || `Buy genuine ${product.name} online in Pakistan on Medikart with Cash on Delivery.`,
    sku: product.sku || `MED-${product._id}`,
    mpn: product.sku || `${product._id}`,
    category: firstCategory ? firstCategory.name : 'Medicines & Healthcare',
    brand: {
      '@type': 'Brand',
      name: product.manufacturer || 'Medikart',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: effectivePrice,
      priceValidUntil: '2027-12-31',
      validFrom: '2024-01-01',
      itemCondition: 'https://schema.org/NewCondition',
      availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Medikart',
        url: SITE_URL,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'PKR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'PK',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  // Breadcrumbs
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
  ];

  if (firstCategory) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: firstCategory.name,
      item: `${SITE_URL}/categories/${firstCategory.slug || firstCategory._id}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Categories',
      item: `${SITE_URL}/categories/medicines`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: canonicalUrl,
    });
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const productFaqs = [
    {
      question: `What is the price of ${product.name} in Pakistan?`,
      answer: `The current retail price of ${product.name} on Medikart is Rs. ${formatPrice(effectivePrice)} PKR with doorstep delivery available across Pakistan.`
    },
    {
      question: `Is ${product.name} available for Cash on Delivery (COD)?`,
      answer: `Yes, ${product.name} is available with Cash on Delivery (COD) as well as secure online card payments across major cities including Lahore, Karachi, Islamabad, and Rawalpindi.`
    },
    {
      question: `Is ${product.name} authentic and DRAP registered?`,
      answer: `All medicines and healthcare products on Medikart, including ${product.name}, are 100% genuine and procured directly through licensed pharmaceutical distributors compliant with Drug Regulatory Authority of Pakistan (DRAP) standards.`
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: productFaqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Visible Semantic Breadcrumbs */}
      <div className="flex items-center gap-3 flex-wrap">
        <BackButton fallbackHref={firstCategory?.slug ? `/categories/${firstCategory.slug}` : "/"} />

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1 scrollbar-none">
          <Link href="/" className="hover:text-amber-700 transition-colors whitespace-nowrap">
            Home
          </Link>
          <span>/</span>
          {firstCategory ? (
            <Link href={`/categories/${firstCategory.slug || 'medicines'}`} className="hover:text-amber-700 transition-colors whitespace-nowrap">
              {firstCategory.name}
            </Link>
          ) : (
            <Link href="/categories/medicines" className="hover:text-amber-700 transition-colors whitespace-nowrap">
              Medicines
            </Link>
          )}
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-md" aria-current="page">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden">
        {/* Left Column - Gallery */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column - Product Details */}
        <div className="flex flex-col">
          <div className="border-b border-slate-200 pb-5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">{product.name}</h1>
            {product.genericName && (
              <p className="text-sm text-slate-600 italic mt-1.5 font-medium">
                Generic Name: <span className="font-semibold text-slate-900">{product.genericName}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-2.5 mt-4">
              {product.categoryIds?.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/categories/${cat.slug || cat._id}`}
                  className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-200 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}

              <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                isOutOfStock
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>

              {(product.isNarcotic || product.requiresPrescription || product.rxStatus === 'prescription_required') && (
                <span className="text-xs px-2.5 py-1 rounded-lg font-black bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <span>📋</span>
                  <span>Prescription Required</span>
                </span>
              )}
            </div>
          </div>

          {/* Pricing Info */}
          <div className="my-6">
            <div className="flex items-baseline gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-black text-slate-950">
                    PKR {formatPrice(product.effectivePrice)}
                  </span>
                  <span className="text-sm text-slate-400 line-through font-medium">
                    PKR {formatPrice(product.price)}
                  </span>
                  <span className="bg-red-50 text-red-600 text-xs font-black px-2 py-0.5 rounded-lg border border-red-200">
                    -{product.discountPercent}% OFF
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black text-slate-950">
                  PKR {formatPrice(product.price)}
                </span>
              )}
            </div>

            {hasDiscount && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Discount applied via {product.appliedDiscount} promotion.
              </p>
            )}

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
              <span className="text-green-600 font-bold">✓</span>
              <span>100% Genuine Medicine Sourced via Licensed Partner Pharmacies in Pakistan</span>
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-slate-200 pt-5 flex-grow mb-6">
              <h2 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Description &amp; Details</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Checkout Controls */}
          <div className="flex flex-col gap-3">
            <AddToCartButton product={product} />
            <AddToRefillButton product={product} variant="button" />

          </div>
        </div>
      </div>

      {/* Factual Information Section (Free from unconfirmed claims) */}
      <section className="bg-slate-50/80 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              About {product.name} — Essential Medicine &amp; Delivery Facts
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified clinical and ordering guidance for patients across Pakistan
            </p>
          </div>
          {firstCategory && (
            <Link
              href={`/categories/${firstCategory.slug || firstCategory._id}`}
              className="text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-100 border border-amber-300/80 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              Browse all {firstCategory.name} →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
            <div className="text-amber-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Genuine Quality Sourcing
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every unit of {product.name} is procured directly through verified pharmaceutical distributors and licensed partner retail pharmacies across Pakistan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
            <div className="text-amber-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🚚</span> Doorstep Delivery
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Delivered safely to your doorstep with Cash on Delivery (COD) and Online Card payments supported across Pakistan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
            <div className="text-amber-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🔄</span> Monthly Medicine Refill
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manage ongoing prescriptions easily. Subscribe {product.name} to our Monthly Refill program at{' '}
              <Link href="/refill" className="text-amber-800 font-bold underline">
                medikart.pk/refill
              </Link>{' '}
              for scheduled delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Hub Quick Link */}
      {brandHub && (
        <section aria-label={`${brandHub.name} Brand Hub`} className="bg-gradient-to-r from-amber-50/90 via-yellow-50/50 to-white border border-amber-200/90 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-2xs">
              {brandHub.logo ? (
                <div className="relative w-full h-full">
                  <Image
                    src={brandHub.logo}
                    alt={`${brandHub.name} logo`}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <span className="text-base font-black text-slate-800">{brandHub.shortCode || 'MED'}</span>
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Official Brand Hub</span>
              <h3 className="text-base font-black text-slate-900">{brandHub.name}</h3>
            </div>
          </div>
          <Link
            href={`/brands/${brandHub.slug}`}
            className="text-xs font-black text-slate-950 bg-yellow-400 hover:bg-yellow-300 border border-yellow-500 px-4 py-2 rounded-xl transition-all shadow-xs self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>View All {brandHub.name} Medicines</span>
            <span>→</span>
          </Link>
        </section>
      )}

      {/* 1. Other Pack Sizes & Strengths (Same Brand Family) */}
      {brandFamily.length > 0 && (
        <section aria-label="Other pack sizes and strengths" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>📦</span> Other Pack Sizes &amp; Strengths
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Available pack variations and strengths in the same brand line
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {brandFamily.length} options
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {brandFamily.map((prod) => (
              <ProductCard key={prod._id || prod.slug} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Same Active Ingredient, Other Brands (Generic Equivalents) */}
      {sameIngredient.length > 0 && (
        <section aria-label="Same active ingredient, other brands" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>🧪</span> Same Active Ingredient, Other Brands
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Formulated with {product.genericName}. Informational overview only; consult your doctor or pharmacist before switching brands.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
              Generic Matches
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {sameIngredient.map((prod) => (
              <ProductCard key={prod._id || prod.slug} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Relevant Related Products Module (SSR hydrated with initialRelated) */}
      <RelatedProducts
        currentProduct={product}
        primaryCategory={firstCategory}
        initialRelated={relatedProducts}
      />

      {/* 4. Related Health & Medicine Guides (Blog Authority Flow) */}
      {relatedBlogs.length > 0 && (
        <section aria-label="Related Health Guides" className="bg-slate-50/80 rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Related Health &amp; Medicine Guides
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Verified clinical editorial guidance written by licensed healthcare professionals
                </p>
              </div>
            </div>
            <Link href="/blogs" className="text-xs font-bold text-amber-800 hover:underline shrink-0">
              Browse all guides →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {relatedBlogs.map((blog) => (
              <Link
                key={blog.id || blog.slug}
                href={`/blogs/${blog.slug}`}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-warm-card transition-all flex items-center gap-3.5 group"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    sizes="64px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                    {blog.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Prescription Guidance & FAQ Section */}
      {(product.isNarcotic || product.requiresPrescription || product.rxStatus === 'prescription_required') && (
        <section aria-label="Prescription FAQs" className="bg-amber-50/80 rounded-3xl border border-amber-200/90 p-6 sm:p-8 space-y-4 shadow-3xs">
          <div className="flex items-center gap-2.5 border-b border-amber-200/80 pb-3">
            <span className="text-2xl">🩺</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-950">
                Prescription Guidance &amp; Regulations
              </h2>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                Official dispensing protocols compliant with DRAP pharmaceutical guidelines
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>❓</span> Do I need a prescription to order {product.name}?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Yes. {product.name} is a controlled medicine. In accordance with healthcare standards and Drug Regulatory Authority of Pakistan (DRAP) regulations, it can only be dispensed against an authentic doctor's prescription.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>📤</span> How do I submit my prescription?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You can add this product to your cart and upload a clear photo or PDF document of your prescription either in your shopping cart or on the checkout page. You can order both regular items and prescription items in a single checkout.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>🔍</span> Who verifies my prescription?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Our qualified, licensed pharmacist inspects your prescription to confirm doctor registration, date, and dosage details before approving your order for packaging and delivery.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Mobile Sticky Add to Cart Bar */}
      <ProductStickyMobileCta product={product} />
    </div>
  );
}
