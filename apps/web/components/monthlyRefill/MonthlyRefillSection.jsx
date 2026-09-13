"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCustomer } from "../CustomerProvider";
import RefillItemCard from "./RefillItemCard";
import ReorderBar from "./ReorderBar";
import AddToRefillButton from "./AddToRefillButton";
import {
  CalendarSync,
  ShoppingBag,
  Bell,
  Sparkles,
  Loader2,
  Trash2,
  LogIn,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react";
import "./monthlyRefill.css";

// Curated recurring medicines for quick-add when list is empty or for guest preview
const FALLBACK_POPULAR_REFILLS = [
  {
    _id: "popular-panadol",
    name: "Panadol Extra Tablets 500mg/65mg",
    genericName: "Paracetamol + Caffeine",
    sku: "PAN-EXT-100",
    price: 360,
    effectivePrice: 340,
    discountPercent: 5,
    coverImage: "/images/placeholder-product.png",
    category: "Pain & Fever",
  },
  {
    _id: "popular-surbex",
    name: "Surbex-Z High Potency Zinc & B-Complex",
    genericName: "Multivitamins with Zinc",
    sku: "SUR-Z-30",
    price: 490,
    effectivePrice: 465,
    discountPercent: 5,
    coverImage: "/images/placeholder-product.png",
    category: "Vitamins & Supplements",
  },
  {
    _id: "popular-cac",
    name: "Cac-1000 Plus Effervescent Tablets",
    genericName: "Calcium + Vitamin C, D3 & B6",
    sku: "CAC-1000-20",
    price: 520,
    effectivePrice: 495,
    discountPercent: 5,
    coverImage: "/images/placeholder-product.png",
    category: "Bone & Joint Care",
  },
  {
    _id: "popular-omega",
    name: "Nutrifactor Omega-3 Fish Oil 1000mg",
    genericName: "EPA & DHA Fatty Acids",
    sku: "NUT-OMG-30",
    price: 1350,
    effectivePrice: 1215,
    discountPercent: 10,
    coverImage: "/images/placeholder-product.png",
    category: "Heart & Cardio",
  },
];

export default function MonthlyRefillSection({
  initialProducts = [],
  isStandalonePage = false,
}) {
  const {
    customer,
    token,
    isAuthenticated,
    isLoading,
    refillData,
    refillItems,
    refillCount,
    isRefillLoading,
    refreshRefill,
    updateRefillQuantity,
    removeFromRefill,
    clearRefill,
    addToRefill,
  } = useCustomer();

  const [clearing, setClearing] = useState(false);
  const [popularMedicines, setPopularMedicines] = useState(
    initialProducts.length > 0 ? initialProducts.slice(0, 6) : FALLBACK_POPULAR_REFILLS
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshRefill();
    }
  }, [isAuthenticated, refreshRefill]);

  // If initialProducts wasn't supplied, load active OTC products
  useEffect(() => {
    if (initialProducts.length === 0) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/products?limit=6&isNarcotic=false`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.products && data.data.products.length > 0) {
            setPopularMedicines(data.data.products);
          }
        })
        .catch(() => {});
    }
  }, [initialProducts]);

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear your monthly refill routine?")) {
      try {
        setClearing(true);
        await clearRefill();
      } catch (err) {
        console.error("Failed to clear refill:", err);
      } finally {
        setClearing(false);
      }
    }
  };

  const formatPrice = (num) => (typeof num === "number" ? Math.round(num) : num);

  const getFullUrl = (path) => {
    const fallback = "/uploads/placeholder.webp";
    if (!path || path === "/images/placeholder-product.png") return fallback;
    return path.startsWith("http") || path.startsWith("/") ? path : `http://localhost:5000${path}`;
  };

  const nextReminderFormatted = refillData?.nextReminderAt
    ? new Date(refillData.nextReminderAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section
      id="monthly-refill-section"
      className="my-8 md:my-10 w-full select-none"
      aria-label="30-Day Monthly Medicine Refill"
    >
      {/* ─── 1. Main Showcase Section Card ─── */}
      <div className="bg-gradient-to-br from-[#FFFDE0] via-[#ffffff] to-[#FFFBEB] rounded-3xl border-2 border-[#fae845] p-5 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#fff850]/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />

        {/* ─── Header: Brand Badge, Title & Routine Summary ─── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#fef08a]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#fff850] border-2 border-[#fae845] flex items-center justify-center text-3xl shadow-sm text-slate-900 flex-shrink-0 font-black">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="refill-badge text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-800" />
                  <span>30-Day Auto Cycle</span>
                </span>
                {isAuthenticated && refillCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active Routine ({refillCount} Saved)</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-heading tracking-tight mt-1">
                Monthly Medicine Refill
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
                Never run out of essential doses. Save routine medicines to your 30-day queue, receive automated email reminders, and reorder in 1-click with Cash on Delivery or Card.
              </p>
            </div>
          </div>

          {/* Right Header Controls / Badges */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
            {nextReminderFormatted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-950 shadow-2xs">
                <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>Next Reminder: {nextReminderFormatted}</span>
              </div>
            )}

            {isAuthenticated && refillCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-red-50 transition-colors flex items-center gap-1 border border-slate-200 hover:border-red-200 cursor-pointer shadow-2xs"
                title="Clear all saved refill medicines"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {!isAuthenticated && (
              <Link
                href="/login?redirect=/#monthly-refill-section"
                className="btn-refill-primary px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-black shadow-xs flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Refill</span>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Feature Guarantee Strip ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 my-6">
          <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-[#fde047]/60 flex items-center gap-3.5 sm:gap-4 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#fff850] text-[#1a1a1a] flex items-center justify-center font-black text-lg sm:text-xl flex-shrink-0 shadow-2xs">
              ⚡
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-900 font-black tracking-tight leading-snug">1-Click Fast Reorder</p>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 leading-snug">Saved address & phone checkout</p>
            </div>
          </div>

          <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-[#fde047]/60 flex items-center gap-3.5 sm:gap-4 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-900 font-black tracking-tight leading-snug">Timely 30-Day Reminders</p>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 leading-snug">Direct email alert before you run out</p>
            </div>
          </div>

          <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-[#fde047]/60 flex items-center gap-3.5 sm:gap-4 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-900 font-black tracking-tight leading-snug">Genuine & Discounted</p>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 leading-snug">100% authentic pharmacy stock</p>
            </div>
          </div>
        </div>

        {/* ─── 2. Active Customer Refill Items (if logged in & has items) ─── */}
        {isAuthenticated && refillItems && refillItems.length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Your Saved Medicines</span>
                <span className="w-5 h-5 rounded-full bg-[#fff850] text-slate-900 text-[10px] font-black flex items-center justify-center border border-[#fae845]">
                  {refillCount}
                </span>
              </h3>
              <span className="text-xs text-slate-500">Quantities auto-saved</span>
            </div>

            <div className="space-y-2.5">
              {refillItems.map((item) => (
                <RefillItemCard
                  key={item._id}
                  item={item}
                  onUpdateQuantity={updateRefillQuantity}
                  onRemove={removeFromRefill}
                />
              ))}
            </div>

            {/* Sticky Reorder Bar */}
            <ReorderBar
              refillData={refillData}
              token={token}
              customer={customer}
              onOrderSuccess={() => refreshRefill()}
            />
          </div>
        ) : null}

        {/* ─── 3. Quick-Add Popular Recurring Medicines Grid ─── */}
        <div className="mt-6 pt-5 border-t border-[#fef08a]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{isAuthenticated && refillCount > 0 ? "Add More Routine Medicines" : "Popular 30-Day Recurring Medicines"}</span>
                <span className="text-[10px] font-bold text-amber-900 bg-[#fff850] px-2 py-0.5 rounded-full border border-[#fae845]">
                  Tap ⚡ to Save
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vitamins, daily supplements, and routine chronic healthcare essentials.
              </p>
            </div>

            <Link
              href="/#store-catalog"
              className="text-xs font-black text-amber-800 hover:text-amber-900 flex items-center gap-1 hover:underline"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {popularMedicines.map((prod) => {
              const coverImg =
                prod.coverImage ||
                prod.images?.find((i) => i.isPrimary)?.path ||
                prod.images?.[0]?.path ||
                "/uploads/placeholder.webp";

              return (
                <div
                  key={prod._id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#fae845] p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-warm-card hover:-translate-y-1 relative group"
                >
                  {/* Top image link */}
                  <Link
                    href={`/products/${prod._id}`}
                    className="relative aspect-square w-full bg-[#FAF8F5] rounded-xl flex items-center justify-center p-2 mb-2 overflow-hidden"
                  >
                    <Image
                      src={getFullUrl(coverImg)}
                      alt={prod.name}
                      fill
                      sizes="120px"
                      className="object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/uploads/placeholder.webp";
                      }}
                    />
                    {prod.discountPercent > 0 && (
                      <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">
                        -{prod.discountPercent}%
                      </span>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${prod._id}`}
                      className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight"
                    >
                      {prod.name}
                    </Link>

                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-xs font-black text-slate-950">
                        PKR {formatPrice(prod.effectivePrice || prod.price)}
                      </span>
                      {prod.discountPercent > 0 && (
                        <span className="text-[10px] text-slate-400 line-through">
                          PKR {formatPrice(prod.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add To Refill Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <AddToRefillButton
                      product={prod}
                      variant="button"
                      className="py-1.5 text-[11px]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 4. Guest Showcase Prompt (if not logged in) ─── */}
        {!isAuthenticated && (
          <div className="mt-6 pt-5 border-t border-[#fef08a] bg-white/95 rounded-2xl p-5 sm:p-6 border border-[#fef08a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fff850] border border-[#fae845] flex items-center justify-center text-xl shadow-2xs font-black flex-shrink-0">
                🗓️
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  Ready to automate your family's medicine schedule?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in or create a free account to activate your 30-day automatic delivery reminder cycle.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/login?redirect=/#monthly-refill-section"
                className="flex-1 sm:flex-initial btn-refill-primary px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-black shadow-xs text-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-center"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
