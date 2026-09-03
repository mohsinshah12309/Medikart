import React from 'react';
import { getProducts, getCategories } from '../lib/api';
import ProductCard from '../components/ProductCard';
import CategorySidebar from '../components/CategorySidebar';
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
      {/* Clean White & Yellow Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50/40 to-amber-50/50 rounded-3xl p-8 md:p-12 text-slate-900 shadow-md border border-slate-200">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-300/15 blur-[90px] rounded-full pointer-events-none" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300/70 w-fit shadow-xs">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]" />
            Licensed Pharmacy Partner
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Your Gateway to Health & Wellness
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-lg font-normal">
            Browse and order authentic prescription and OTC medicines online. Standardized Cash on Delivery across Pakistan.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 mt-2">
            <Link 
              href="/instant-order" 
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer border border-yellow-500/50"
            >
              Upload Prescription
            </Link>
            <a 
              href="#store-catalog" 
              className="px-6 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl transition-all border border-slate-300 shadow-xs cursor-pointer"
            >
              Browse Catalog
            </a>
          </div>
        </div>
      </div>

      <div id="store-catalog" className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 items-start">
        {/* Responsive Categories Side Bar (Sticky Desktop/Tablet Left Rail + Offcanvas Mobile Slide Drawer) */}
        <CategorySidebar
          categories={categories}
          activeCategoryId={queryParams.categoryId}
          searchQuery={queryParams.search}
        />

        {/* Main Content Area */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {/* Search bar & active filters info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form action="/" method="GET" className="flex w-full max-w-md relative">
              {queryParams.categoryId && (
                <input type="hidden" name="category" value={queryParams.categoryId} />
              )}
              <div className="flex w-full items-center bg-white border border-slate-300 rounded-2xl shadow-xs focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all overflow-hidden p-1.5">
                <input
                  type="text"
                  name="search"
                  defaultValue={queryParams.search}
                  placeholder="Search medicines, generic names..."
                  className="w-full bg-transparent px-4 py-2 text-sm outline-none text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm px-6 py-2 rounded-xl transition-all shadow-sm active:scale-[0.97] cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Selected category/search status */}
            <div className="text-sm text-slate-600 self-center">
              {queryParams.search && (
                <span>
                  Results for &ldquo;<strong className="text-slate-900">{queryParams.search}</strong>&rdquo;
                </span>
              )}
              {queryParams.categoryId && (
                <span>
                  {queryParams.search ? ' in ' : ''}
                  Category: <strong className="text-slate-900">{activeCategoryName}</strong>
                </span>
              )}
            </div>
          </div>

          {errorMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 p-16 text-center rounded-3xl shadow-sm">
              <span className="text-5xl block animate-bounce mb-4">🔍</span>
              <h3 className="font-extrabold text-slate-900 text-lg">No products found</h3>
              <p className="text-slate-600 text-sm mt-1 max-w-sm mx-auto">
                We couldn't find matches for your search. Try adjusting terms or browsing another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
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
