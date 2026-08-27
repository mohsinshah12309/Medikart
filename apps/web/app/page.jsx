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
  const resolvedParams = await searchParams; // Next 14 handles searchParams as a promise or object, let's handle safely
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
    <div className="flex flex-col gap-6">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 md:p-10 text-white shadow-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Welcome to Medikart</h1>
        <p className="text-sm md:text-base text-green-50 opacity-90 max-w-xl">
          Your trusted pharmacy partner. Order standard medicines online with Cash on Delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filter */}
        <aside className="lg:col-span-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-gray-950 text-base mb-3">Categories</h2>
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !queryParams.categoryId
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/?category=${cat._id}${queryParams.search ? `&search=${queryParams.search}` : ''}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    queryParams.categoryId === cat._id
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat.name}
                  {cat.isNarcotic && (
                    <span className="ml-2 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">
                      Rx
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Search bar & active filters info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form action="/" method="GET" className="flex w-full max-w-md">
              {queryParams.categoryId && (
                <input type="hidden" name="category" value={queryParams.categoryId} />
              )}
              <input
                type="text"
                name="search"
                defaultValue={queryParams.search}
                placeholder="Search medicines, generic names..."
                className="flex-grow border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-6 py-2 rounded-r-lg transition-colors"
              >
                Search
              </button>
            </form>

            {/* Selected category/search status */}
            <div className="text-sm text-gray-500">
              {queryParams.search && (
                <span>
                  Search results for &ldquo;<strong>{queryParams.search}</strong>&rdquo;
                </span>
              )}
              {queryParams.categoryId && (
                <span>
                  {queryParams.search ? ' in ' : ''}
                  Category: <strong>{activeCategoryName}</strong>
                </span>
              )}
            </div>
          </div>

          {errorMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm text-center">
              {errorMsg}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-gray-150 p-12 text-center rounded-xl shadow-sm">
              <span className="text-4xl">🔍</span>
              <h3 className="font-bold text-gray-900 text-lg mt-3">No products found</h3>
              <p className="text-gray-500 text-sm mt-1">
                Try searching for something else or browse another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
