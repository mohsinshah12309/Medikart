"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import ProductCard from "../../components/ProductCard";
import { Heart, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, wishlistItems, wishlistCount, isWishlistLoading, refreshWishlist } = useCustomer();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/wishlist");
    } else if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated, isLoading, refreshWishlist, router]);

  if (isLoading || isWishlistLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading your saved items...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="py-4 sm:py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border border-amber-200/80 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 bg-white rounded-2xl border border-amber-200 flex items-center justify-center text-2xl shadow-xs text-rose-500">
            ❤️
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              My Saved Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              You have <span className="font-bold text-amber-900">{wishlistCount} items</span> saved for later
            </p>
          </div>
        </div>

        <Link
          href="/#store-catalog"
          className="btn-amber-gradient px-5 py-2.5 rounded-full text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Wishlist Products Grid */}
      {wishlistItems && wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {wishlistItems.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#F3EFE6] rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-100">
            🤍
          </div>
          <h2 className="text-lg font-black text-slate-900 font-heading">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Explore our wide range of medicines and healthcare products, and tap the heart icon to save items you love.
          </p>
          <div className="mt-6">
            <Link
              href="/#store-catalog"
              className="inline-flex items-center gap-2 btn-amber-gradient px-6 py-2.5 rounded-full text-xs font-black shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
