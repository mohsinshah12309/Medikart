import React from 'react';

export default function NarcoticsBlock() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 text-amber-950">
      <div className="flex items-start gap-3">
        <span className="text-xl">📝</span>
        <div>
          <h4 className="font-bold text-sm text-amber-900">Prescription Required (Rx Only)</h4>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            This is a controlled medicine. A valid prescription image or PDF is required to checkout, and payment is limited to Cash on Delivery (COD) only.
          </p>
        </div>
      </div>
    </div>
  );
}
