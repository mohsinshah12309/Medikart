import React from 'react';
import { getProducts, getCategories, getBanners, getConditions } from '../lib/api';
import CatalogSection from '../components/CatalogSection';
import HeroBannerCarousel from '../components/HeroBannerCarousel';
import OfficialHeroSection from '../components/OfficialHeroSection';
import CategoryQuickLinks from '../components/CategoryQuickLinks';
import CareByConditionSection from '../components/CareByConditionSection';
import MidPagePromoBanners from '../components/MidPagePromoBanners';
import BrandsSection from '../components/BrandsSection';
import NutritionRefreshmentBanners from '../components/NutritionRefreshmentBanners';
import BlogsSection from '../components/BlogsSection';

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
            description: `Browse authentic ${category.name} medicines and healthcare products online at Medikart. Standard Cash on Delivery across Pakistan.`,
          };
        }
      }
    } catch (err) {
      console.error("Failed to load category metadata:", err);
    }
  }
  return {
    title: 'Medikart - Authentic Online Pharmacy',
    description: 'Pakistan\'s trusted online pharmacy. Buy authentic prescription and OTC medicines online with fast Cash on Delivery.',
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
  let heroBanners = [];
  let midBanners = [];
  let conditions = [];

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

  try {
    const [heroRes, midRes, condRes] = await Promise.all([
      getBanners('hero').catch(() => null),
      getBanners('mid-page').catch(() => null),
      getConditions().catch(() => null),
    ]);
    if (heroRes?.data?.banners) heroBanners = heroRes.data.banners;
    if (midRes?.data?.banners) midBanners = midRes.data.banners;
    if (condRes?.data?.conditions) conditions = condRes.data.conditions;
  } catch (err) {
    console.error("Failed to load promotional banners or conditions:", err);
  }

  const { products = [], pagination = {} } = productsData;
  const { categories = [] } = categoriesData;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* 1. Official Master Brand Hero Section (matching Image 3) */}
      <OfficialHeroSection initialCity="Lahore" categories={categories} />

      {/* 2. Secondary Promotional Hero Banners (if configured in Admin) */}
      {heroBanners && heroBanners.length > 0 && (
        <HeroBannerCarousel initialBanners={heroBanners} />
      )}

      {/* 2.5. AI Dual Promotional Banners: Baby Nutrition & Refreshment Hydration (Dvago style) */}
      <NutritionRefreshmentBanners />

      {/* 3. Horizontal Category Quick-Links Scroller (matching reference design) */}
      <CategoryQuickLinks categories={categories} />

      {/* 4. Care By Condition Section (matching reference design) */}
      <CareByConditionSection initialConditions={conditions} />

      {/* 5. Mid-Page Promotional Banner Blocks */}
      <MidPagePromoBanners initialBanners={midBanners} />

      {/* 6. Top Pharmaceutical Brands Section */}
      <BrandsSection />

      {/* 7. Health & Wellness Blogs Slider (Matching Dvago Screenshot) */}
      <BlogsSection />

      {/* 8. Client-Side In-Place High-Density Product Catalog */}
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
