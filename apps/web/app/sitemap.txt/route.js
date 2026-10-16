import {
  getBaseUrl,
  fetchIndexableCategories,
  fetchPartitionedProducts
} from '../../lib/sitemap-utils.js';
import { BLOGS_DATA } from '../../data/blogsData.js';
import { getAllPriorityLandingSlugs } from '../../data/priorityLandingPagesData.js';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = getBaseUrl();

  const urls = [
    baseUrl,
    `${baseUrl}/instant-order`,
    `${baseUrl}/refill`,
    `${baseUrl}/blogs`,
    `${baseUrl}/brands`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/faqs`,
    `${baseUrl}/return-refund-policy`,
    `${baseUrl}/privacy-policy`,
    `${baseUrl}/terms-and-conditions`,
  ];

  // A-Z Directory
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(char => {
    urls.push(`${baseUrl}/medicines-a-z/${char}`);
  });

  // Categories
  const categories = await fetchIndexableCategories();
  categories.forEach(cat => {
    urls.push(`${baseUrl}/categories/${cat.slug}`);
  });

  // Brands
  const prioritySlugs = getAllPriorityLandingSlugs();
  prioritySlugs.forEach(slug => {
    urls.push(`${baseUrl}/brands/${slug}`);
  });

  // Blogs
  BLOGS_DATA.forEach(b => {
    if (b.slug) {
      urls.push(`${baseUrl}/blogs/${b.slug}`);
    }
  });

  // Products (Priority + Rest)
  const { priorityProducts, restProducts } = await fetchPartitionedProducts();
  priorityProducts.forEach(prod => {
    urls.push(`${baseUrl}/products/${prod.slug}`);
  });
  restProducts.forEach(prod => {
    urls.push(`${baseUrl}/products/${prod.slug}`);
  });

  const textOutput = urls.join('\n') + '\n';

  return new Response(textOutput, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
