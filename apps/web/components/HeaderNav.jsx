"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Heart,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { useCustomer } from "./CustomerProvider";
import InstallAppButton from "./pwa/InstallAppButton";
import NavbarCartIcon from "./NavbarCartIcon";

export default function HeaderNav() {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const accountTimeoutRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const { customer, isAuthenticated, logout, wishlistCount } = useCustomer();

  useEffect(() => {
    setMounted(true);
    // Instant route prefetching for fast transitions
    const routesToPrefetch = ["/", "/instant-order", "/cart", "/checkout", "/wishlist", "/contact", "/login"];
    routesToPrefetch.forEach((route) => {
      try {
        router.prefetch(route);
      } catch (_) {}
    });
  }, [router]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [pathname]);

  // Mobile drawer content with ONLY the approved items
  const mobileDrawerContent = isMobileMenuOpen && mounted ? (
    <div className="fixed inset-0 z-[100] top-row-mobile-search">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        style={{ backgroundColor: "#ffffff", colorScheme: "light" }}
        className="fixed top-0 left-0 bottom-0 w-[310px] max-w-[85vw] h-full max-h-screen bg-white shadow-2xl flex flex-col z-10 border-r border-slate-200 overflow-hidden animate-in slide-in-from-left duration-200"
      >
        {/* Drawer Header */}
        <div
          style={{ backgroundColor: "#ffffff" }}
          className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFEE45] border border-[#E5D322] flex items-center justify-center text-slate-950 font-black text-sm shadow-xs">
              🛒
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 font-heading leading-tight">
                Medikart Menu
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: ONLY Home, Instant Order, Contact, Wishlist, Download Medikart */}
        <div
          style={{ backgroundColor: "#ffffff" }}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 scrollbar-thin bg-white"
        >
          {/* Download Medikart App Banner Card */}
          <div className="pb-1">
            <InstallAppButton variant="mobile-drawer" />
          </div>

          {/* 1. Home */}
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/"
                ? "bg-amber-100/90 text-slate-950 shadow-2xs border-l-4 border-yellow-500 font-black"
                : "text-slate-800 hover:bg-amber-50/60 hover:text-slate-950"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-base">🏠</span>
              <span>Home</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          {/* 2. Instant Order */}
          <Link
            href="/instant-order"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-current={pathname === "/instant-order" ? "page" : undefined}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/instant-order"
                ? "bg-amber-100/90 text-slate-950 shadow-2xs border-l-4 border-yellow-500 font-black"
                : "text-slate-800 hover:bg-amber-50/60 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">⚡</span>
              <span>Instant Order</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFEE45] text-slate-950 font-black border border-[#E5D322]">
                Rapid
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          {/* 3. Contact */}
          <Link
            href="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-current={pathname === "/contact" ? "page" : undefined}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/contact"
                ? "bg-amber-100/90 text-slate-950 shadow-2xs border-l-4 border-yellow-500 font-black"
                : "text-slate-800 hover:bg-amber-50/60 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📞</span>
              <span>Contact Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          {/* 4. Wishlist */}
          <Link
            href="/wishlist"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-current={pathname === "/wishlist" ? "page" : undefined}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/wishlist"
                ? "bg-amber-100/90 text-slate-950 shadow-2xs border-l-4 border-yellow-500 font-black"
                : "text-slate-800 hover:bg-amber-50/60 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                {wishlistCount}
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </Link>
        </div>

        {/* Drawer Bottom Actions: Sign In / Account */}
        <div
          style={{ backgroundColor: "#ffffff" }}
          className="shrink-0 p-4 border-t border-slate-200 bg-white space-y-2.5 shadow-md"
        >
          {isAuthenticated ? (
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-[#FFEE45] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
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
                className="p-2 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <User className="w-4 h-4 text-yellow-400" />
              <span>Sign In / Register</span>
            </Link>
          )}

          <div className="text-center pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">
              Medikart Online Pharmacy Pakistan
            </span>
          </div>
        </div>
      </aside>
    </div>
  ) : null;

  return (
    <>
      {/* ── 1. DESKTOP TOP ROW NAV (Visible at 900px and up) ── */}
      <nav
        aria-label="Primary Navigation"
        className="top-row-desktop items-center gap-2 xl:gap-3 shrink-0"
      >
        {/* 1. Home */}
        <Link
          href="/"
          prefetch={true}
          aria-current={pathname === "/" ? "page" : undefined}
          className={`h-10 sm:h-11 px-3 flex items-center text-[15px] font-semibold whitespace-nowrap relative rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            pathname === "/" ? "text-amber-800 font-bold" : "text-slate-800 hover:text-amber-700"
          }`}
        >
          <span>Home</span>
          {pathname === "/" && (
            <span className="absolute bottom-1 left-3 right-3 h-[2.5px] bg-amber-500 rounded-full" />
          )}
        </Link>

        {/* 2. Instant Order */}
        <Link
          href="/instant-order"
          prefetch={true}
          title="Upload your prescription"
          aria-label="Instant Order — Upload your prescription"
          className="h-10 sm:h-11 px-4 rounded-full bg-[#FFEE45] hover:bg-[#FDD835] active:scale-95 text-slate-950 border border-[#E5D322] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <span className="text-sm">⚡</span>
          <span>INSTANT ORDER</span>
        </Link>

        {/* 3. Contact (Full layout at 1200px+, moves to drawer/footer below 1200px) */}
        <Link
          href="/contact"
          prefetch={true}
          aria-current={pathname === "/contact" ? "page" : undefined}
          className={`nav-contact-link h-10 sm:h-11 px-3 items-center text-[15px] font-semibold whitespace-nowrap relative rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            pathname === "/contact" ? "text-amber-800 font-bold" : "text-slate-800 hover:text-amber-700"
          }`}
        >
          <span>Contact</span>
          {pathname === "/contact" && (
            <span className="absolute bottom-1 left-3 right-3 h-[2.5px] bg-amber-500 rounded-full" />
          )}
        </Link>

        {/* 4. Wishlist */}
        <Link
          href="/wishlist"
          prefetch={true}
          aria-current={pathname === "/wishlist" ? "page" : undefined}
          aria-label={`Wishlist (${wishlistCount || 0} items)`}
          title="Wishlist"
          className={`h-10 sm:h-11 px-2.5 min-[1200px]:px-3 flex items-center gap-1.5 text-[15px] font-semibold whitespace-nowrap relative rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            pathname === "/wishlist" ? "text-amber-800 font-bold" : "text-slate-800 hover:text-amber-700"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              pathname === "/wishlist" || wishlistCount > 0
                ? "text-rose-500 fill-rose-500"
                : "text-slate-600"
            }`}
          />
          <span className="nav-wishlist-text">Wishlist</span>
          {wishlistCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
          {pathname === "/wishlist" && (
            <span className="absolute bottom-1 left-2.5 right-2.5 h-[2.5px] bg-amber-500 rounded-full" />
          )}
        </Link>

        {/* 5. Download Medikart */}
        <InstallAppButton variant="navbar" />

        {/* 6. Sign In / Account Dropdown */}
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
              className="h-10 sm:h-11 px-3 rounded-full bg-amber-50 border border-amber-200/80 hover:border-amber-400 text-slate-800 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-[#FFEE45] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                {customer?.name ? customer.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold max-w-[80px] xl:max-w-[100px] truncate">
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
                    prefetch={true}
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
            prefetch={true}
            className="h-10 sm:h-11 px-4 rounded-full bg-white border border-amber-300 hover:border-amber-400 hover:bg-amber-50/50 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <User className="w-4 h-4 text-amber-600" />
            <span>Sign In</span>
          </Link>
        )}

        {/* 7. Cart Icon */}
        <NavbarCartIcon />
      </nav>

      {/* ── 2. TABLET / MOBILE ROW 1 CONTROLS (Below 900px) ── */}
      <div className="top-row-mobile-flex items-center gap-2 shrink-0">
        <NavbarCartIcon />
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-yellow-300 text-slate-800 hover:text-amber-700 shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-slate-900" />
          ) : (
            <Menu className="w-5 h-5 text-slate-900" />
          )}
        </button>
      </div>

      {/* ── 3. MOBILE SLIDE-OUT DRAWER (Rendered via React Portal) ── */}
      {mounted && typeof document !== "undefined" && mobileDrawerContent
        ? createPortal(mobileDrawerContent, document.body)
        : null}
    </>
  );
}
