"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TiltCard3D from './3d/TiltCard3D';

export default function ProductCard({ product }) {
  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock' || product.stock <= 0;
  
  // Format price helper
  const formatPrice = (num) => {
    return typeof num === 'number' ? Math.round(num) : num;
  };

  const getFullUrl = (path) => {
    const fallback = "/uploads/placeholder.webp";
    if (!path || path === "/images/placeholder-product.png") {
      return fallback;
    }
    return path.startsWith('http') || path.startsWith('/') ? path : `http://localhost:5000${path}`;
  };

  const [imgSrc, setImgSrc] = useState(getFullUrl(product.coverImage));

  return (
    <TiltCard3D className="bg-white border border-[#F3EFE6] rounded-2xl overflow-hidden hover:shadow-warm-card hover:border-amber-300 flex flex-col h-full relative group transition-all duration-200">
      {/* Product Image Link Container */}
      <Link href={`/products/${product._id}`} className="block relative aspect-square bg-[#FAF8F5]/80 flex items-center justify-center p-2.5 overflow-hidden border-b border-[#F3EFE6]">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 z-10 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider uppercase shadow-xs">
            -{product.discountPercent}%
          </span>
        )}
        
        {/* Narcotics Badge vs OTC Badge */}
        {product.isNarcotic ? (
          <span className="absolute top-1.5 right-1.5 z-10 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs">
            Rx ONLY
          </span>
        ) : (
          !isOutOfStock && (
            <span className="absolute top-1.5 right-1.5 z-10 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
              OTC
            </span>
          )
        )}

        {/* 3D View Hover Badge */}
        <span className="absolute bottom-1.5 right-1.5 z-10 bg-slate-900/90 text-yellow-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border border-yellow-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          3D
        </span>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-20">
            <span className="text-white font-bold text-[10px] sm:text-xs bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-600">
              Out of Stock
            </span>
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={imgSrc}
            alt={product.name || 'Product Image'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            loading="lazy"
            className="object-contain p-1 transition-transform duration-200 group-hover:scale-105"
            onError={() => {
              setImgSrc("/uploads/placeholder.webp");
            }}
          />
        </div>
      </Link>

      {/* Product Details Section */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-grow justify-between">
        <div>
          {product.genericName && (
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5 line-clamp-1">
              {product.genericName}
            </p>
          )}
          <Link href={`/products/${product._id}`} className="block">
            <h3 className="font-bold text-slate-800 text-xs sm:text-[13px] hover:text-yellow-600 line-clamp-2 min-h-[32px] sm:min-h-[36px] leading-tight transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Pricing Layout */}
          <div className="mt-2 flex items-baseline flex-wrap gap-1">
            {hasDiscount ? (
              <>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  Rs. {formatPrice(product.effectivePrice)}
                </span>
                <span className="text-[10px] text-slate-400 line-through font-medium">
                  Rs. {formatPrice(product.price)}
                </span>
                {product.discountPercent > 0 && (
                  <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    Save {product.discountPercent}%
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs sm:text-sm font-black text-slate-900">
                Rs. {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Interactive CTA Buttons */}
          <div className="mt-2.5">
            {isOutOfStock ? (
              <span className="w-full inline-block text-center bg-slate-100 text-slate-400 text-[10px] sm:text-xs font-semibold py-1.5 rounded-full border border-slate-200 select-none">
                Out of Stock
              </span>
            ) : product.isNarcotic ? (
              <Link
                href={`/products/${product._id}`}
                className="w-full inline-block text-center bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] sm:text-xs font-bold py-1.5 rounded-full border border-amber-300 transition-colors"
              >
                Rx Required
              </Link>
            ) : (
              <Link
                href={`/products/${product._id}`}
                className="btn-amber-gradient w-full text-[10px] sm:text-xs py-1.5 shadow-xs"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </TiltCard3D>
  );
}
