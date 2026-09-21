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
      
      // Google & AI-optimized title matching Pakistan search intent ("Panadol 500mg Price in Pakistan | Buy Online | Medikart")
      const title = `${product.name} Price in Pakistan | Buy Online | Medikart`;

      // Rich snippet description with price, dosage/generic info, nationwide COD and soft CTA
      const description = `Buy authentic ${product.name}${genericStr} online in Pakistan at Rs. ${priceFormatted} PKR. Genuine pharmacy stock, fast 2–4 hr doorstep delivery in Lahore, Karachi, Islamabad & nationwide Cash on Delivery (COD). Order now on Medikart.`;

      // Pakistan targeted high-intent medicine keywords
      const keywords = [
        product.name,
        product.genericName,
        `${product.name} Pakistan`,
        `${product.name} price in Pakistan`,
        `buy ${product.name} online`,
        `order ${product.name} Lahore`,
        `buy ${product.name} Karachi`,
        `buy ${product.name} Islamabad`,
        `${product.name} Rawalpindi`,
        'buy medicine online Pakistan',
        'online pharmacy Pakistan',
        'cash on delivery medicine Pakistan',
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
        title: {
          absolute: title,
        },
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
    title: {
      absolute: 'Buy Medicines Online in Pakistan | Price & Delivery | Medikart',
    },
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

  const firstCategory = product.categoryIds && product.categoryIds.length > 0 ? product.categoryIds[0] : null;

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
    'category': firstCategory ? firstCategory.name : 'Medicines & Healthcare',
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
      'hasMerchantReturnPolicy': {
        '@type': 'MerchantReturnPolicy',
        'applicableCountry': 'PK',
        'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
        'merchantReturnDays': 1,
        'returnMethod': 'https://schema.org/ReturnByMail',
        'returnFees': 'https://schema.org/FreeReturn',
      },
      'shippingDetails': {
        '@type': 'OfferShippingDetails',
        'shippingRate': {
          '@type': 'MonetaryAmount',
          'value': '150.00',
          'currency': 'PKR',
        },
        'shippingDestination': {
          '@type': 'DefinedRegion',
          'addressCountry': 'PK',
        },
        'deliveryTime': {
          '@type': 'ShippingDeliveryTime',
          'handlingTime': {
            '@type': 'QuantitativeValue',
            'minValue': 0,
            'maxValue': 1,
            'unitCode': 'd',
          },
          'transitTime': {
            '@type': 'QuantitativeValue',
            'minValue': 0,
            'maxValue': 2,
            'unitCode': 'd',
          },
        },
      },
    },
  };

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': siteUrl,
    },
  ];

  if (firstCategory) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      'position': 2,
      'name': firstCategory.name,
      'item': `${siteUrl}/?category=${firstCategory.slug || firstCategory._id}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      'position': 3,
      'name': product.name,
      'item': canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      'position': 2,
      'name': 'Medicines & Catalog',
      'item': `${siteUrl}/#store-catalog`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      'position': 3,
      'name': product.name,
      'item': canonicalUrl,
    });
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems,
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
      
      {/* ─── Breadcrumb Navigation ─── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-amber-700 transition-colors">
          Home
        </Link>
        <span>/</span>
        {firstCategory ? (
          <Link href={`/?category=${firstCategory.slug || firstCategory._id}#store-catalog`} className="hover:text-amber-700 transition-colors">
            {firstCategory.name}
          </Link>
        ) : (
          <Link href="/#store-catalog" className="hover:text-amber-700 transition-colors">
            Medicines
          </Link>
        )}
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

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
                Generic Name: <span className="font-semibold text-slate-900">{product.genericName}</span>
              </p>
            )}
            
            <div className="flex flex-wrap gap-2.5 mt-4">
              {product.categoryIds?.map(cat => (
                <Link
                  key={cat._id}
                  href={`/?category=${cat.slug || cat._id}#store-catalog`}
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

          {/* Checkout controls */}
          <div className="flex flex-col gap-3">
            <AddToCartButton product={product} />
            <AddToRefillButton product={product} variant="button" />
            {product.isNarcotic && <NarcoticsBlock />}
          </div>
        </div>
      </div>

      {/* ─── AEO / GEO Clinical & Pharmacy Information Section ─── */}
      <section className="bg-slate-50/80 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
          About {product.name} — Essential Medicine &amp; Delivery Facts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
            <div className="text-amber-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Genuine Quality Assurance
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every unit of {product.name} is procured directly through licensed pharmaceutical distributors and partner pharmacies across Pakistan. Stored in climate-controlled conditions adhering strictly to DRAP guidelines.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
            <div className="text-amber-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Fast Nationwide Delivery
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dispatched in 2–4 hours within Lahore, Karachi, Islamabad &amp; Rawalpindi. Courier delivery within 24–48 business hours to Faisalabad, Multan, Peshawar, Quetta, and all other cities in Pakistan with Cash on Delivery (COD).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
            <div className="text-amber-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🔄</span> 30-Day Monthly Refill
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Need regular supplies of {product.name}? Add it to your 30-day <Link href="/refill" className="text-amber-700 font-bold underline">Monthly Refill</Link> plan to enjoy automated recurring shipments, priority dispatch, and zero missed doses.
            </p>
          </div>
        </div>

        {/* Advisory / Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900">Pharmacist Note:</strong> Use {product.name} only as advised by your physician or healthcare practitioner. Keep out of reach of children. Store in a cool, dry place away from direct sunlight. For questions regarding dosage or drug interactions, reach out to our 24/7 helpline on WhatsApp at <a href="https://wa.me/923244489159" className="text-amber-800 font-bold underline">+92 324 4489159</a>.
        </div>
      </section>

      {/* ─── Related Products & Smart Suggestions Section ─── */}
      <RelatedProducts currentProduct={product} />

      {/* ─── Sticky Bottom Mobile CTA Bar (Item 10) ─── */}
      <ProductStickyMobileCta product={product} />
    </div>
  );
}

