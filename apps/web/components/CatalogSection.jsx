'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import CategorySidebar from './CategorySidebar';

export default function CatalogSection({
  initialProducts = [],
  initialPagination = { page: 1, limit: 20, total: 0, pages: 1 },
  categories = [],
  initialSearch = '',
  initialCategoryId = '',
  initialPage = 1,
}) {
  const [search, setSearch] = useState(initialSearch);
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Keep state in sync with URL search params if user navigates back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('search') || '';
      const c = params.get('category') || '';
      const p = parseInt(params.get('page'), 10) || 1;
      setSearch(s);
      setActiveCategoryId(c);
      setCurrentPage(p);
      fetchCatalog(s, c, p);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch catalog data asynchronously without a full page reload
  const fetchCatalog = async (searchQuery, categoryId, pageNum) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('page', pageNum || 1);
      params.append('limit', 20);

      // Call public products API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/products?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      const fetchedProducts = data.data?.products || [];
      const fetchedPagination = data.pagination || {
        page: pageNum,
        limit: 20,
        total: fetchedProducts.length,
        pages: 1,
      };

      setProducts(fetchedProducts);
      setPagination(fetchedPagination);

      // Smoothly update browser URL without triggering full page reload
      const urlParams = new URLSearchParams();
      if (searchQuery) urlParams.append('search', searchQuery);
      if (categoryId) urlParams.append('category', categoryId);
      if (pageNum > 1) urlParams.append('page', pageNum);
      const newUrl = urlParams.toString() ? `/?${urlParams.toString()}` : '/';
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      console.error('Catalog fetch failed:', err);
      setErrorMsg('Failed to load products. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCatalog(search, activeCategoryId, 1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    fetchCatalog('', activeCategoryId, 1);
  };

  const handleSelectCategory = (catId) => {
    setActiveCategoryId(catId);
    setCurrentPage(1);
    fetchCatalog(search, catId, 1);
  };

  const handleClearCategory = () => {
    setActiveCategoryId('');
    setCurrentPage(1);
    fetchCatalog(search, '', 1);
  };

  const handleResetAll = () => {
    setSearch('');
    setActiveCategoryId('');
    setCurrentPage(1);
    fetchCatalog('', '', 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setCurrentPage(newPage);
    fetchCatalog(search, activeCategoryId, newPage);

    // Smooth scroll to top of catalog section without full page refresh
    const el = document.getElementById('store-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeCategoryObj = categories.find((c) => c._id === activeCategoryId);
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : '';

  return (
    <div id="store-catalog" className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 items-start">
      {/* Responsive Categories Side Bar */}
      <CategorySidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        searchQuery={search}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Catalog Area */}
      <div className="md:col-span-3 flex flex-col gap-6">
        {/* Search Bar & Stats Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-lg relative">
              <div className="flex w-full items-center bg-white border border-slate-300 rounded-2xl shadow-xs focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all overflow-hidden p-1.5">
                <span className="pl-3 text-slate-400 text-base">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search all 6,112 medicines, generic names..."
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none text-slate-900 placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-2 text-slate-400 hover:text-slate-600 text-sm font-bold mr-1 cursor-pointer"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm px-6 py-2 rounded-xl transition-all shadow-sm active:scale-[0.97] cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Total items counter */}
            <div className="text-xs font-bold text-slate-500 self-start md:self-center bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              Showing <span className="text-slate-900 font-extrabold">{products.length}</span> of{' '}
              <span className="text-slate-950 font-black">{pagination?.total || products.length}</span> products
            </div>
          </div>

          {/* Active Search & Category Filter Chips */}
          {(search || activeCategoryId) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Active Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-slate-950 border border-yellow-300 rounded-full font-bold shadow-2xs">
                  Keyword: &ldquo;{search}&rdquo;
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-amber-800 hover:text-red-600 font-black text-xs ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
              {activeCategoryId && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full font-bold shadow-2xs">
                  Category: {activeCategoryName}
                  <button
                    type="button"
                    onClick={handleClearCategory}
                    className="text-slate-500 hover:text-red-600 font-black text-xs ml-0.5 cursor-pointer"
                    title="Remove category filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-yellow-700 hover:text-yellow-800 underline font-extrabold ml-1 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner Overlay / Error State / Products Grid */}
        <div className="relative min-h-[350px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-3xl transition-opacity">
              <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-800 mt-3">Updating Catalog...</p>
            </div>
          )}

          {errorMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          ) : products.length === 0 && !loading ? (
            <div className="bg-white border border-slate-200 p-16 text-center rounded-3xl shadow-sm">
              <span className="text-5xl block animate-bounce mb-4">🔍</span>
              <h3 className="font-extrabold text-slate-900 text-lg">No products found</h3>
              <p className="text-slate-600 text-sm mt-1 max-w-sm mx-auto">
                We couldn&apos;t find matches for &ldquo;{search}&rdquo;{activeCategoryId ? ` in ${activeCategoryName}` : ''}.
              </p>
              {activeCategoryId && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleClearCategory}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Search all 6,112 products without category filter →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod._id} product={prod} />
                ))}
              </div>

              {/* In-Place Pagination Controls (No Full Page Reload) */}
              {pagination && pagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mt-6">
                  <div className="text-xs text-slate-500 font-bold">
                    Page <span className="text-slate-950 font-black">{pagination.page}</span> of{' '}
                    <span className="text-slate-950 font-black">{pagination.pages}</span> ({pagination.total} items)
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Page */}
                    {pagination.page > 1 ? (
                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-yellow-50 text-slate-800 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                      >
                        ← Prev
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-200 rounded-lg cursor-not-allowed">
                        ← Prev
                      </span>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const startPage = Math.max(
                        1,
                        Math.min(pagination.page - 2, pagination.pages - 4)
                      );
                      const pageNum = startPage + i;
                      if (pageNum > pagination.pages) return null;
                      const isCurrent = pageNum === pagination.page;

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-yellow-400 text-slate-950 shadow-xs border border-yellow-500'
                              : 'bg-white hover:bg-yellow-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next Page */}
                    {pagination.page < pagination.pages ? (
                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-yellow-50 text-slate-800 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                      >
                        Next →
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-200 rounded-lg cursor-not-allowed">
                        Next →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
