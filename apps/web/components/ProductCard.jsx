"use client";

import React from 'react';
import Link from 'next/link';
import TiltCard3D from './3d/TiltCard3D';

export default function ProductCard({ product }) {
  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  
  // Format price helper
  const formatPrice = (num) => {
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  const getFullUrl = (path) => {
    const fallback = "http://localhost:5000/uploads/placeholder.webp";
    if (!path || path === "/images/placeholder-product.png") {
      return fallback;
    }
    return path.startsWith('http') ? path : `http://localhost:5000${path}`;
  };

  return (
    <TiltCard3D className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-200/50 overflow-hidden hover:shadow-[0_15px_30px_-5px_rgba(13,148,136,0.12)] hover:border-teal-500/35 flex flex-col h-full relative group">
      {/* Product Image Link Container */}
      <Link href={`/products/${product._id}`} className="block relative aspect-square bg-[#f8fafc]/50 flex items-center justify-center p-5 overflow-hidden">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-sm shadow-rose-900/10">
            -{product.discountPercent}% OFF
          </span>
        )}
        
        {/* Narcotics Badge */}
        {product.isNarcotic && (
          <span className="absolute top-3 right-3 z-10 bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-sm shadow-indigo-900/10">
            Rx ONLY
          </span>
        )}

        {/* 3D View Hover Badge */}
        <span className="absolute bottom-3 right-3 z-10 bg-slate-900/70 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          🌐 3D View
        </span>

        <img
          src={getFullUrl(product.coverImage)}
          alt={product.name}
          className="max-h-[90%] max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "http://localhost:5000/uploads/placeholder.webp";
          }}
        />
      </Link>

      {/* Product Details Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <Link href={`/products/${product._id}`} className="block">
            <h3 className="font-bold text-gray-900 text-sm hover:text-teal-600 line-clamp-2 min-h-[40px] mb-1.5 leading-snug transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.genericName && (
            <p className="text-[11px] text-slate-400 font-medium italic mb-2 line-clamp-1">
              {product.genericName}
            </p>
          )}
        </div>

        {/* Pricing Layout */}
        <div className="mt-3 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-extrabold text-teal-600">
                PKR {formatPrice(product.effectivePrice)}
              </span>
              <span className="text-xs text-slate-400 line-through font-medium">
                PKR {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-extrabold text-gray-900">
              PKR {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Interactive CTA Buttons */}
        <div className="mt-4">
          {isOutOfStock ? (
            <span className="w-full inline-block text-center bg-slate-100 text-slate-400 text-xs font-semibold py-2.5 rounded-xl border border-slate-200/40">
              Out of Stock
            </span>
          ) : product.isNarcotic ? (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2.5 rounded-xl border border-indigo-100/80 transition-colors"
            >
              Prescription Required
            </Link>
          ) : (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-teal-900/5 hover:shadow-teal-500/10 active:scale-[0.98]"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </TiltCard3D>
  );
}
