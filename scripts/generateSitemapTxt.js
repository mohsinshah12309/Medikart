const fs = require('fs');
const path = require('path');

async function generate() {
  const baseUrl = 'https://medikart.pk';
  const apiUrl = 'http://127.0.0.1:5000/api/v1';

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

  try {
    const catRes = await fetch(`${apiUrl}/categories`);
    if (catRes.ok) {
      const data = await catRes.json();
      (data?.data?.categories || []).forEach(c => urls.push(`${baseUrl}/categories/${c.slug || c._id}`));
    }
  } catch (e) {
    console.error('cat err:', e.message);
  }

  try {
    const prodRes = await fetch(`${apiUrl}/sitemap/products`);
    if (prodRes.ok) {
      const data = await prodRes.json();
      (data?.data?.products || []).forEach(p => urls.push(`${baseUrl}/products/${p.slug || p._id}`));
    }
  } catch (e) {
    console.error('prod err:', e.message);
  }

  try {
    const blogContent = fs.readFileSync(path.join(__dirname, '..', 'apps', 'web', 'data', 'blogsData.js'), 'utf8');
    const slugMatches = [...blogContent.matchAll(/slug:\s*["']([^"']+)["']/g)].map(m => m[1]);
    const uniqueBlogs = [...new Set(slugMatches)];
    uniqueBlogs.forEach(s => urls.push(`${baseUrl}/blogs/${s}`));
  } catch (e) {
    console.error('blog err:', e.message);
  }

  const outPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'sitemap.txt');
  fs.writeFileSync(outPath, urls.join('\n') + '\n', 'utf8');
  console.log(`Successfully wrote ${urls.length} URLs to ${outPath}`);
}

generate();
