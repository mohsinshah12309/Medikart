import React from 'react';
import Link from 'next/link';

export default function ProductCard({ product }) {
  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  
  // Format price helper
  const formatPrice = (num) => {
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <Link href={`/products/${product._id}`} className="block relative aspect-square bg-gray-50 flex items-center justify-center p-4">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.discountPercent}% OFF
          </span>
        )}
        
        {/* Narcotics Badge */}
        {product.isNarcotic && (
          <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded">
            Rx ONLY
          </span>
        )}

        <img
          src={product.coverImage.startsWith('http') ? product.coverImage : `http://localhost:5000${product.coverImage}`}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.target.src = "http://localhost:5000/uploads/placeholder.webp";
          }}
        />
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <Link href={`/products/${product._id}`} className="block">
            <h3 className="font-semibold text-gray-900 text-sm hover:text-green-600 line-clamp-2 min-h-[40px] mb-1">
              {product.name}
            </h3>
          </Link>
          {product.genericName && (
            <p className="text-xs text-gray-500 italic mb-2 line-clamp-1">
              {product.genericName}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-green-600">
                PKR {formatPrice(product.effectivePrice)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                PKR {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              PKR {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="mt-3">
          {isOutOfStock ? (
            <span className="w-full inline-block text-center bg-gray-100 text-gray-400 text-xs font-medium py-2 rounded">
              Out of Stock
            </span>
          ) : product.isNarcotic ? (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold py-2 rounded transition-colors"
            >
              Prescription Required
            </Link>
          ) : (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
