import { buildSitemapIndexXml, getBaseUrl } from '../../lib/sitemap-utils.js';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const sitemaps = [
    { url: `${baseUrl}/sitemap-pages.xml`, lastModified: now },
    { url: `${baseUrl}/sitemap-categories.xml`, lastModified: now },
    { url: `${baseUrl}/sitemap-brands.xml`, lastModified: now },
    { url: `${baseUrl}/sitemap-blogs.xml`, lastModified: now },
    { url: `${baseUrl}/sitemap-products-priority.xml`, lastModified: now },
    { url: `${baseUrl}/sitemap-products-rest.xml`, lastModified: now },
  ];

  const xml = buildSitemapIndexXml(sitemaps);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
