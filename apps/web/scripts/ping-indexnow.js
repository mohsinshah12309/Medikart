/**
 * CLI script to ping IndexNow with priority URLs
 * Usage: node scripts/ping-indexnow.js
 */

const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'e47c1f83b27a4d59a8c7e92d83b10c9a';
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

async function main() {
  const urlList = [
    `https://${SITE_HOST}/`,
    `https://${SITE_HOST}/instant-order`,
    `https://${SITE_HOST}/refill`,
    `https://${SITE_HOST}/blogs`,
    `https://${SITE_HOST}/brands`,
    `https://${SITE_HOST}/faqs`,
  ];

  CATEGORIES.forEach(c => urlList.push(`https://${SITE_HOST}/categories/${c}`));
  PRIORITY_SLUGS.forEach(b => urlList.push(`https://${SITE_HOST}/brands/${b}`));

  console.log(`Submitting ${urlList.length} priority URLs to IndexNow (Bing & IndexNow network)...`);

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
      console.log(`[${ep}] Status: ${res.status} ${res.statusText}`);
    } catch (err) {
      console.error(`[${ep}] Error:`, err.message);
    }
  }

  console.log('IndexNow submission finished.');
}

main().catch(console.error);
