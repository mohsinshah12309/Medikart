const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

async function testFetch() {
  const start = Date.now();
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const products = await db.collection('products').find(
    { active: true },
    { projection: { _id: 1, slug: 1, name: 1, price: 1, images: 1, stockStatus: 1, requiresPrescription: 1, updatedAt: 1 } }
  ).toArray();

  const elapsed = Date.now() - start;
  console.log(`Fetched ${products.length} products in ${elapsed}ms`);

  // Count priority vs rest vs placeholder
  const priorityBrands = ['panadol', 'calpol', 'disprin', 'surbex', 'cac-1000', 'cac 1000', 'centrum', 'ors', 'dettol', 'pyodine', 'polyfax', 'strepsils', 'vicks', 'sensodyne', 'sunny d', 'sunny-d', 'evion', 'neurobion', 'gaviscon', 'molfix', 'canbebe', 'pampers', 'morinaga', 'meiji', 'lactogen', 'cerelac', 'accu-chek', 'accu chek'];

  let placeholderCount = 0;
  let zeroPriceCount = 0;
  let priorityCount = 0;
  let restCount = 0;

  for (const p of products) {
    const hasPlaceholder = !p.images || p.images.length === 0 || p.images.some(img => (img.path || '').toLowerCase().includes('placeholder'));
    const invalidPrice = !p.price || p.price <= 0 || p.price > 100000;

    if (hasPlaceholder) {
      placeholderCount++;
      continue; // Exclude from sitemap
    }
    if (invalidPrice) {
      zeroPriceCount++;
      continue; // Exclude from sitemap
    }

    const nameLower = (p.name || '').toLowerCase();
    const isPriority = priorityBrands.some(brand => nameLower.includes(brand));
    if (isPriority) {
      priorityCount++;
    } else {
      restCount++;
    }
  }

  console.log({
    total: products.length,
    excludedPlaceholder: placeholderCount,
    excludedInvalidPrice: zeroPriceCount,
    priorityProducts: priorityCount,
    restProducts: restCount,
    totalIndexedInSitemaps: priorityCount + restCount
  });

  await mongoose.disconnect();
}

testFetch().catch(console.error);
