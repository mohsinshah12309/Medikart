'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import CategorySidebar from './CategorySidebar';
import {
  CATALOG_EVENTS,
  triggerCatalogSearch,
  triggerCategorySelect,
  triggerFilterReset,
  scrollToCatalog,
} from '../lib/catalogEvents';

// Lightweight skeleton placeholder matching exact ProductCard dimensions and styling
function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#F3EFE6] rounded-2xl overflow-hidden flex flex-col h-full animate-pulse shadow-2xs" aria-hidden="true">
      <div className="aspect-square bg-[#FAF8F5]/90 flex items-center justify-center p-2.5 border-b border-[#F3EFE6]">
        <div className="w-12 h-12 rounded-xl bg-slate-200/50" />
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-2.5">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-100 rounded-md w-4/5" />
          <div className="h-2.5 bg-slate-100 rounded-md w-3/5" />
        </div>
        <div className="space-y-2 pt-2 border-t border-[#F3EFE6]">
          <div className="h-4 bg-slate-100 rounded-md w-1/2" />
          <div className="h-7 bg-slate-100 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

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
  const [categoriesList, setCategoriesList] = useState(Array.isArray(categories) ? categories : []);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      setCategoriesList(categories);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      fetch(`${apiUrl}/categories`)
        .then((res) => res.json())
        .then((data) => {
          const list = data?.data?.categories || data?.categories || (Array.isArray(data?.data) ? data.data : []);
          if (Array.isArray(list) && list.length > 0) {
            setCategoriesList(list);
          }
        })
        .catch(() => {});
    }
  }, [categories]);

  const searchRef = useRef(search);
  const categoryIdRef = useRef(activeCategoryId);
  searchRef.current = search;
  categoryIdRef.current = activeCategoryId;

  // Fetch catalog data asynchronously without full page reload
  const fetchCatalog = async (searchQuery, categoryId, pageNum = 1) => {
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

      // Smoothly update browser URL
      const urlParams = new URLSearchParams();
      if (searchQuery) urlParams.append('search', searchQuery);
      if (categoryId) urlParams.append('category', categoryId);
      if (pageNum > 1) urlParams.append('page', pageNum);
      const newUrl = urlParams.toString() ? `/?${urlParams.toString()}#store-catalog` : '/#store-catalog';
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      console.error('Catalog fetch failed:', err);
      setErrorMsg('Failed to load products. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // Keep state in sync with URL search params and CustomEvents
  useEffect(() => {
    // Initial sync from browser URL if query params exist on client load
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('search');
      const c = params.get('category');
      const p = parseInt(params.get('page'), 10);
      if (s !== null || c !== null || !isNaN(p)) {
        const initialS = s || '';
        const initialC = c || '';
        const initialP = p || 1;
        setSearch(initialS);
        setActiveCategoryId(initialC);
        setCurrentPage(initialP);
        fetchCatalog(initialS, initialC, initialP);
      }
    }

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

    const handleSearchCustomEvent = (e) => {
      const query = e.detail?.search !== undefined ? e.detail.search : (typeof e.detail === 'string' ? e.detail : '');
      const catId = e.detail?.categoryId !== undefined ? e.detail.categoryId : '';
      setSearch(query);
      if (catId) setActiveCategoryId(catId);
      setCurrentPage(1);
      fetchCatalog(query, catId || (query ? '' : categoryIdRef.current), 1);
    };

    const handleCategoryCustomEvent = (e) => {
      const catId = typeof e.detail === 'object' ? (e.detail?.categoryId ?? '') : (e.detail ?? '');
      const resetSearch = typeof e.detail === 'object' ? (e.detail?.resetSearch ?? true) : true;
      
      const newSearch = resetSearch ? '' : searchRef.current;
      if (resetSearch) {
        setSearch('');
      }
      setActiveCategoryId(catId);
      setCurrentPage(1);
      fetchCatalog(newSearch, catId, 1);
      scrollToCatalog(80);
    };

    const handleResetCustomEvent = () => {
      setSearch('');
      setActiveCategoryId('');
      setCurrentPage(1);
      fetchCatalog('', '', 1);
      scrollToCatalog(80);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(CATALOG_EVENTS.SEARCH, handleSearchCustomEvent);
    window.addEventListener('catalog-search', handleSearchCustomEvent);
    window.addEventListener(CATALOG_EVENTS.SELECT_CATEGORY, handleCategoryCustomEvent);
    window.addEventListener('select-category', handleCategoryCustomEvent);
    window.addEventListener(CATALOG_EVENTS.RESET_FILTERS, handleResetCustomEvent);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(CATALOG_EVENTS.SEARCH, handleSearchCustomEvent);
      window.removeEventListener('catalog-search', handleSearchCustomEvent);
      window.removeEventListener(CATALOG_EVENTS.SELECT_CATEGORY, handleCategoryCustomEvent);
      window.removeEventListener('select-category', handleCategoryCustomEvent);
      window.removeEventListener(CATALOG_EVENTS.RESET_FILTERS, handleResetCustomEvent);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCatalog(search, activeCategoryId, 1);
    scrollToCatalog(80);
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    fetchCatalog('', activeCategoryId, 1);
    scrollToCatalog(80);
  };

  const handleSelectCategory = (catId) => {
    setActiveCategoryId(catId);
    setSearch('');
    setCurrentPage(1);
    fetchCatalog('', catId, 1);
    scrollToCatalog(80);
  };

  const handleClearCategory = () => {
    setActiveCategoryId('');
    setCurrentPage(1);
    fetchCatalog(search, '', 1);
    scrollToCatalog(80);
  };

  const handleResetAll = () => {
    setSearch('');
    setActiveCategoryId('');
    setCurrentPage(1);
    triggerFilterReset();
    fetchCatalog('', '', 1);
    scrollToCatalog(80);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setCurrentPage(newPage);
    fetchCatalog(search, activeCategoryId, newPage);
    scrollToCatalog(80);
  };

  const activeCategoryObj = (categoriesList || []).find(
    (c) => c._id === activeCategoryId || c.slug === activeCategoryId
  );
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : '';

  return (
    <div id="store-catalog" className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 items-start scroll-mt-24">
      {/* Invisible anchor target for #catalog */}
      <span id="catalog" className="sr-only" />
      {/* Responsive Categories Side Bar */}
      <CategorySidebar
        categories={categoriesList}
        activeCategoryId={activeCategoryId}
        searchQuery={search}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Catalog Area */}
      <div id="catalog-products-container" className="md:col-span-3 flex flex-col gap-6 scroll-mt-24">
        {/* Search Bar & Stats Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-lg relative">
              <div className="flex w-full items-center bg-white border border-slate-300 rounded-2xl shadow-xs focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all overflow-hidden p-1.5">
                <span className="pl-3 text-slate-400 text-base">🔍</span>
                <input
                  id="catalog-search-input"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[1800px]:grid-cols-7 gap-2.5 sm:gap-3.5 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col gap-2">
                  <div className="aspect-square bg-slate-100 rounded-lg w-full" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  <div className="h-7 bg-slate-100 rounded-lg mt-auto w-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 sm:p-12 text-center rounded-3xl shadow-sm flex flex-col items-center gap-6">
              <span className="text-5xl block animate-bounce">🔍</span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl">No Products Found</h3>
                <p className="text-slate-600 text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
                  {search 
                    ? <>We couldn&apos;t find any medicine matching &ldquo;<span className="font-bold text-slate-900">{search}</span>&rdquo;{activeCategoryId ? ` in ${activeCategoryName}` : ''}.</>
                    : <>No products are currently available in this category.</>}
                </p>
              </div>

              {/* Instant Order Callout */}
              <div className="w-full max-w-xl bg-gradient-to-br from-amber-500/10 via-yellow-400/15 to-amber-500/5 border-2 border-dashed border-amber-300 rounded-2xl p-6 sm:p-7 text-left flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md shrink-0 border border-yellow-200">
                  📋
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 mb-1.5">
                    ⚡ Instant Order Service
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Add an image in Instant Order & we can manage it for you!
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
                    Can&apos;t find your specific medicine or product? Just snap and upload a photo of the product package or prescription. Our certified pharmacists will source, verify, and deliver it directly to you.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <Link
                      href="/instant-order"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all border border-yellow-500/40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Upload Image / Prescription →
                    </Link>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      ✅ 100% Genuine • Fast Delivery
                    </span>
                  </div>
                </div>
              </div>

              {/* Popular Search Recommendations */}
              <div className="flex flex-col items-center gap-2 max-w-md w-full">
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
          ) : loading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[1800px]:grid-cols-7 gap-2.5 sm:gap-3.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[1800px]:grid-cols-7 gap-2.5 sm:gap-3.5 transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
