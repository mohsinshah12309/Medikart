export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  let products = [];
  let categories = [];
  
  try {
    const prodRes = await fetch('http://127.0.0.1:5000/api/v1/products?limit=5000', { cache: 'no-store' });
    if (prodRes.ok) {
      const prodBody = await prodRes.json();
      products = prodBody?.data?.products || [];
    }
  } catch (err) {
    console.error("Sitemap products fetch fail:", err);
  }

  try {
    const catRes = await fetch('http://127.0.0.1:5000/api/v1/categories', { cache: 'no-store' });
    if (catRes.ok) {
      const catBody = await catRes.json();
      categories = catBody?.data?.categories || [];
    }
  } catch (err) {
    console.error("Sitemap categories fetch fail:", err);
  }

  const sitemapEntries = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
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
      url: `${baseUrl}/instant-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Category dynamic URLs (filtered on home page)
  categories.forEach((cat) => {
    sitemapEntries.push({
      url: `${baseUrl}/?category=${cat._id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  // Product dynamic URLs
  products.forEach((prod) => {
    sitemapEntries.push({
      url: `${baseUrl}/products/${prod._id}`,
      lastModified: prod.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  return sitemapEntries;
}
