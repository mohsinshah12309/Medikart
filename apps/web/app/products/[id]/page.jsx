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
      <div className="max-w-xl mx-auto my-12 text-center bg-slate-900/40 p-8 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-slate-100 mt-4">Product Not Found</h2>
        <p className="text-slate-400 text-sm mt-2">{errorMsg || "The product you requested could not be found or is inactive."}</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2 bg-teal-650 hover:bg-teal-650 text-white font-semibold text-sm rounded-xl transition-all">
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
      <Link href="/" className="inline-flex items-center text-sm font-semibold text-teal-400 hover:text-teal-350 transition-colors">
        ← Back to Shop
      </Link>

      <div className="bg-slate-900/45 rounded-3xl border border-slate-800/80 shadow-2xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 backdrop-blur-md relative overflow-hidden">
        {/* Left Column - Gallery */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column - Product details */}
        <div className="flex flex-col">
          <div className="border-b border-slate-800 pb-5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{product.name}</h1>
            {product.genericName && (
              <p className="text-sm text-slate-450 italic mt-1.5 font-medium">
                Generic Name: {product.genericName}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2.5 mt-4.5">
              {product.categoryIds?.map(cat => (
                <span key={cat._id} className="bg-slate-800/60 text-slate-300 text-xs px-2.5 py-1 rounded-lg font-medium border border-slate-700/35">
                  {cat.name}
                </span>
              ))}
              
              <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                isOutOfStock 
                  ? 'bg-red-500/10 text-red-300 border-red-500/20' 
                  : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
              }`}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>

              {product.isNarcotic && (
                <span className="bg-purple-500/10 text-purple-300 text-xs px-2.5 py-1 rounded-lg font-bold border border-purple-500/20">
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
                  <span className="text-3xl font-extrabold text-teal-405">
                    PKR {formatPrice(product.effectivePrice)}
                  </span>
                  <span className="text-sm text-slate-500 line-through">
                    PKR {formatPrice(product.price)}
                  </span>
                  <span className="bg-rose-500/10 text-rose-300 text-xs font-bold px-2 py-0.5 rounded-lg border border-rose-500/20">
                    -{product.discountPercent}% OFF
                  </span>
                </>
              ) : (
                <span className="text-3xl font-extrabold text-slate-150">
                  PKR {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            {hasDiscount && (
              <p className="text-xs text-slate-500 mt-1">
                Discount applied via {product.appliedDiscount} promotion.
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-slate-800 pt-5 flex-grow mb-6">
              <h3 className="font-bold text-slate-200 text-sm tracking-wide uppercase">Description</h3>
              <p className="text-slate-350 text-sm mt-2 leading-relaxed whitespace-pre-line">
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
