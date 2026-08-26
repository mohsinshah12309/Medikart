"use client";

import React, { useState } from 'react';
import { useCart } from './CartProvider';

export default function AddToCartButton({ product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
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
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
            disabled={quantity >= 99 || isOutOfStock}
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-sm ${
          isOutOfStock
            ? 'bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-200'
            : added
            ? 'bg-green-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isOutOfStock ? 'Out of Stock' : added ? '✓ Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  );
}
