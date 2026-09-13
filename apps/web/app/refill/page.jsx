"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import MonthlyRefillSection from "../../components/monthlyRefill/MonthlyRefillSection";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function RefillPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshRefill } = useCustomer();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/refill");
    } else if (isAuthenticated) {
      refreshRefill();
    }
  }, [isAuthenticated, isLoading, refreshRefill, router]);

  return (
    <div className="py-4 sm:py-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/#store-catalog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
        <Link
          href="/wishlist"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
        >
          <span>View Wishlist (Saved Items)</span>
          <span>→</span>
        </Link>
      </div>

      {/* Main Refill Section */}
      <MonthlyRefillSection />
    </div>
  );
}
