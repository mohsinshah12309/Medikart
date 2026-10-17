/**
 * CLI script to ping IndexNow with priority URLs or full sitemap
 * Usage:
 *   node scripts/ping-indexnow.js           (submits top priority URLs & 70 blogs)
 *   node scripts/ping-indexnow.js --all     (submits all 6,100+ URLs from sitemap.txt)
 */

const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'b76ac79c65b745efb4dd58e5ec9cfcee';
const SITE_HOST = 'medikart.pk';
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;

const PRIORITY_SLUGS = [
  'panadol', 'calpol', 'disprin', 'surbex', 'cac-1000', 'centrum',
  'ors', 'dettol', 'pyodine', 'polyfax', 'strepsils', 'vicks',
  'sensodyne', 'sunny-d', 'evion', 'neurobion', 'gaviscon',
  'molfix', 'canbebe', 'pampers', 'morinaga', 'meiji', 'lactogen',
  'cerelac', 'accu-chek'
];

const CATEGORIES = [
  'medicines', 'vitamins', 'milk-powder', 'herbal', 'consumer',
  'dermatology', 'diagnostics', 'diapers-babycare', 'patient-supports',
  'otc'
];

async function submitBatch(urlList, batchIndex, totalBatches) {
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const responseText = await res.text();
      console.log(`[Batch ${batchIndex}/${totalBatches}] [${ep}] Status: ${res.status} ${res.statusText} ${responseText ? `- ${responseText.slice(0, 100)}` : ''}`);
    } catch (err) {
      console.error(`[Batch ${batchIndex}/${totalBatches}] [${ep}] Error:`, err.message);
    }
  }
}

async function main() {
  const isAll = process.argv.includes('--all');
  let urlList = [];

  const sitemapTxtPath = path.join(__dirname, '../public/sitemap.txt');

  if (isAll && fs.existsSync(sitemapTxtPath)) {
    const raw = fs.readFileSync(sitemapTxtPath, 'utf8');
    urlList = raw.split(/\r?\n/).map(u => u.trim()).filter(Boolean);
    console.log(`Loaded ${urlList.length} URLs from sitemap.txt for full IndexNow submission.`);
  } else {
    urlList = [
      `https://${SITE_HOST}/`,
      `https://${SITE_HOST}/instant-order`,
      `https://${SITE_HOST}/refill`,
      `https://${SITE_HOST}/blogs`,
      `https://${SITE_HOST}/brands`,
      `https://${SITE_HOST}/faqs`,
      `https://${SITE_HOST}/medicines-a-z/a`,
    ];

    CATEGORIES.forEach(c => urlList.push(`https://${SITE_HOST}/categories/${c}`));
    PRIORITY_SLUGS.forEach(b => urlList.push(`https://${SITE_HOST}/brands/${b}`));

    // Include 70 health blogs
    try {
      const blogsModule = require('../data/blogsData.js');
      const blogs = blogsModule.BLOGS_DATA || [];
      blogs.forEach(b => {
        if (b.slug) urlList.push(`https://${SITE_HOST}/blogs/${b.slug}`);
      });
      console.log(`Included ${blogs.length} health blogs in priority list.`);
    } catch (e) {
      // ignore
    }
  }

  // Deduplicate URLs
  urlList = Array.from(new Set(urlList));
  console.log(`Total unique URLs to submit: ${urlList.length}`);

  // Chunk in batches of 5000 (IndexNow max is 10,000 per call)
  const CHUNK_SIZE = 5000;
  const batches = [];
  for (let i = 0; i < urlList.length; i += CHUNK_SIZE) {
    batches.push(urlList.slice(i, i + CHUNK_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    await submitBatch(batches[i], i + 1, batches.length);
  }

  console.log('✅ IndexNow submission finished successfully.');
}

main().catch(console.error);
