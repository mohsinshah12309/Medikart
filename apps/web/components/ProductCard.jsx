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
    <TiltCard3D className="bg-slate-900/45 border border-slate-800/80 rounded-2xl overflow-hidden hover:shadow-[0_18px_38px_rgba(0,0,0,0.55)] hover:border-teal-500/35 flex flex-col h-full relative group">
      {/* Product Image Link Container */}
      <Link href={`/products/${product._id}`} className="block relative aspect-square bg-slate-950/20 flex items-center justify-center p-5 overflow-hidden border-b border-slate-800/40">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-rose-500/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-md shadow-rose-900/20">
            -{product.discountPercent}% OFF
          </span>
        )}
        
        {/* Narcotics Badge */}
        {product.isNarcotic && (
          <span className="absolute top-3 right-3 z-10 bg-indigo-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-md shadow-indigo-900/20">
            Rx ONLY
          </span>
        )}

        {/* 3D View Hover Badge */}
        <span className="absolute bottom-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md text-teal-400 text-[8px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
            <h3 className="font-bold text-slate-100 text-sm hover:text-teal-400 line-clamp-2 min-h-[40px] mb-1.5 leading-snug transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.genericName && (
            <p className="text-[11px] text-slate-450 font-medium italic mb-2 line-clamp-1">
              {product.genericName}
            </p>
          )}
        </div>

        {/* Pricing Layout */}
        <div className="mt-3 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-extrabold text-teal-405">
                PKR {formatPrice(product.effectivePrice)}
              </span>
              <span className="text-xs text-slate-500 line-through font-medium">
                PKR {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-extrabold text-slate-150">
              PKR {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Interactive CTA Buttons */}
        <div className="mt-4">
          {isOutOfStock ? (
            <span className="w-full inline-block text-center bg-slate-800/80 text-slate-500 text-xs font-bold py-2.5 rounded-xl border border-slate-700/20 select-none">
              Out of Stock
            </span>
          ) : product.isNarcotic ? (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold py-2.5 rounded-xl border border-indigo-500/20 transition-colors"
            >
              Prescription Required
            </Link>
          ) : (
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-block text-center bg-teal-650 hover:bg-teal-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-teal-900/10 active:scale-[0.98]"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </TiltCard3D>
  );
}
