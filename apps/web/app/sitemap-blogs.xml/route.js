import { buildUrlsetXml, getBaseUrl, getApiUrl } from '../../lib/sitemap-utils.js';
import { BLOGS_DATA } from '../../data/blogsData.js';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();
  const apiUrl = getApiUrl();
  const now = new Date();

  const blogSlugs = new Set();
  const entries = [];

  // 1. Dynamic blogs from DB
  try {
    const res = await fetch(`${apiUrl}/blogs?limit=100`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const body = await res.json();
      const dbBlogs = body?.data?.blogs || [];
      dbBlogs.forEach(b => {
        const slug = (b.slug || '').trim();
        if (slug && !blogSlugs.has(slug)) {
          blogSlugs.add(slug);
          entries.push({
            url: `${baseUrl}/blogs/${slug}`,
            lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }
  } catch (err) {
    console.error("sitemap-blogs fetch error:", err.message);
  }

  // 2. Curated & enhanced health guides
  const baseDate = new Date('2026-09-06T00:00:00Z');
  BLOGS_DATA.forEach(b => {
    const slug = (b.slug || '').trim();
    if (slug && !blogSlugs.has(slug)) {
      blogSlugs.add(slug);
      let blogDate = baseDate;
      if (b.date) {
        const parsed = new Date(b.date);
        if (!isNaN(parsed.getTime())) blogDate = parsed;
      }
      entries.push({
        url: `${baseUrl}/blogs/${slug}`,
        lastModified: blogDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  const xml = buildUrlsetXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
