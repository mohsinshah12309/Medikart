import { BLOGS_DATA } from '../../data/blogsData.js';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';

  let products = [];
  let categories = [];
  let dynamicBlogs = [];

  try {
    let prodRes = await fetch(`${apiUrl}/sitemap/products`, { next: { revalidate: 3600, tags: ['products'] } });
    if (!prodRes.ok) {
      prodRes = await fetch(`${apiUrl}/products?limit=100`, { next: { revalidate: 3600 } });
    }
    if (prodRes.ok) {
      const prodBody = await prodRes.json();
      products = prodBody?.data?.products || [];
    }
  } catch (err) {
    console.error("sitemap.txt products fetch fail:", err.message);
  }

  try {
    const catRes = await fetch(`${apiUrl}/categories`, { next: { revalidate: 3600 } });
    if (catRes.ok) {
      const catBody = await catRes.json();
      categories = catBody?.data?.categories || [];
    }
  } catch (err) {
    console.error("sitemap.txt categories fetch fail:", err.message);
  }

  try {
    const blogRes = await fetch(`${apiUrl}/blogs?limit=100`, { next: { revalidate: 3600 } });
    if (blogRes.ok) {
      const blogBody = await blogRes.json();
      dynamicBlogs = blogBody?.data?.blogs || [];
    }
  } catch (err) {
    console.error("sitemap.txt blogs fetch fail:", err.message);
  }

  const urls = [
    baseUrl,
    `${baseUrl}/instant-order`,
    `${baseUrl}/refill`,
    `${baseUrl}/blogs`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/faqs`,
    `${baseUrl}/return-refund-policy`,
    `${baseUrl}/privacy-policy`,
    `${baseUrl}/terms-and-conditions`,
  ];

  // Category clean URLs
  categories.forEach((cat) => {
    urls.push(`${baseUrl}/categories/${cat.slug || cat._id}`);
  });

  // Product clean URLs
  products.forEach((prod) => {
    urls.push(`${baseUrl}/products/${prod.slug || prod._id}`);
  });

  // Blog URLs (Set for uniqueness)
  const blogSlugs = new Set();
  dynamicBlogs.forEach((b) => {
    if (b.slug && !blogSlugs.has(b.slug)) {
      blogSlugs.add(b.slug);
      urls.push(`${baseUrl}/blogs/${b.slug}`);
    }
  });

  BLOGS_DATA.forEach((b) => {
    if (b.slug && !blogSlugs.has(b.slug)) {
      blogSlugs.add(b.slug);
      urls.push(`${baseUrl}/blogs/${b.slug}`);
    }
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
