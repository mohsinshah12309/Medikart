import React from 'react';
import { redirect, RedirectType } from 'next/navigation';
import { getProducts, getCategories, getBanners, getConditions } from '../lib/api';
import CatalogSection from '../components/CatalogSection';
import OfficialHeroSection from '../components/OfficialHeroSection';
import CategoryQuickLinks from '../components/CategoryQuickLinks';
import CareByConditionSection from '../components/CareByConditionSection';
import MidPagePromoBanners from '../components/MidPagePromoBanners';
import BrandsSection from '../components/BrandsSection';
import NutritionRefreshmentBanners from '../components/NutritionRefreshmentBanners';
import BlogsSection from '../components/BlogsSection';
import RightBlogSidebar from '../components/RightBlogSidebar';

export const revalidate = 60;

export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const categoryParam = resolvedParams?.category;
  const searchParam = resolvedParams?.search;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';

  if (categoryParam) {
    return {
      title: 'Categories | Medikart Online Pharmacy',
      robots: { index: false, follow: true },
    };
  }

  if (searchParam) {
    const title = `Search: "${searchParam}" | Medikart Online Pharmacy`;
    const description = `Find authentic ${searchParam} and related healthcare products online in Pakistan on Medikart. Licensed partner pharmacy sourcing & fast Cash on Delivery.`;
    return {
      title: {
        absolute: title,
      },
      description,
      robots: { index: false, follow: true }, // Don't index internal search result pages to preserve crawl equity
    };
  }

  const homepageTitle = 'Medikart | Online Pharmacy in Pakistan - Order Medicines Online';
  const homepageDesc = 'Order authentic prescription and OTC medicines, upload prescriptions via Instant Order, and set up monthly medicine refills through partner pharmacies in Pakistan with Cash on Delivery (COD).';

  return {
    title: {
      absolute: homepageTitle,
    },
    description: homepageDesc,
    keywords: [
      'online pharmacy Pakistan',
      'buy medicine online Pakistan',
      'panadol Pakistan',
      'panadol price in pakistan',
      'buy panadol online',
      'panadol online delivery',
      'augmentin pakistan',
      'pharmacy delivery Lahore',
      'medicine home delivery Karachi',
      'pharmacy Islamabad',
      'prescription upload online',
      'monthly medicine refill pakistan',
      'authentic medicines pakistan',
      'cash on delivery medicine',
      'Medikart',
    ],
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: homepageTitle,
      description: homepageDesc,
      url: siteUrl,
      siteName: 'Medikart',
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: homepageTitle,
      description: homepageDesc,
    },
  };
}

export default async function Home({ searchParams }) {
  const resolvedParams = await searchParams;

  // 301 Permanent Redirect for /?category=x to canonical /categories/[slug]
  if (resolvedParams?.category) {
    let targetSlug = resolvedParams.category;
    try {
      const categoriesRes = await getCategories();
      const categories = categoriesRes?.data?.categories || [];
      const matched = categories.find(
        (c) => c._id === resolvedParams.category || c.slug === resolvedParams.category
      );
      if (matched?.slug) targetSlug = matched.slug;
    } catch (_) {}
    redirect(`/categories/${targetSlug}`, RedirectType.permanent);
  }

  const queryParams = {
    search: resolvedParams?.search || '',
    categoryId: '',
    page: parseInt(resolvedParams?.page, 10) || 1,
    limit: 24,
  };

  const [productsRes, categoriesRes, heroRes, midRes, condRes] = await Promise.all([
    getProducts(queryParams).catch((err) => {
      console.error("Failed to load products:", err);
      return null;
    }),
    getCategories().catch((err) => {
      console.error("Failed to load categories:", err);
      return null;
    }),
    getBanners('hero').catch(() => null),
    getBanners('mid-page').catch(() => null),
    getConditions().catch(() => null),
  ]);

  const productsData = productsRes?.data?.products ? {
    products: productsRes.data.products,
    pagination: productsRes.pagination || {},
  } : { products: [], pagination: {} };

  const categories = categoriesRes?.data?.categories || [];
  const heroBanners = heroRes?.data?.banners || [];
  const midBanners = midRes?.data?.banners || [];
  const conditions = condRes?.data?.conditions || [];

  const { products = [], pagination = {} } = productsData;

  return (
    <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start w-full relative">
      {/* ─── Main Content Stream (Full Width on Mobile/Tablet, Spacious Stream on XL Desktop) ─── */}
      <div className="flex-1 min-w-0 w-full flex flex-col gap-6 sm:gap-8">
        {/* 1. Care By Condition Section (Prominently placed at the top) */}
        <CareByConditionSection initialConditions={conditions} />

        {/* 2. Official Master Brand Hero Section (Contains Prescription Banner, Animated Carousel, and Monthly Medicine Refill) */}
        <OfficialHeroSection
          initialCity="Lahore"
          categories={categories}
          initialProducts={products.slice(0, 6)}
          initialBanners={heroBanners}
        />

        {/* 4. AI Dual Promotional Banners: Baby Nutrition & Refreshment Hydration (Dvago style) */}
        <NutritionRefreshmentBanners />

        {/* 5. Horizontal Category Quick-Links Scroller */}
        <CategoryQuickLinks categories={categories} />

        {/* 6. Mid-Page Promotional Banner Blocks */}
        <MidPagePromoBanners initialBanners={midBanners} categories={categories} />

        {/* 7. Top Pharmaceutical Brands Section */}
        <BrandsSection />

        {/* 8. Health & Wellness Blogs Slider (Fixed Position & Continuous Animation) */}
        <BlogsSection />

        {/* 9. Client-Side In-Place High-Density Product Catalog */}
        <CatalogSection
          initialProducts={products}
          initialPagination={pagination}
          categories={categories}
          initialSearch={queryParams.search}
          initialCategoryId={queryParams.categoryId}
          initialPage={queryParams.page}
        />
      </div>

      {/* ─── Dedicated Moving Health Blogs Right Sidebar (Right edge of screen) ─── */}
      <RightBlogSidebar />
    </div>
  );
}
