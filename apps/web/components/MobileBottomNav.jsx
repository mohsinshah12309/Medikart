"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "./CartProvider";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/#catalog", label: "Shop", icon: "📁" },
    { href: "/instant-order", label: "Rx Upload", icon: "🩺", isCenter: true },
    { href: "/about", label: "About", icon: "📖" },
    { href: "/cart", label: "Cart", icon: "🛒", badge: cartCount },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "/#catalog") return pathname === "/" || pathname.startsWith("/products");
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
      <div className="flex items-end justify-around px-2 h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-4 relative"
              >
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center text-xl
                    shadow-lg transition-all duration-200
                    ${active
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-yellow-300/40 scale-110"
                      : "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-amber-200/30 hover:scale-105"
                    }
                  `}
                >
                  <span className="text-2xl">{tab.icon}</span>
                </div>
                <span className={`text-[10px] mt-1 font-semibold ${active ? "text-yellow-600" : "text-slate-500"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center pt-2 pb-1 relative min-w-[56px]"
            >
              <div className="relative">
                <span className={`text-xl transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                  {tab.icon}
                </span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-yellow-500 text-[10px] font-bold text-slate-900 rounded-full px-1 shadow-sm">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-semibold ${active ? "text-yellow-600" : "text-slate-500"}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-5 h-[3px] bg-yellow-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
