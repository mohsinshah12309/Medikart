"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Pill,
  Heart,
  CalendarSync,
  User,
  LogOut,
} from "lucide-react";

import { useCustomer } from "./CustomerProvider";
import { triggerCategorySelect, scrollToCatalog } from "../lib/catalogEvents";

export default function HeaderNav({ initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const accountTimeoutRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const { customer, isAuthenticated, logout, wishlistCount, refillCount } = useCustomer();

  // Load categories if not passed down from server layout
  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.categories && data.data.categories.length > 0) {
            setCategories(data.data.categories);
          }
        })
        .catch(() => {});
    }
  }, [initialCategories]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsAccountMenuOpen(false);
  }, [pathname]);

  // Dropdown hover handlers with grace delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 220);
  };

  const handleCategorySelect = (catId, e) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);

    triggerCategorySelect(catId, true);
    scrollToCatalog();

    if (pathname !== "/") {
      router.push(`/?category=${catId}#store-catalog`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      if (catId) {
        url.searchParams.set("category", catId);
      } else {
        url.searchParams.delete("category");
      }
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Instant Order", href: "/instant-order" },
    { name: "Categories", href: "#categories", isDropdown: true },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQs", href: "/faqs" },
  ];

  return (
    <>
      {/* 1. DESKTOP NAVIGATION BAR */}
      <nav className="hidden md:flex items-center gap-5 lg:gap-6 relative">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          if (link.isDropdown) {
            return (
              <div
                key={link.name}
                className="relative py-2"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer relative py-1 ${
                    isDropdownOpen ? "text-amber-600" : "text-slate-700 hover:text-amber-600"
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180 text-amber-500" : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`absolute bottom-[-18px] left-0 h-[2.5px] bg-amber-500 transition-all duration-200 ${
                      isDropdownOpen ? "w-full" : "w-0"
                    }`}
                  />
                </button>

                {/* Categories Dropdown */}
                {isDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[780px] lg:w-[860px] max-w-[92vw] z-50 transition-all duration-200"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-200/90 overflow-hidden">
                      <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-[#FFCB05] to-yellow-300" />

                      <div className="px-6 py-3.5 bg-[#FAF8F5] border-b border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">💊</span>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Explore Healthcare Categories
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {categories.length} Available
                          </span>
                        </div>

                        <Link
                          href="/#store-catalog"
                          onClick={(e) => {
                            setIsDropdownOpen(false);
                            if (pathname === "/") {
                              e.preventDefault();
                              window.dispatchEvent(new CustomEvent("select-category", { detail: "" }));
                              const el = document.getElementById("store-catalog");
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
                        >
                          <span>Browse All Products</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>

                      <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto scrollbar-thin">
                        {categories.map((cat) => {
                          const slug = cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                          const imgSrc = cat.imageUrl || (slug ? `/images/categories/${slug}.svg` : null);

                          return (
                            <div
                              key={cat._id}
                              onClick={(e) => handleCategorySelect(cat._id, e)}
                              className="group flex items-center gap-2.5 p-2 rounded-xl border border-transparent hover:border-amber-200 hover:bg-amber-50/60 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-lg bg-amber-50/80 border border-amber-100 flex items-center justify-center relative overflow-hidden flex-shrink-0 group-hover:scale-105 group-hover:border-amber-300 transition-all">
                                {imgSrc ? (
                                  <Image
                                    src={imgSrc}
                                    alt={cat.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <Pill className="w-5 h-5 text-amber-600" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight">
                                  {cat.name}
                                </p>
                              </div>

                              <ChevronRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          );
                        })}
                      </div>

                      <div className="px-6 py-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-t border-amber-100/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-semibold">Have a doctor's prescription?</span>
                          <span className="text-slate-500 hidden sm:inline">Pharmacist verifies within minutes</span>
                        </div>
                        <Link
                          href="/instant-order"
                          onClick={() => setIsDropdownOpen(false)}
                          className="btn-amber-gradient px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs flex items-center gap-1.5"
                        >
                          <span>Upload Now</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-bold transition-colors relative py-1 ${
                isActive ? "text-amber-600" : "text-slate-700 hover:text-amber-600"
              } after:content-[''] after:absolute after:bottom-[-18px] after:left-0 after:h-[2.5px] after:bg-amber-500 hover:after:w-full after:transition-all ${
                isActive ? "after:w-full" : "after:w-0"
              }`}
            >
              {link.name}
            </Link>
          );
        })}

        {/* Wishlist Link */}
        <Link
          href="/wishlist"
          className={`text-sm font-bold transition-colors relative py-1 flex items-center gap-1.5 ${
            pathname === "/wishlist" ? "text-amber-600" : "text-slate-700 hover:text-amber-600"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              pathname === "/wishlist" || wishlistCount > 0
                ? "text-rose-500 fill-rose-500"
                : "text-slate-400"
            }`}
          />
          <span>Wishlist</span>
          {wishlistCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full px-1 shadow-xs">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>

        {/* Customer Account Dropdown / Sign In Button */}
        {isAuthenticated ? (
          <div
            className="relative py-1"
            onMouseEnter={() => {
              if (accountTimeoutRef.current) clearTimeout(accountTimeoutRef.current);
              setIsAccountMenuOpen(true);
            }}
            onMouseLeave={() => {
              accountTimeoutRef.current = setTimeout(() => setIsAccountMenuOpen(false), 220);
            }}
          >
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 hover:border-amber-400 text-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-[#FFCB05] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                {customer?.name ? customer.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold max-w-[100px] truncate">
                {customer?.name ? customer.name.split(" ")[0] : "Account"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isAccountMenuOpen ? "rotate-180 text-amber-600" : ""
                }`}
              />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 top-full pt-2 w-56 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-amber-200/90 p-2 overflow-hidden">
                  <div className="px-3 py-2.5 bg-amber-50/50 rounded-xl mb-1.5 border border-amber-100/60">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {customer?.name || "Customer"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{customer?.email}</p>
                  </div>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>My Wishlist</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {wishlistCount}
                    </span>
                  </Link>
                  <Link
                    href="/refill"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-yellow-50 hover:text-amber-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarSync className="w-3.5 h-3.5 text-amber-700" />
                      <span>Monthly Refill</span>
                    </span>
                    {refillCount > 0 ? (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#fff850] text-[#1a1a1a] border border-[#fae845]">
                        {refillCount}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                        30-Day
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-amber-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-amber-600" />
            <span>Sign In</span>
          </Link>
        )}
      </nav>

      {/* 2. MOBILE HAMBURGER BUTTON */}
      <div className="flex items-center md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
          className="p-2 rounded-xl bg-white border border-[#F3EFE6] text-slate-800 hover:text-amber-600 shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 3. MOBILE ASIDE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className="relative w-[310px] max-w-[85vw] bg-[#FAF8F5] h-full shadow-2xl flex flex-col z-10 border-r border-[#F3EFE6]">
            <div className="p-4 border-b border-[#F3EFE6] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <span className="font-extrabold text-base text-slate-900 font-heading">
                  Medikart Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/" ? "bg-amber-100/70 text-amber-900" : "text-slate-800 hover:bg-white"
                }`}
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/instant-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/instant-order" ? "bg-amber-100/70 text-amber-900" : "text-slate-800 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Instant Order</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">
                    ⚡ Fast
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              {/* Categories Accordion */}
              <div className="rounded-xl bg-white border border-[#F3EFE6] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-3 font-bold text-sm text-slate-800 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">📁</span>
                    <span>Categories</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {categories.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isMobileCategoriesOpen ? "rotate-180 text-amber-600" : ""
                    }`}
                  />
                </button>

                {isMobileCategoriesOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-1 border-t border-slate-100 max-h-60 overflow-y-auto">
                    {categories.map((cat) => {
                      const slug = cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      const imgSrc = cat.imageUrl || (slug ? `/images/categories/${slug}.svg` : null);

                      return (
                        <div
                          key={cat._id}
                          onClick={(e) => handleCategorySelect(cat._id, e)}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-200 relative overflow-hidden flex-shrink-0">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={cat.name}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            ) : (
                              <Pill className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                          <span className="line-clamp-1">{cat.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Wishlist Mobile Link */}
              <Link
                href="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/wishlist" ? "bg-amber-100/70 text-amber-900" : "text-slate-800 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${wishlistCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                  <span>My Wishlist</span>
                </div>
                {wishlistCount > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {wishlistCount}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </Link>

              {/* Monthly Refill Mobile Link */}
              <Link
                href="/refill"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/refill" ? "bg-yellow-100/80 text-amber-950 font-black" : "text-slate-800 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarSync className="w-4 h-4 text-amber-700" />
                  <span>Monthly Refill</span>
                </div>
                {refillCount > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#fff850] text-[#1a1a1a] border border-[#fae845]">
                    {refillCount}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </Link>

              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/about" ? "bg-amber-100/70 text-amber-900" : "text-slate-800 hover:bg-white"
                }`}
              >
                <span>About Us</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/contact" ? "bg-amber-100/70 text-amber-900" : "text-slate-800 hover:bg-white"
                }`}
              >
                <span>Contact</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/faqs"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm ${
                  pathname === "/faqs" ? "bg-amber-100/70 text-amber-900" : "text-slate-800 hover:bg-white"
                }`}
              >
                <span>FAQs</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Aside Drawer Footer */}
            <div className="p-4 border-t border-[#F3EFE6] bg-white space-y-2.5">
              {isAuthenticated ? (
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-[#FFCB05] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                      {customer?.name ? customer.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{customer?.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{customer?.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shadow-2xs"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <User className="w-4 h-4 text-yellow-400" />
                  <span>Sign In / Register</span>
                </Link>
              )}

              <Link
                href="/instant-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full btn-amber-gradient py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Upload Prescription</span>
                <span>→</span>
              </Link>
              <div className="text-center pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  Licensed Partner Pharmacies • 100% Genuine
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
