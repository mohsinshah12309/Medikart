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
  const resolvedParams = await searchParams; // Next 14/15 handles searchParams as a promise or object, let's handle safely
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
      {/* Premium Hero Banner / Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl border border-slate-800">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(13,148,136,0.25),rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid-slate-700/[0.05] bg-[size:20px_20px]" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 w-fit animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            Licensed Pharmacy Partner
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent">
            Your Gateway to Health & Wellness
          </h1>
          <p className="text-sm md:text-base text-slate-350 leading-relaxed max-w-lg">
            Browse and order authentic prescription and OTC medicines online. Standardized Cash on Delivery across Pakistan.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link 
              href="/instant-order" 
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-teal-900/20 hover:shadow-teal-500/20 hover:scale-[1.03] active:scale-[0.98]"
            >
              Upload Prescription
            </Link>
            <a 
              href="#store-catalog" 
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl transition-all border border-slate-700/60"
            >
              Browse Catalog
            </a>
          </div>
        </div>
      </div>

      <div id="store-catalog" className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filter */}
        <aside className="lg:col-span-1 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col gap-5 sticky top-20">
          <div>
            <h2 className="font-bold text-gray-900 text-sm tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="text-teal-600">📁</span> Categories
            </h2>
            <div className="flex flex-col gap-1.5">
              <Link
                href="/"
                className={`px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                  !queryParams.categoryId
                    ? 'bg-teal-50/65 text-teal-700 border-l-4 border-teal-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                }`}
              >
                <span>All Products</span>
                <span className="text-xs text-gray-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/?category=${cat._id}${queryParams.search ? `&search=${queryParams.search}` : ''}`}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                    queryParams.categoryId === cat._id
                      ? 'bg-teal-50/65 text-teal-700 border-l-4 border-teal-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.isNarcotic && (
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Rx
                      </span>
                    )}
                    <span className="text-xs text-gray-400 group-hover:translate-x-0.5 transition-transform">→</span>
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
              <div className="flex w-full items-center bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all overflow-hidden p-1">
                <input
                  type="text"
                  name="search"
                  defaultValue={queryParams.search}
                  placeholder="Search medicines, generic names..."
                  className="w-full bg-transparent px-4 py-2.5 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-teal-900/10 active:scale-[0.97]"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Selected category/search status */}
            <div className="text-sm text-gray-500 self-center">
              {queryParams.search && (
                <span>
                  Results for &ldquo;<strong className="text-slate-800">{queryParams.search}</strong>&rdquo;
                </span>
              )}
              {queryParams.categoryId && (
                <span>
                  {queryParams.search ? ' in ' : ''}
                  Category: <strong className="text-slate-800">{activeCategoryName}</strong>
                </span>
              )}
            </div>
          </div>

          {errorMsg ? (
            <div className="bg-red-50/70 border border-red-200/60 text-red-800 p-5 rounded-2xl text-sm text-center">
              {errorMsg}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-md border border-gray-200/50 p-16 text-center rounded-3xl shadow-sm">
              <span className="text-5xl block animate-bounce mb-4">🔍</span>
              <h3 className="font-extrabold text-gray-900 text-lg">No products found</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
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
