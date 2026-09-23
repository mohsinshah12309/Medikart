import { BLOGS_DATA } from '../data/blogsData';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';
  
  let products = [];
  let categories = [];
  let dynamicBlogs = [];
  
  try {
    const prodRes = await fetch(`${apiUrl}/products?limit=5000`, { next: { revalidate: 3600 } });
    if (prodRes.ok) {
      const prodBody = await prodRes.json();
      products = prodBody?.data?.products || [];
    }
  } catch (err) {
    console.error("Sitemap products fetch fail:", err.message);
  }

  try {
    const catRes = await fetch(`${apiUrl}/categories`, { next: { revalidate: 3600 } });
    if (catRes.ok) {
      const catBody = await catRes.json();
      categories = catBody?.data?.categories || [];
    }
  } catch (err) {
    console.error("Sitemap categories fetch fail:", err.message);
  }

  try {
    const blogRes = await fetch(`${apiUrl}/blogs?limit=100`, { next: { revalidate: 3600 } });
    if (blogRes.ok) {
      const blogBody = await blogRes.json();
      dynamicBlogs = blogBody?.data?.blogs || [];
    }
  } catch (err) {
    console.error("Sitemap blogs fetch fail:", err.message);
  }

  const sitemapEntries = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/instant-order`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/refill`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/press`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/return-refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Category dynamic URLs (filtered on home page)
  categories.forEach((cat) => {
    sitemapEntries.push({
      url: `${baseUrl}/?category=${cat.slug || cat._id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Product dynamic URLs
  products.forEach((prod) => {
    sitemapEntries.push({
      url: `${baseUrl}/products/${prod._id}`,
      lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  // Blog articles (combine static seed blogs + dynamic DB blogs)
  const blogSlugs = new Set();
  
  dynamicBlogs.forEach((b) => {
    if (b.slug && !blogSlugs.has(b.slug)) {
      blogSlugs.add(b.slug);
      sitemapEntries.push({
        url: `${baseUrl}/blogs/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  BLOGS_DATA.forEach((b) => {
    if (b.slug && !blogSlugs.has(b.slug)) {
      blogSlugs.add(b.slug);
      sitemapEntries.push({
        url: `${baseUrl}/blogs/${b.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  return sitemapEntries;
}

