import React from 'react';
import Link from 'next/link';

export default async function OrderConfirmationPage({ params }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  return (
    <div className="max-w-xl mx-auto my-12 text-center bg-white p-8 rounded-xl border border-gray-150 shadow-sm flex flex-col items-center">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mb-6">
        🎉
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900">Order Placed Successfully!</h1>
      <p className="text-sm text-gray-500 mt-2">
        Thank you for shopping with Medikart. Your order has been registered and is being processed.
      </p>

      <div className="bg-gray-50 border border-gray-150 rounded-lg p-4 w-full my-6 text-sm">
        <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold">Order Reference Number</span>
        <span className="font-mono font-bold text-gray-900 text-base mt-1 block select-all">
          {orderId}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-6">
        A confirmation email containing your order items, delivery details, and billing summary has been dispatched. Cash payment is due at the time of delivery.
      </p>

      <div className="flex gap-4 w-full">
        <Link
          href="/"
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors text-center shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
