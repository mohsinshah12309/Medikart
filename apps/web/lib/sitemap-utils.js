import { BLOGS_DATA } from '../data/blogsData.js';
import { NOINDEX_CATEGORY_SLUGS } from '../src/seo/category-meta.js';
import { getAllPriorityLandingSlugs } from '../data/priorityLandingPagesData.js';

export const PRIORITY_BRAND_KEYWORDS = [
  'panadol', 'calpol', 'disprin', 'surbex', 'cac-1000', 'cac 1000',
  'centrum', 'ors', 'dettol', 'pyodine', 'polyfax', 'strepsils',
  'vicks', 'sensodyne', 'sunny d', 'sunny-d', 'evion', 'neurobion',
  'gaviscon', 'molfix', 'canbebe', 'pampers', 'morinaga', 'meiji',
  'lactogen', 'cerelac', 'accu-chek', 'accu chek', 'on call'
];

export const FALLBACK_CATEGORIES = [
  { slug: 'medicines', name: 'Medicines' },
  { slug: 'vitamins', name: 'Vitamins & Supplements' },
  { slug: 'milk-powder', name: 'Milk Powder & Baby Food' },
  { slug: 'herbal', name: 'Herbal & Organic' },
  { slug: 'flat-items', name: 'Flat Items' },
  { slug: 'consumer', name: 'Consumer Care' },
  { slug: 'fridge-items', name: 'Fridge Items & Insulins' },
  { slug: 'surgical-items', name: 'Surgical Items' },
  { slug: 'dermatology', name: 'Dermatology & Skin' },
  { slug: 'diagnostics', name: 'Diagnostics & Devices' },
  { slug: 'diapers-babycare', name: 'Diapers & Baby Care' },
  { slug: 'patient-supports', name: 'Patient Supports' },
  { slug: 'general-items', name: 'General Items' },
  { slug: 'beverages', name: 'Beverages & ORS' },
  { slug: 'nutraceutical', name: 'Nutraceutical' },
  { slug: 'otc', name: 'Over The Counter (OTC)' },
];

export function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatUrlXml({ url, lastModified, changeFrequency, priority }) {
  const loc = `<loc>${escapeXml(url)}</loc>`;
  const dateStr = lastModified ? (lastModified instanceof Date ? lastModified.toISOString() : new Date(lastModified).toISOString()) : new Date().toISOString();
  const lastmod = `<lastmod>${dateStr}</lastmod>`;
  const changefreq = changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : '';
  const prio = priority !== undefined ? `<priority>${Number(priority).toFixed(2)}</priority>` : '';

  return `  <url>\n    ${loc}\n    ${lastmod}${changefreq ? `\n    ${changefreq}` : ''}${prio ? `\n    ${prio}` : ''}\n  </url>`;
}

export function buildUrlsetXml(entries) {
  const urlsXml = entries.map(formatUrlXml).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
}

export function buildSitemapIndexXml(sitemaps) {
  const sitemapsXml = sitemaps.map(({ url, lastModified }) => {
    const loc = `<loc>${escapeXml(url)}</loc>`;
    const dateStr = lastModified ? (lastModified instanceof Date ? lastModified.toISOString() : new Date(lastModified).toISOString()) : new Date().toISOString();
    return `  <sitemap>\n    ${loc}\n    <lastmod>${dateStr}</lastmod>\n  </sitemap>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapsXml}\n</sitemapindex>`;
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
}

export function getApiUrl() {
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';
}

/**
 * Fetch and categorize products for sitemaps
 * Partitions products into priority vs rest, filtering out placeholder images & invalid prices
 */
export async function fetchPartitionedProducts() {
  const apiUrl = getApiUrl();
  let rawProducts = [];

  try {
    let res = await fetch(`${apiUrl}/sitemap/products`, { next: { revalidate: 3600, tags: ['products'] } });
    if (!res.ok) {
      res = await fetch(`${apiUrl}/products?limit=100`, { next: { revalidate: 3600 } });
    }
    if (res.ok) {
      const body = await res.json();
      rawProducts = body?.data?.products || [];
    }
  } catch (err) {
    console.error("fetchPartitionedProducts fetch error:", err.message);
  }

  const priorityProducts = [];
  const restProducts = [];
  const excludedProducts = [];

  for (const prod of rawProducts) {
    const slug = (prod.slug || '').trim();
    // Exclude missing slugs or raw ObjectIds to prevent redirects
    if (!slug || /^[a-f\d]{24}$/i.test(slug)) {
      excludedProducts.push(prod);
      continue;
    }

    // Check placeholder images: empty images array or path containing 'placeholder'
    const hasPlaceholder = !prod.images || prod.images.length === 0 || prod.images.some(img => (img.path || '').toLowerCase().includes('placeholder'));
    
    // Check price validity (no zero/negative, no obvious errors > 100k)
    const invalidPrice = prod.price === undefined || prod.price === null || prod.price <= 0 || prod.price > 100000;

    const isNarcoticProd = Boolean(prod.isNarcotic || prod.rxStatus === 'narcotic');

    if (isNarcoticProd || hasPlaceholder || invalidPrice) {
      excludedProducts.push(prod);
      continue; // Exclude from sitemap per Phase 3 rule
    }

    const nameLower = (prod.name || '').toLowerCase();
    const isPriority = PRIORITY_BRAND_KEYWORDS.some(brand => nameLower.includes(brand));

    if (isPriority) {
      priorityProducts.push(prod);
    } else {
      restProducts.push(prod);
    }
  }

  return { priorityProducts, restProducts, excludedProducts };
}

/**
 * Fetch indexable categories (excluding internal / noindex buckets)
 */
export async function fetchIndexableCategories() {
  const apiUrl = getApiUrl();
  let categories = [];

  try {
    const catRes = await fetch(`${apiUrl}/categories`, { next: { revalidate: 3600 } });
    if (catRes.ok) {
      const catBody = await catRes.json();
      categories = catBody?.data?.categories || [];
    }
  } catch (err) {
    console.error("fetchIndexableCategories error:", err.message);
  }

  if (!categories || categories.length === 0) {
    categories = FALLBACK_CATEGORIES;
  }

  return categories.filter(cat => {
    const slug = (cat.slug || '').trim();
    return slug && !NOINDEX_CATEGORY_SLUGS.has(slug);
  });
}
