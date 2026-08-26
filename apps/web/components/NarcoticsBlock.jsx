import React from 'react';

export default function NarcoticsBlock() {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4 text-purple-900">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h4 className="font-semibold text-sm text-purple-900">Prescription Required (Rx Only)</h4>
          <p className="text-xs text-purple-700 mt-1 leading-relaxed">
            This is a narcotics-flagged medicine. Online checkout for prescription-only items is currently unavailable on our standard storefront (scheduled for Phase 26).
          </p>
          <p className="text-xs font-semibold text-purple-800 mt-2">
            Add to Cart and checkout are disabled for this product.
          </p>
        </div>
      </div>
    </div>
  );
}
