import { buildUrlsetXml, getBaseUrl, getApiUrl } from '../../lib/sitemap-utils.js';
import { getAllPriorityLandingSlugs } from '../../data/priorityLandingPagesData.js';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();
  const now = new Date();
  const apiUrl = getApiUrl();

  const brandSlugs = new Set();
  const entries = [];

  // 1. All 25 priority landing pages (high authority priority 0.9)
  const prioritySlugs = getAllPriorityLandingSlugs();
  prioritySlugs.forEach(slug => {
    brandSlugs.add(slug);
    entries.push({
      url: `${baseUrl}/brands/${slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  });

  // 2. Fetch any other backend brand hubs
  try {
    const res = await fetch(`${apiUrl}/brands`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const body = await res.json();
      const hubs = body?.data?.brands || body?.data || [];
      if (Array.isArray(hubs)) {
        hubs.forEach(b => {
          const slug = (b.slug || '').trim();
          if (slug && !brandSlugs.has(slug)) {
            brandSlugs.add(slug);
            entries.push({
              url: `${baseUrl}/brands/${slug}`,
              lastModified: now,
              changeFrequency: 'weekly',
              priority: 0.8,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("sitemap-brands fetch error:", err.message);
  }

  const xml = buildUrlsetXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
