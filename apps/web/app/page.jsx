import React from 'react';
import { getProducts, getCategories } from '../lib/api';
import CatalogSection from '../components/CatalogSection';
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
    page: parseInt(resolvedParams?.page, 10) || 1,
    limit: 20,
  };

  let productsData = { products: [], pagination: {} };
  let categoriesData = { categories: [] };

  try {
    const productsRes = await getProducts(queryParams);
    if (productsRes) {
      productsData = {
        products: productsRes.data?.products || [],
        pagination: productsRes.pagination || {},
      };
    }
  } catch (err) {
    console.error("Failed to load products:", err);
  }

  try {
    const categoriesRes = await getCategories();
    if (categoriesRes && categoriesRes.data) {
      categoriesData = categoriesRes.data;
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
  }

  const { products = [], pagination = {} } = productsData;
  const { categories = [] } = categoriesData;

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

      {/* Client-side In-Place Product Catalog (No Full Page Reloads) */}
      <CatalogSection
        initialProducts={products}
        initialPagination={pagination}
        categories={categories}
        initialSearch={queryParams.search}
        initialCategoryId={queryParams.categoryId}
        initialPage={queryParams.page}
      />
    </div>
  );
}
