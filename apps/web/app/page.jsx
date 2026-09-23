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
import RightBlogSidebar from '../components/RightBlogSidebar';

export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const categoryParam = resolvedParams?.category;
  const searchParam = resolvedParams?.search;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';

  if (categoryParam) {
    try {
      const categoriesRes = await getCategories();
      if (categoriesRes && categoriesRes.data) {
        const category = categoriesRes.data.categories.find(
          (c) => c._id === categoryParam || c.slug === categoryParam
        );
        if (category) {
          const title = `${category.name} Online in Pakistan | Medikart`;
          const description = `Buy authentic ${category.name} online in Pakistan. Licensed pharmacy sourcing, 2–4 hr rapid delivery in Lahore, Karachi, Islamabad & nationwide Cash on Delivery (COD). Order now on Medikart.`;
          const canonicalUrl = `${siteUrl}/?category=${category.slug || category._id}`;

          return {
            title: {
              absolute: title,
            },
            description,
            keywords: [
              category.name,
              `${category.name} Pakistan`,
              `buy ${category.name} online`,
              `${category.name} price in Pakistan`,
              `${category.name} Lahore`,
              `${category.name} Karachi`,
              `${category.name} Islamabad`,
              'online pharmacy Pakistan',
              'Medikart',
            ],
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

  const homepageTitle = 'Medikart | Online Pharmacy Pakistan - Genuine Medicines';
  const homepageDesc = 'Pakistan\'s trusted licensed online pharmacy. Order 100% genuine prescription medicines, Panadol, Augmentin, vitamins, baby care & OTC health essentials with 2–4 hr rapid delivery in Lahore, Karachi, Islamabad & nationwide Cash on Delivery (COD).';

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
      description: 'Pakistan\'s trusted licensed online pharmacy. Buy genuine prescription medicines, vitamins, baby care & OTC health essentials with 2–4 hr delivery & Cash on Delivery.',
      url: siteUrl,
      siteName: 'Medikart - Authentic Online Pharmacy',
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: homepageTitle,
      description: 'Order genuine prescription & OTC medicines online with fast 2–4 hr delivery and Cash on Delivery across Pakistan.',
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

        {/* 2. Official Master Brand Hero Section (Contains Integrated Monthly Medicine Refill) */}
        <OfficialHeroSection
          initialCity="Lahore"
          categories={categories}
          initialProducts={products.slice(0, 6)}
        />

        {/* 3. Hero Promotional Banner Carousel (Full Width) */}
        {heroBanners && heroBanners.length > 0 && (
          <HeroBannerCarousel initialBanners={heroBanners} />
        )}

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
