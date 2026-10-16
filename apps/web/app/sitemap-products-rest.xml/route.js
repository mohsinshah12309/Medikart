import { buildUrlsetXml, getBaseUrl, fetchPartitionedProducts } from '../../lib/sitemap-utils.js';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const { restProducts } = await fetchPartitionedProducts();

  const entries = restProducts.map(prod => ({
    url: `${baseUrl}/products/${prod.slug}`,
    lastModified: prod.updatedAt ? new Date(prod.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const xml = buildUrlsetXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
