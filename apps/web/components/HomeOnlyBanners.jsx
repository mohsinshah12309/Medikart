"use client";

import React from "react";
import { usePathname } from "next/navigation";
import CategorySubBar from "./CategorySubBar";

/**
 * HomeOnlyBanners:
 * Renders the Category Sub-Navbar ONLY on the homepage.
 * Styled with non-sticky positioning so it scrolls away naturally as the user scrolls down.
 */
export default function HomeOnlyBanners({ categories = [] }) {
  const pathname = usePathname();

  // Strictly render on homepage only
  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="w-full bg-white relative z-20 border-b border-[#F3EFE6] transition-all">
      <CategorySubBar categories={categories} />
    </div>
  );
}
