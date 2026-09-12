"use client";

import React, { useState } from 'react';
import { useCart } from './CartProvider';
import { useCustomer } from './CustomerProvider';
import { Heart } from 'lucide-react';

export default function AddToCartButton({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useCustomer();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const wishlisted = isWishlisted(product._id);

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isOutOfStock = product.stockStatus === 'out_of_stock';

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center gap-4">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
          Quantity:
        </label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(q - 1, 1))}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            disabled={quantity <= 1 || isOutOfStock}
          >
            -
          </button>
          <span className="px-4 py-1 text-sm font-semibold w-12 text-center select-none">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(q => Math.min(q + 1, 99))}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            disabled={quantity >= 99 || isOutOfStock}
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`flex-1 py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
            isOutOfStock
              ? 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200'
              : added
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'btn-amber-gradient text-slate-950 hover:brightness-105'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product._id)}
          className={`px-4 py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-2xs ${
            wishlisted
              ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-amber-300"
          }`}
          title={wishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
          aria-label={wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart className={`w-5 h-5 ${wishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
          <span className="hidden sm:inline">{wishlisted ? "Saved" : "Wishlist"}</span>
        </button>
      </div>
    </div>
  );
}
