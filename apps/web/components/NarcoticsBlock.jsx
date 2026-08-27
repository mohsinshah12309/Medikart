import React from 'react';

export default function NarcoticsBlock() {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4 text-purple-900">
      <div className="flex items-start gap-3">
        <span className="text-xl">📝</span>
        <div>
          <h4 className="font-semibold text-sm text-purple-900">Prescription Required (Rx Only)</h4>
          <p className="text-xs text-purple-700 mt-1 leading-relaxed">
            This is a narcotics-flagged medicine. A valid prescription image or PDF is required to checkout, and payment is limited to Cash on Delivery (COD) only.
          </p>
        </div>
      </div>
    </div>
  );
}
