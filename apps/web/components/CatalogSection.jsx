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

        {/* Loading / Error State / Products Grid */}
        <div className="relative min-h-[350px]">
          {errorMsg ? (
            <div className="bg-white border border-red-200 p-12 text-center rounded-3xl shadow-sm flex flex-col items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl border border-red-200">
                ⚠️
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Unable to Load Products</h3>
                <p className="text-slate-600 text-sm mt-1 max-w-sm mx-auto">
                  {errorMsg}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchCatalog(search, activeCategoryId, currentPage)}
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer border border-yellow-500/40 flex items-center gap-2"
              >
                🔄 Retry Loading Catalog
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="aspect-square bg-slate-100 rounded-xl w-full" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded-xl mt-auto w-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 md:p-16 text-center rounded-3xl shadow-sm flex flex-col items-center gap-5">
              <span className="text-5xl block animate-bounce">🔍</span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">No Products Found</h3>
                <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto leading-relaxed">
                  {search 
                    ? <>We couldn&apos;t find any medicine matching &ldquo;<span className="font-bold text-slate-900">{search}</span>&rdquo;{activeCategoryId ? ` in ${activeCategoryName}` : ''}.</>
                    : <>No products are currently available in this category.</>}
                </p>
              </div>

              {/* Popular Search Recommendations */}
              <div className="flex flex-col items-center gap-2 max-w-md w-full mt-1">
                <span className="text-xs text-slate-400 font-medium">Suggested Searches:</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {['Panadol', 'Augmentin', 'Brufen', 'Disprin', 'Paracetamol', 'Multivitamin'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setSearch(kw);
                        setActiveCategoryId('');
                        setCurrentPage(1);
                        fetchCatalog(kw, '', 1);
                      }}
                      className="text-xs bg-slate-100 hover:bg-yellow-100 hover:text-slate-950 text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 w-full">
                {activeCategoryId && (
                  <button
                    type="button"
                    onClick={handleClearCategory}
                    className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer border border-yellow-500/40"
                  >
                    Search all categories without filter →
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
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
