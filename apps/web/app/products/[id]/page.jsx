import React from 'react';
import { getProduct } from '../../../lib/api';
import ProductGallery from '../../../components/ProductGallery';
import NarcoticsBlock from '../../../components/NarcoticsBlock';
import AddToCartButton from '../../../components/AddToCartButton';
import AddToRefillButton from '../../../components/monthlyRefill/AddToRefillButton';
import RelatedProducts from '../../../components/RelatedProducts';
import ProductStickyMobileCta from '../../../components/ProductStickyMobileCta';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';

  try {
    const res = await getProduct(productId);
    if (res && res.data && res.data.product) {
      const product = res.data.product;
      const genericStr = product.genericName ? ` (${product.genericName})` : '';
      const effectivePrice = product.effectivePrice || product.price;
      const priceFormatted = typeof effectivePrice === 'number' ? effectivePrice.toFixed(2) : effectivePrice;
      
      // Google-optimized title matching Pakistan search queries ("Buy Panadol Online Pakistan", "Panadol Price in Pakistan")
      const title = `Buy ${product.name}${genericStr} in Pakistan | Rs. ${priceFormatted} PKR | Medikart`;

      // Rich snippet description with city delivery, price, authenticity and COD
      const description = `Order 100% authentic ${product.name}${genericStr} online at Medikart Pakistan. Licensed pharmacy sourcing, 2–4 hr delivery in Lahore, Karachi, Islamabad & nationwide Cash on Delivery (COD). Price: Rs. ${priceFormatted} PKR.`;

      // Pakistan targeted high-intent medicine keywords
      const keywords = [
        product.name,
        product.genericName,
        `buy ${product.name} in Pakistan`,
        `${product.name} price in Pakistan`,
        `${product.name} online delivery`,
        `${product.name} Lahore`,
        `${product.name} Karachi`,
        `${product.name} Islamabad`,
        `${product.name} Rawalpindi`,
        'buy medicine online Pakistan',
        'online pharmacy Pakistan',
        'cash on delivery medicine',
        'authentic medicine Pakistan',
        'Medikart',
      ].filter(Boolean);

      // Extract primary product cover image for dynamic OG
      let ogImageUrl = `${siteUrl}/og-image.png`;
      if (product.coverImage) {
        ogImageUrl = product.coverImage.startsWith('http') 
          ? product.coverImage 
          : `${siteUrl}${product.coverImage}`;
      } else if (product.images && product.images.length > 0 && product.images[0].path) {
        const imgPath = product.images[0].path;
        ogImageUrl = imgPath.startsWith('http') ? imgPath : `${siteUrl}${imgPath}`;
      }

      const canonicalUrl = `${siteUrl}/products/${product._id}`;

      return {
        title,
        description,
        keywords,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title,
          description,
          url: canonicalUrl,
          siteName: 'Medikart - Authentic Online Pharmacy',
          locale: 'en_PK',
          type: 'website',
          images: [
            {
              url: ogImageUrl,
              width: 800,
              height: 800,
              alt: `Buy ${product.name} online in Pakistan — Medikart`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [ogImageUrl],
        },
      };
    }
  } catch (err) {
    console.error("Failed to load product metadata:", err);
  }

  return {
    title: 'Buy Medicines Online in Pakistan | Price & Delivery | Medikart',
    description: 'Order authentic prescription and OTC medicines with fast 2–4 hr delivery and Cash on Delivery across Pakistan on Medikart.',
  };
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
  
  let product = null;

  try {
    const res = await getProduct(productId);
    if (res && res.data && res.data.product) {
      product = res.data.product;
    }
  } catch (err) {
    console.error("Failed to load product detail:", err.message);
  }

  if (!product) {
    notFound();
  }

  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const effectivePrice = product.effectivePrice || product.price;
  
  // Format price helper
  const formatPrice = (num) => {
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  const productImageUrl = product.coverImage 
    ? (product.coverImage.startsWith('http') ? product.coverImage : `${siteUrl}${product.coverImage}`)
    : `${siteUrl}/og-image.png`;

  const canonicalUrl = `${siteUrl}/products/${product._id}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': [productImageUrl],
    'description': product.description || `Buy genuine ${product.name} online at Medikart Pakistan with fast doorstep delivery and Cash on Delivery.`,
    'sku': product.sku || `MED-${product._id}`,
    'mpn': product._id,
    'brand': {
      '@type': 'Brand',
      'name': product.manufacturer || 'Medikart Authentic Healthcare',
    },
    'offers': {
      '@type': 'Offer',
      'url': canonicalUrl,
      'priceCurrency': 'PKR',
      'price': effectivePrice,
      'priceValidUntil': '2027-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.stockStatus === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Pharmacy',
        'name': 'Medikart Pakistan',
        'url': siteUrl,
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Medicines & Store Catalog',
        'item': `${siteUrl}/#store-catalog`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': product.name,
        'item': canonicalUrl,
      },
    ],
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
      <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-700 hover:text-yellow-600 transition-colors">
        ← Back to Shop
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden">
        {/* Left Column - Gallery */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column - Product details */}
        <div className="flex flex-col">
          <div className="border-b border-slate-200 pb-5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">{product.name}</h1>
            {product.genericName && (
              <p className="text-sm text-slate-600 italic mt-1.5 font-medium">
                Generic Name: {product.genericName}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2.5 mt-4">
              {product.categoryIds?.map(cat => (
                <span key={cat._id} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-200">
                  {cat.name}
                </span>
              ))}
              
              <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                isOutOfStock 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>

              {product.isNarcotic && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-1 rounded-lg font-bold">
                  Rx ONLY
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
          </div>

          {/* Description (H2 for sequential heading order) */}
          {product.description && (
            <div className="border-t border-slate-200 pt-5 flex-grow mb-6">
              <h2 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Description</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Checkout controls */}
          <div className="flex flex-col gap-3">
            <AddToCartButton product={product} />
            <AddToRefillButton product={product} variant="button" />
            {product.isNarcotic && <NarcoticsBlock />}
          </div>
        </div>
      </div>

      {/* ─── Related Products & Smart Suggestions Section ─── */}
      <RelatedProducts currentProduct={product} />

      {/* ─── Sticky Bottom Mobile CTA Bar (Item 10) ─── */}
      <ProductStickyMobileCta product={product} />
    </div>
  );
}

