"use client";

import React from "react";
import { usePathname } from "next/navigation";
import CategorySubBar from "./CategorySubBar";
import SecurityAnnouncementTicker from "./SecurityAnnouncementTicker";

/**
 * HomeOnlyBanners:
 * Renders the Category Sub-Navbar and Continuous Ticker ONLY on the homepage.
 * Styled with non-sticky positioning so it scrolls away naturally as the user scrolls down.
 */
export default function HomeOnlyBanners({ categories = [], contactPhone = "+92 331 4170744" }) {
  const pathname = usePathname();

  // Strictly render on homepage only
  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="w-full bg-white relative z-20 border-b border-[#F3EFE6] transition-all">
      <CategorySubBar categories={categories} />
      <SecurityAnnouncementTicker contactPhone={contactPhone} />
    </div>
  );
}
