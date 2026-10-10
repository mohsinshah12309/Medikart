"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCustomer } from "../CustomerProvider";
import { useCart } from "../CartProvider";
import RefillItemCard from "./RefillItemCard";
import ReorderBar from "./ReorderBar";
import AddToRefillButton from "./AddToRefillButton";
import { trackBeginCheckout } from "../../lib/analytics";
import {
  CalendarSync,
  ShoppingBag,
  ShoppingCart,
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
    _id: "6a90744130ff9f1a1d0f2c71",
    slug: "panadol-160mg5ml-120ml-liquid",
    name: "Panadol (160Mg/5Ml) 120Ml Liquid",
    genericName: "Paracetamol 160mg/5ml",
    sku: "PAN-120ML",
    price: 135,
    coverImage: "/uploads/products/292839.webp",
    category: "Pain & Fever",
  },
  {
    _id: "6a90743630ff9f1a1d0f2b11",
    slug: "surbex-120ml-syrup",
    name: "Surbex 120Ml Syrup",
    genericName: "Multivitamins with B-Complex",
    sku: "SUR-120ML",
    price: 180,
    coverImage: "/uploads/products/292675.webp",
    category: "Vitamins & Supplements",
  },
  {
    _id: "6aa414e7da2921aeaf5ae229",
    slug: "cac-1000-plus-orange-effervescent-tablets-20-tablets",
    name: "CaC 1000 Plus Orange Effervescent Tablets (20 Tablets)",
    genericName: "Calcium + Vitamin C, D3 & B6",
    sku: "CAC-1000-20",
    price: 520,
    coverImage: "/uploads/products/852504.webp",
    category: "Bone & Joint Care",
  },
  {
    _id: "6a90750430ff9f1a1d0f43a3",
    slug: "ensure-choclate-400g-powdered-milk",
    name: "Ensure (Choclate) 400G Powdered Milk",
    genericName: "Complete Balanced Nutrition",
    sku: "ENS-400G",
    price: 2450,
    coverImage: "/uploads/products/2091494.webp",
    category: "Nutrition & Wellness",
  },
];

export default function MonthlyRefillSection({
  initialProducts = [],
  isStandalonePage = false,
}) {
  const router = useRouter();
  const { addToCart } = useCart();
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
  const [transferringToCart, setTransferringToCart] = useState(false);
  const [popularMedicines, setPopularMedicines] = useState(
    FALLBACK_POPULAR_REFILLS
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshRefill();
    }
  }, [isAuthenticated, refreshRefill]);

  // Load dynamic most-searched and trending recurring products
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    fetch(`${apiUrl}/trending-searches?limit=12`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.trendingProducts && data.data.trendingProducts.length > 0) {
          setPopularMedicines(data.data.trendingProducts.slice(0, 8));
        } else if (initialProducts.length > 0) {
          setPopularMedicines(initialProducts.slice(0, 6));
        }
      })
      .catch(() => {
        if (initialProducts.length > 0) {
          setPopularMedicines(initialProducts.slice(0, 6));
        }
      });
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

  const handleAddAllToCartAndCheckout = async () => {
    if (!refillItems || refillItems.length === 0) return;

    try {
      setTransferringToCart(true);
      for (const it of refillItems) {
        const prodObj = {
          _id: it.productId || it._id,
          productId: it.productId || it._id,
          name: it.name,
          price: it.effectivePrice !== undefined ? it.effectivePrice : it.price,
          effectivePrice: it.effectivePrice !== undefined ? it.effectivePrice : it.price,
          coverImage: it.coverImage,
          isNarcotic: Boolean(it.isNarcotic),
        };
        await addToCart(prodObj, it.quantity || 1);
      }

      trackBeginCheckout(refillItems, refillData?.subtotal || 0);
      router.push("/checkout");
    } catch (err) {
      console.error("Failed to add all refill items to cart:", err);
      router.push("/cart");
    } finally {
      setTransferringToCart(false);
    }
  };

  const formatPrice = (num) => (typeof num === "number" ? Math.round(num) : num);

  const getFullUrl = (path) => {
    const fallback = "/uploads/placeholder.webp";
    if (!path || path === "/images/placeholder-product.png") return fallback;
    return path.startsWith("http") || path.startsWith("/") ? path : `${(process.env.NEXT_PUBLIC_API_URL || "")}${path}`;
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
      className="my-8 md:my-10 w-full"
      aria-label="30-Day Monthly Medicine Refill"
    >
      {/* ─── 1. Main Showcase Section Card ─── */}
      <div className="bg-[#FFEE45] rounded-3xl border-2 border-[#E5D322] p-5 sm:p-8 shadow-lg shadow-yellow-200/50 relative overflow-hidden" style={{ backgroundColor: '#FFEE45' }}>
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-yellow-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />

        {/* ─── Header: Brand Badge, Title & Routine Summary ─── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E5D322]/80">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-[#E5D322] flex items-center justify-center text-3xl shadow-sm text-slate-900 flex-shrink-0 font-black">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="refill-badge text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider bg-white/90 border border-[#E5D322] text-amber-950">
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
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 font-heading tracking-tight mt-1">
                Monthly Medicine Refill
              </h2>
              <p className="text-xs sm:text-sm text-slate-800 mt-1 max-w-2xl font-medium leading-relaxed">
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddAllToCartAndCheckout}
                  disabled={transferringToCart}
                  className="btn-refill-primary px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Transfer all saved refill medicines to cart and proceed to checkout"
                >
                  {transferringToCart ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5" />
                  )}
                  <span>{transferringToCart ? "Adding to Cart..." : "Add All to Cart & Checkout"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl bg-white/80 hover:bg-red-50 transition-colors flex items-center gap-1 border border-slate-200 hover:border-red-200 cursor-pointer shadow-2xs"
                  title="Clear all saved refill medicines"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <Link
                href="/login?redirect=/#monthly-refill-section"
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-black shadow-md hover:shadow-lg hover:scale-103 active:scale-97 flex items-center gap-1.5 transition-all border border-orange-600"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Refill</span>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Feature Guarantee Strip ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 my-6">
          <div className="bg-white/95 hover:bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#E5D322] flex items-center gap-3.5 sm:gap-4 shadow-xs transition-all duration-200">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFEE45] text-slate-900 flex items-center justify-center font-black text-lg sm:text-xl flex-shrink-0 shadow-xs border border-[#E5D322]">
              ⚡
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-950 font-black tracking-tight leading-snug">1-Click Fast Reorder</p>
              <p className="text-xs sm:text-[13px] text-slate-700 mt-0.5 leading-snug font-medium">Saved address & phone checkout</p>
            </div>
          </div>

          <div className="bg-white/95 hover:bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#E5D322] flex items-center gap-3.5 sm:gap-4 shadow-xs transition-all duration-200">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0 shadow-xs border border-amber-300">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-950 font-black tracking-tight leading-snug">Timely 30-Day Reminders</p>
              <p className="text-xs sm:text-[13px] text-slate-700 mt-0.5 leading-snug font-medium">Direct email alert before you run out</p>
            </div>
          </div>

          <div className="bg-white/95 hover:bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#E5D322] flex items-center gap-3.5 sm:gap-4 shadow-xs transition-all duration-200">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center flex-shrink-0 shadow-xs border border-emerald-300">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-950 font-black tracking-tight leading-snug">100% Genuine Pharmacy Stock</p>
              <p className="text-xs sm:text-[13px] text-slate-700 mt-0.5 leading-snug font-medium">Licensed partner sourcing</p>
            </div>
          </div>
        </div>

        {/* ─── 2. Active Customer Refill Items (if logged in & has items) ─── */}
        {isAuthenticated && isRefillLoading && (!refillItems || refillItems.length === 0) ? (
          <div className="mt-4 space-y-2.5">
            <div className="h-4 bg-amber-200/50 rounded w-40 animate-pulse mb-3" />
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-pulse shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-32" />
                  <div className="h-2.5 bg-slate-100 rounded w-20" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-24" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-pulse shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-28" />
                  <div className="h-2.5 bg-slate-100 rounded w-16" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-24" />
            </div>
          </div>
        ) : isAuthenticated && refillItems && refillItems.length > 0 ? (
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
        <div className="mt-6 pt-5 border-t border-[#E5D322]/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-2">
                <span>{isAuthenticated && refillCount > 0 ? "Add More Routine Medicines" : "Popular 30-Day Recurring Medicines"}</span>
                <span className="text-[10px] font-bold text-amber-950 bg-white px-2 py-0.5 rounded-full border border-[#E5D322]">
                  Tap ⚡ to Save
                </span>
              </h3>
              <p className="text-xs text-slate-800 mt-0.5 font-medium">
                Vitamins, daily supplements, and routine chronic healthcare essentials.
              </p>
            </div>

            <Link
              href="/#store-catalog"
              className="text-xs font-black text-slate-950 hover:text-amber-950 flex items-center gap-1 hover:underline"
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
                    href={`/products/${prod.slug || prod._id}`}
                    className="relative aspect-square w-full bg-[#FAF8F5] rounded-xl flex items-center justify-center p-2 mb-2 overflow-hidden"
                  >
                    <Image
                      src={getFullUrl(coverImg)}
                      alt={prod.name}
                      fill
                      sizes="120px"
                      className="object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        if (!e.target.dataset.error) {
                          e.target.dataset.error = true;
                          e.target.srcset = "/uploads/placeholder.webp 1x";
                        }
                      }}
                    />
                    {Boolean(prod.discount?.active && prod.discount?.value > 0) && (
                      <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">
                        -{prod.discount.value}%
                      </span>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${prod.slug || prod._id}`}
                      className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight"
                    >
                      {prod.name}
                    </Link>

                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-xs font-black text-slate-950">
                        PKR {formatPrice(prod.effectivePrice || prod.price)}
                      </span>
                      {Boolean(prod.discount?.active && prod.discount?.value > 0) && (
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
          <div className="mt-6 pt-5 border-t border-[#E5D322]/80 bg-white/95 rounded-2xl p-5 sm:p-6 border-2 border-[#E5D322] flex flex-col sm:flex-row items-center justify-between gap-4">
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
                className="flex-1 sm:flex-initial bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-black shadow-md hover:shadow-lg hover:scale-103 active:scale-97 text-center transition-all border border-orange-600"
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
