import React from 'react';
import { getProduct } from '../../../lib/api';
import ProductGallery from '../../../components/ProductGallery';
import NarcoticsBlock from '../../../components/NarcoticsBlock';
import AddToCartButton from '../../../components/AddToCartButton';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  try {
    const res = await getProduct(productId);
    if (res && res.data && res.data.product) {
      const product = res.data.product;
      const genericStr = product.genericName ? ` (${product.genericName})` : '';
      return {
        title: `${product.name}${genericStr} | Medikart`,
        description: product.description || `Buy ${product.name} online at Medikart. In stock and available.`,
      };
    }
  } catch (err) {
    console.error("Failed to load product metadata:", err);
  }
  return {
    title: 'Product Details | Medikart',
    description: 'View product details on Medikart.',
  };
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  
  let product = null;
  let errorMsg = null;

  try {
    const res = await getProduct(productId);
    if (res && res.data) {
      product = res.data.product;
    }
  } catch (err) {
    console.error("Failed to load product detail:", err);
    errorMsg = err.message || "Failed to load product details.";
  }

  if (errorMsg || !product) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-extrabold text-slate-900 mt-4">Product Not Found</h2>
        <p className="text-slate-600 text-sm mt-2">{errorMsg || "The product you requested could not be found or is inactive."}</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm">
          Back to Shop
        </Link>
      </div>
    );
  }

  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  
  // Format price helper
  const formatPrice = (num) => {
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.coverImage ? `http://localhost:3000${product.coverImage}` : undefined,
    'description': product.description || `Buy ${product.name} online at Medikart.`,
    'sku': product.sku,
    'offers': {
      '@type': 'Offer',
      'price': product.effectivePrice || product.price,
      'priceCurrency': 'PKR',
      'availability': product.stockStatus === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          <div className="flex flex-col gap-4">
            <AddToCartButton product={product} />
            {product.isNarcotic && <NarcoticsBlock />}
          </div>
        </div>
      </div>
    </div>
  );
}
