import React from 'react';
import { getProducts, getCategories } from '../lib/api';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';

export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const categoryId = resolvedParams?.category;
  if (categoryId) {
    try {
      const categoriesRes = await getCategories();
      if (categoriesRes && categoriesRes.data) {
        const category = categoriesRes.data.categories.find(c => c._id === categoryId);
        if (category) {
          return {
            title: `${category.name} | Medikart`,
            description: `Browse authentic ${category.name} medicines and products online at Medikart. Cash on delivery available.`,
          };
        }
      }
    } catch (err) {
      console.error("Failed to load category metadata:", err);
    }
  }
  return {
    title: 'Medikart - Online Pharmacy & Storefront',
    description: 'Your trusted online pharmacy. Buy authentic medicines with standard cash on delivery.',
  };
}

export default async function Home({ searchParams }) {
  const resolvedParams = await searchParams;
  const queryParams = {
    search: resolvedParams?.search || '',
    categoryId: resolvedParams?.category || '',
    page: resolvedParams?.page || 1,
    limit: 20,
  };

  let productsData = { products: [], pagination: {} };
  let categoriesData = { categories: [] };
  let errorMsg = null;

  try {
    const productsRes = await getProducts(queryParams);
    if (productsRes && productsRes.data) {
      productsData = productsRes.data;
    }
  } catch (err) {
    console.error("Failed to load products:", err);
    errorMsg = "Backend API connection failed. Please ensure the server is running on port 5000.";
  }

  try {
    const categoriesRes = await getCategories();
    if (categoriesRes && categoriesRes.data) {
      categoriesData = categoriesRes.data;
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
  }

  const { products = [] } = productsData;
  const { categories = [] } = categoriesData;

  const activeCategoryName = queryParams.categoryId
    ? categories.find(c => c._id === queryParams.categoryId)?.name || 'Category'
    : '';

  return (
    <div className="flex flex-col gap-8">
      {/* Rich Colored Clinical Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-850 via-teal-950 to-emerald-950 rounded-3xl p-8 md:p-12 text-white shadow-xl border border-teal-700/35 backdrop-blur-md">
        {/* Soft Background Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_120%,rgba(16,185,129,0.25),rgba(20,184,166,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid-slate-100/[0.015] bg-[size:24px_24px]" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-450/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            Licensed Pharmacy Partner
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-white to-emerald-305 bg-clip-text text-transparent">
            Your Gateway to Health & Wellness
          </h1>
          <p className="text-sm md:text-base text-slate-205/90 leading-relaxed max-w-lg">
            Browse and order authentic prescription and OTC medicines online. Standardized Cash on Delivery across Pakistan.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link 
              href="/instant-order" 
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#04151a] font-extrabold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Upload Prescription
            </Link>
            <a 
              href="#store-catalog" 
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-100 font-semibold text-sm rounded-xl transition-all border border-white/20 cursor-pointer"
            >
              Browse Catalog
            </a>
          </div>
        </div>
      </div>

      <div id="store-catalog" className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filter */}
        <aside className="lg:col-span-1 bg-[#0a232a]/45 backdrop-blur-md p-5 rounded-2xl border border-teal-950/60 shadow-md flex flex-col gap-5 sticky top-20">
          <div>
            <h2 className="font-bold text-slate-250 text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
              <span className="text-emerald-400">📁</span> Categories
            </h2>
            <div className="flex flex-col gap-1 max-h-[calc(100vh-240px)] overflow-y-auto pr-1.5 scrollbar-thin">
              <Link
                href="/"
                className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group border-l-3 ${
                  !queryParams.categoryId
                    ? 'bg-teal-500/10 text-teal-300 border-teal-500 shadow-sm'
                    : 'text-slate-400 hover:bg-teal-950/40 hover:text-slate-150 border-transparent'
                }`}
              >
                <span>All Products</span>
                <span className="text-xs text-slate-500 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/?category=${cat._id}${queryParams.search ? `&search=${queryParams.search}` : ''}`}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group border-l-3 ${
                    queryParams.categoryId === cat._id
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500 shadow-sm'
                      : 'text-slate-400 hover:bg-teal-950/40 hover:text-slate-150 border-transparent'
                  }`}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.isNarcotic && (
                      <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Rx
                      </span>
                    )}
                    <span className="text-xs text-slate-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Search bar & active filters info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form action="/" method="GET" className="flex w-full max-w-md relative">
              {queryParams.categoryId && (
                <input type="hidden" name="category" value={queryParams.categoryId} />
              )}
              <div className="flex w-full items-center bg-slate-950/30 border border-teal-950/80 rounded-2xl shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all overflow-hidden p-1.5">
                <input
                  type="text"
                  name="search"
                  defaultValue={queryParams.search}
                  placeholder="Search medicines, generic names..."
                  className="w-full bg-transparent px-4 py-2 text-sm outline-none text-slate-150 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-6 py-2 rounded-xl transition-all shadow-md shadow-teal-900/10 active:scale-[0.97] cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Selected category/search status */}
            <div className="text-sm text-slate-400 self-center">
              {queryParams.search && (
                <span>
                  Results for &ldquo;<strong className="text-slate-200">{queryParams.search}</strong>&rdquo;
                </span>
              )}
              {queryParams.categoryId && (
                <span>
                  {queryParams.search ? ' in ' : ''}
                  Category: <strong className="text-slate-200">{activeCategoryName}</strong>
                </span>
              )}
            </div>
          </div>

          {errorMsg ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl text-sm text-center">
              {errorMsg}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-teal-950/10 border border-teal-900/20 p-16 text-center rounded-3xl shadow-sm">
              <span className="text-5xl block animate-bounce mb-4">🔍</span>
              <h3 className="font-extrabold text-slate-200 text-lg">No products found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                We couldn't find matches for your search. Try adjusting terms or browsing another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
              {products.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
