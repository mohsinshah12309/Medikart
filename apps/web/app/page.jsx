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
  const categoryParam = resolvedParams?.category;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (categoryParam) {
    try {
      const categoriesRes = await getCategories();
      if (categoriesRes && categoriesRes.data) {
        const category = categoriesRes.data.categories.find(
          (c) => c._id === categoryParam || c.slug === categoryParam
        );
        if (category) {
          const title = `${category.name} Medicines & Healthcare Products | Medikart Pakistan`;
          const description = `Buy authentic ${category.name} medicines, OTC remedies, and health essentials online at Medikart Pakistan. Verified pharmacies, fast doorstep delivery & Cash on Delivery.`;
          const canonicalUrl = `${siteUrl}/?category=${category.slug || category._id}`;

          return {
            title,
            description,
            alternates: {
              canonical: canonicalUrl,
            },
            openGraph: {
              title,
              description,
              url: canonicalUrl,
              siteName: 'Medikart - Authentic Online Pharmacy',
              locale: 'en_PK',
              type: 'website',
            },
            twitter: {
              card: 'summary_large_image',
              title,
              description,
            },
          };
        }
      }
    } catch (err) {
      console.error("Failed to load category metadata:", err);
    }
  }

  return {
    title: 'Medikart - Authentic Online Pharmacy & Healthcare Store Pakistan',
    description: 'Pakistan\'s trusted online pharmacy. Buy authentic prescription medicines, vitamins, baby care, and OTC health products with fast Cash on Delivery.',
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: 'Medikart - Authentic Online Pharmacy & Healthcare Store Pakistan',
      description: 'Pakistan\'s trusted online pharmacy. Buy authentic prescription medicines, vitamins, baby care, and OTC health products with fast Cash on Delivery.',
      url: siteUrl,
      siteName: 'Medikart',
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Medikart - Authentic Online Pharmacy Pakistan',
      description: 'Order genuine prescription and OTC medicines online with fast Cash on Delivery across Pakistan.',
    },
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
      {/* 1. Care By Condition Section (Prominently placed at the top) */}
      <CareByConditionSection initialConditions={conditions} />

      {/* 2. Official Master Brand Hero Section */}
      <OfficialHeroSection initialCity="Lahore" categories={categories} />

      {/* 3. Secondary Promotional Hero Banners (if configured in Admin) */}
      {heroBanners && heroBanners.length > 0 && (
        <HeroBannerCarousel initialBanners={heroBanners} />
      )}

      {/* 4. AI Dual Promotional Banners: Baby Nutrition & Refreshment Hydration (Dvago style) */}
      <NutritionRefreshmentBanners />

      {/* 5. Horizontal Category Quick-Links Scroller */}
      <CategoryQuickLinks categories={categories} />

      {/* 6. Mid-Page Promotional Banner Blocks */}
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
