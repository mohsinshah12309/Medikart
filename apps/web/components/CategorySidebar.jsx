"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function CategorySidebar({
  categories = [],
  activeCategoryId = '',
  searchQuery = '',
  onSelectCategory = null,
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const activeCategory = categories.find(c => c._id === activeCategoryId);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  const handleCategoryClick = (e, catId, isMobile) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(catId);
    }
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const renderCategoryList = (isMobile = false) => (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      <Link
        href={searchQuery ? `/?search=${encodeURIComponent(searchQuery)}` : '/'}
        onClick={(e) => handleCategoryClick(e, '', isMobile)}
        className={`px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group border-l-4 cursor-pointer ${
          !activeCategoryId
            ? 'bg-yellow-100/80 text-slate-950 border-yellow-500 shadow-xs'
            : 'text-slate-600 hover:bg-yellow-50/50 hover:text-slate-950 border-transparent'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>📦</span>
          <span>All Products</span>
        </span>
        <span className="text-xs text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>

      {filteredCategories.map((cat) => {
        const isActive = activeCategoryId === cat._id;
        const href = `/?category=${cat._id}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;

        return (
          <Link
            key={cat._id}
            href={href}
            onClick={(e) => handleCategoryClick(e, cat._id, isMobile)}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group border-l-4 cursor-pointer ${
              isActive
                ? 'bg-yellow-100/80 text-slate-950 border-yellow-500 shadow-xs'
                : 'text-slate-600 hover:bg-yellow-50/50 hover:text-slate-950 border-transparent'
            }`}
          >
            <span className="truncate pr-2">{cat.name}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {cat.isNarcotic && (
                <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  Rx
                </span>
              )}
              <span className="text-xs text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
        );
      })}

      {filteredCategories.length === 0 && (
        <div className="py-4 text-center text-xs text-slate-400">
          No categories matching "{categoryFilter}"
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Bar & Trigger: Visible on screens < md */}
      <div className="md:hidden w-full mb-4">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-yellow-400/80 rounded-2xl shadow-sm text-slate-900 font-extrabold text-sm hover:bg-yellow-50/40 active:scale-[0.99] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-lg">📁</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Category:</span>
            <span className="text-slate-950 truncate font-black">
              {activeCategory ? activeCategory.name : 'All Products'}
            </span>
          </div>
          <span className="shrink-0 text-xs bg-yellow-400 text-slate-950 px-2.5 py-1 rounded-lg font-black flex items-center gap-1 shadow-xs">
            Browse Side Bar ☰
          </span>
        </button>
      </div>

      {/* Mobile Slide-Out Side Bar Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Side Bar Drawer panel */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 z-10">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Categories Side Bar</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Select a department to filter</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                aria-label="Close Categories Side Bar"
              >
                ✕
              </button>
            </div>

            {/* Quick search filter for long category lists */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Filter categories..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 bg-slate-50 text-slate-900"
              />
            </div>

            {/* Scrollable category list */}
            <div className="flex-1 overflow-y-auto">
              {renderCategoryList(true)}
            </div>

            <div className="pt-3 mt-2 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 font-semibold">
                {categories.length} Categories Available
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Left Side Bar: Visible on md (768px tablet) and above */}
      <aside className="hidden md:flex md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-col gap-4 sticky top-20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-black text-slate-900 text-xs tracking-wider uppercase flex items-center gap-2">
            <span className="text-yellow-600">📁</span> Categories
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            {categories.length}
          </span>
        </div>

        {/* Search input if more than 8 categories */}
        {categories.length > 8 && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search category..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-yellow-500 bg-slate-50 text-slate-900"
            />
            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Scrollable Category List in Side Bar */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
          {renderCategoryList(false)}
        </div>
      </aside>
    </>
  );
}
