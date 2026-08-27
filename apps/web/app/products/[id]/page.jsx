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
      <div className="max-w-xl mx-auto my-12 text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-gray-900 mt-4">Product Not Found</h2>
        <p className="text-gray-500 text-sm mt-2">{errorMsg || "The product you requested could not be found or is inactive."}</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors">
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
      <Link href="/" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
        ← Back to Shop
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column - Gallery */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column - Product details */}
        <div className="flex flex-col">
          <div className="border-b border-gray-150 pb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{product.name}</h1>
            {product.genericName && (
              <p className="text-sm text-gray-500 italic mt-1 font-medium">
                Generic Name: {product.genericName}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-3">
              {product.categoryIds?.map(cat => (
                <span key={cat._id} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded font-medium">
                  {cat.name}
                </span>
              ))}
              
              <span className={`text-xs px-2.5 py-1 rounded font-semibold ${
                isOutOfStock ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>

              {product.isNarcotic && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded font-semibold border border-purple-200">
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
                  <span className="text-3xl font-extrabold text-green-600">
                    PKR {formatPrice(product.effectivePrice)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    PKR {formatPrice(product.price)}
                  </span>
                  <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-0.5 rounded border border-red-150">
                    -{product.discountPercent}% OFF
                  </span>
                </>
              ) : (
                <span className="text-3xl font-extrabold text-gray-900">
                  PKR {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            {hasDiscount && (
              <p className="text-xs text-gray-400 mt-1">
                Discount applied via {product.appliedDiscount} promotion.
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-gray-150 pt-4 flex-grow">
              <h3 className="font-bold text-gray-900 text-sm">Description</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Checkout controls */}
          <AddToCartButton product={product} />
          {product.isNarcotic && <NarcoticsBlock />}
        </div>
      </div>
    </div>
  );
}
