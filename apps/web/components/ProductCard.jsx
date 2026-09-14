"use client";

import React, { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TiltCard3D from './3d/TiltCard3D';
import { useCart } from './CartProvider';
import { useCustomer } from './CustomerProvider';
import AddToRefillButton from './monthlyRefill/AddToRefillButton';
import { ShoppingCart, Check, Eye, Heart } from 'lucide-react';

// Pure helpers hoisted outside component to avoid recreation on every render
const formatPrice = (num) => {
  return typeof num === 'number' ? Math.round(num) : num;
};

const getFullUrl = (path) => {
  const fallback = "/uploads/placeholder.webp";
  if (!path || path === "/images/placeholder-product.png") {
    return fallback;
  }
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : '';
  return path.startsWith('http') || path.startsWith('/') ? path : `${apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
};

function ProductCardComponent({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useCustomer();
  const [added, setAdded] = useState(false);

  const wishlisted = isWishlisted(product._id);
  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock' || product.stock <= 0;

  const [imgSrc, setImgSrc] = useState(getFullUrl(product.coverImage));

  const handleAddToCart = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }, [addToCart, product]);

  const handleWishlistToggle = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleWishlist(product._id);
  }, [toggleWishlist, product._id]);

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

        {/* Quick Action Buttons: Monthly Refill + Wishlist */}
        <div className="absolute top-1.5 right-1.5 z-30 flex items-center gap-1">
          <AddToRefillButton product={product} variant="icon" />
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 shadow-xs cursor-pointer ${
              wishlisted
                ? "bg-rose-50 text-rose-500 border border-rose-200 scale-105"
                : "bg-white/95 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 hover:scale-110 opacity-80 group-hover:opacity-100"
            }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
        
        {/* Narcotics Badge vs OTC Badge */}
        {product.isNarcotic ? (
          <span className="absolute bottom-1.5 left-1.5 z-10 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs">
            Rx ONLY
          </span>
        ) : (
          !isOutOfStock && (
            <span className="absolute bottom-1.5 left-1.5 z-10 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
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

          {/* Interactive CTA Buttons: Add to Cart (Primary) + View Details (Below) */}
          <div className="mt-3 flex flex-col gap-1.5">
            {isOutOfStock ? (
              <span className="w-full inline-block text-center bg-slate-100 text-slate-400 text-[10px] sm:text-xs font-semibold py-1.5 rounded-xl border border-slate-200 select-none">
                Out of Stock
              </span>
            ) : product.isNarcotic ? (
              <Link
                href={`/products/${product._id}`}
                className="w-full inline-flex items-center justify-center gap-1 text-center bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] sm:text-xs font-bold py-1.5 rounded-xl border border-amber-300 transition-colors"
              >
                <span>Rx Required</span>
                <span>&rarr;</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  added
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'btn-amber-gradient text-slate-950 hover:brightness-105'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            )}

            {/* Below: View Details Secondary Button */}
            <Link
              href={`/products/${product._id}`}
              className="w-full inline-flex items-center justify-center gap-1.5 text-center bg-amber-50/80 hover:bg-amber-100 text-amber-950 text-[11px] sm:text-xs font-bold py-1.5 px-2 rounded-xl border border-amber-300/80 hover:border-amber-400 transition-all duration-150 shadow-2xs group hover:shadow-xs active:scale-98"
            >
              <Eye className="w-3.5 h-3.5 text-amber-700 group-hover:text-amber-900 transition-colors" />
              <span>View Details</span>
              <span className="text-[11px] text-amber-600 group-hover:text-amber-950 transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </TiltCard3D>
  );
}

const ProductCard = memo(ProductCardComponent);
export default ProductCard;
