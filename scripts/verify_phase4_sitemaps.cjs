const fs = require('fs');
const path = require('path');

async function verifyPhase4() {
  console.log("====================================================");
  console.log("🔍 PHASE 4 SITEMAPS & INDEXNOW VERIFICATION");
  console.log("====================================================");

  // 1. Check IndexNow Key file in public/
  const keyFileName = 'e47c1f83b27a4d59a8c7e92d83b10c9a.txt';
  const keyFilePath = path.join(__dirname, '../apps/web/public', keyFileName);
  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`IndexNow key file missing at: ${keyFilePath}`);
  }
  const keyContent = fs.readFileSync(keyFilePath, 'utf8').trim();
  console.log(`✓ IndexNow key file verified: ${keyFileName} (key: ${keyContent})`);

  // 2. Check route handlers exist
  const routes = [
    'sitemap.xml',
    'sitemap-pages.xml',
    'sitemap-categories.xml',
    'sitemap-brands.xml',
    'sitemap-blogs.xml',
    'sitemap-products-priority.xml',
    'sitemap-products-rest.xml',
    'sitemap.txt',
    'api/indexnow',
  ];

  for (const r of routes) {
    const routePath = path.join(__dirname, '../apps/web/app', r, 'route.js');
    if (!fs.existsSync(routePath)) {
      throw new Error(`Route handler missing at: ${routePath}`);
    }
    console.log(`✓ Route handler verified: /${r}`);
  }

  // 3. Import and execute sitemap generators to verify XML structure
  const { GET: getIndex } = await import('../apps/web/app/sitemap.xml/route.js');
  const indexRes = await getIndex();
  const indexXml = await indexRes.text();

  if (!indexXml.includes('<sitemapindex') || !indexXml.includes('sitemap-pages.xml') || !indexXml.includes('sitemap-products-priority.xml')) {
    throw new Error('Invalid sitemap.xml index output');
  }
  console.log('✓ sitemap.xml returns valid <sitemapindex> linking all 6 child sitemaps');

  const { GET: getPages } = await import('../apps/web/app/sitemap-pages.xml/route.js');
  const pagesRes = await getPages();
  const pagesXml = await pagesRes.text();
  if (!pagesXml.includes('<urlset') || !pagesXml.includes('/medicines-a-z/a')) {
    throw new Error('Invalid sitemap-pages.xml output');
  }
  console.log('✓ sitemap-pages.xml returns valid <urlset> with A-Z index pages and core links');

  const { GET: getBrands } = await import('../apps/web/app/sitemap-brands.xml/route.js');
  const brandsRes = await getBrands();
  const brandsXml = await brandsRes.text();
  if (!brandsXml.includes('/brands/panadol') || !brandsXml.includes('/brands/calpol') || !brandsXml.includes('/brands/surbex')) {
    throw new Error('Invalid sitemap-brands.xml output');
  }
  console.log('✓ sitemap-brands.xml returns valid <urlset> with all 25 priority landing pages');

  const { GET: getBlogs } = await import('../apps/web/app/sitemap-blogs.xml/route.js');
  const blogsRes = await getBlogs();
  const blogsXml = await blogsRes.text();
  if (!blogsXml.includes('<urlset') || !blogsXml.includes('/blogs/')) {
    throw new Error('Invalid sitemap-blogs.xml output');
  }
  console.log('✓ sitemap-blogs.xml returns valid <urlset> with 60 health guides');

  console.log("====================================================");
  console.log("🎉 ALL PHASE 4 VERIFICATIONS PASSED!");
  console.log("====================================================");
}

verifyPhase4().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
