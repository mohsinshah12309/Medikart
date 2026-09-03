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
    <TiltCard3D className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-yellow-400/80 flex flex-col h-full relative group transition-all duration-300">
      {/* Product Image Link Container */}
      <Link href={`/products/${product._id}`} className="block relative aspect-square bg-slate-50/70 flex items-center justify-center p-5 overflow-hidden border-b border-slate-100">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-sm">
            -{product.discountPercent}% OFF
          </span>
        )}
        
        {/* Narcotics Badge */}
        {product.isNarcotic && (
          <span className="absolute top-3 right-3 z-10 bg-amber-100 text-amber-900 border border-amber-300/80 text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-xs">
            Rx ONLY
          </span>
        )}

        {/* 3D View Hover Badge */}
        <span className="absolute bottom-3 right-3 z-10 bg-slate-900/85 backdrop-blur-md text-yellow-400 text-[8px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase border border-yellow-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          🌐 3D View
        </span>

        <img
          src={getFullUrl(product.coverImage)}
          alt={product.name}
          loading="lazy"
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
            <h3 className="font-bold text-slate-900 text-sm hover:text-yellow-600 line-clamp-2 min-h-[40px] mb-1.5 leading-snug transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.genericName && (
            <p className="text-[11px] text-slate-500 font-medium italic mb-2 line-clamp-1">
              {product.genericName}
            </p>
          )}
        </div>

        {/* Pricing Layout */}
        <div className="mt-3 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-black text-slate-950">
                PKR {formatPrice(product.effectivePrice)}
              </span>
              <span className="text-xs text-slate-400 line-through font-medium">
                PKR {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-black text-slate-950">
              PKR {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Interactive CTA Buttons */}
        <div className="mt-4">
          {isOutOfStock ? (
            <span className="w-full inline-block text-center bg-slate-100 text-slate-400 text-xs font-bold py-2.5 rounded-xl border border-slate-200 select-none">
              Out of Stock
            </span>
          ) : product.isNarcotic ? (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold py-2.5 rounded-xl border border-amber-300 transition-colors"
            >
              Prescription Required
            </Link>
          ) : (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 text-xs font-extrabold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-yellow-500/40"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </TiltCard3D>
  );
}
