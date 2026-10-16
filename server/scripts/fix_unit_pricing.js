/**
 * Fix Unit Pricing Glitch in Catalog
 * 
 * Multiplies per-tablet/per-unit prices back to full pack prices based on quantity extracted from product titles.
 * NEVER deletes or archives any products. ONLY updates the `price` field.
 * Creates an exact JSON rollback backup before applying changes.
 * 
 * Usage:
 *   node scripts/fix_unit_pricing.js --dry-run
 *   node scripts/fix_unit_pricing.js --execute
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

function extractPackQuantity(title) {
  if (!title) return null;
  // 1. Remove composite dosages with slashes e.g. 50/150/160, 10/5/1000, 400/60mg
  let cleaned = title.replace(/\b\d+(\/\d+)+(\s*(mg|mcg|g|ml))?\b/gi, ' ');
  // 2. Remove standard dosages with units e.g. 500mg, 10mcg, 1.5liter, 20%, 5000iu
  cleaned = cleaned.replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|liter|litre|iu|%)\b/gi, ' ');
  // 3. Remove standalone parenthesized dosages e.g. (500), (20/12.5)
  cleaned = cleaned.replace(/\(\s*\d+(\.\d+)?\s*\)/g, ' ');

  // 4. Match pack quantity:
  // e.g. "30's", "30s", "30 tablets", "14 capsules", "10 sachets", "200 lancets"
  const QTY_REGEX = /(\b|\()(\d{1,4})\s*['’]?(tablets?|capsules?|tabs?|caps?|sachets?|lancets?|strips?|softgels?|pills?|s)\b/i;
  const match = cleaned.match(QTY_REGEX);
  if (match) {
    const qty = parseInt(match[2], 10);
    // Standard medicine packs in Pakistan are between 2 and 1000
    if (qty >= 2 && qty <= 1000) return qty;
  }
  return null;
}

async function run() {
  const isExecute = process.argv.includes('--execute');

  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const collection = mongoose.connection.collection('products');
  const products = await collection.find({}).toArray();
  console.log(`Loaded ${products.length} total products from database.`);

  const updates = [];
  const backupData = [];

  for (const p of products) {
    const qty = extractPackQuantity(p.name);
    if (!qty) continue;

    // Detection criteria for unit/per-tablet price glitch:
    // 1. Recurring floating decimal division from pack MRP (e.g. 11.96666666666667, 3.635)
    // 2. Price is abnormally low for large quantity packs (e.g. 100 tablets for < 50 PKR, 30 tablets for < 25 PKR)
    const hasDecimalDivision = p.price % 1 !== 0 && (p.price.toString().split('.')[1]?.length >= 3);
    const isVeryLowForQty = (qty >= 100 && p.price < 50) || 
                           (qty >= 50 && p.price < 35) || 
                           (qty >= 20 && p.price < 25) || 
                           (qty >= 10 && p.price < 15);
    const isBrandedUnitTablet = (qty >= 6 && p.price < 90) || (qty >= 2 && p.price <= 40);

    if (hasDecimalDivision || isVeryLowForQty || isBrandedUnitTablet) {
      let newPrice = p.price * qty;
      // Snap to integer if within 0.05 of a whole number (e.g. 549.999999 -> 550)
      if (Math.abs(newPrice - Math.round(newPrice)) < 0.05) {
        newPrice = Math.round(newPrice);
      } else {
        newPrice = Math.round(newPrice * 100) / 100;
      }

      backupData.push({
        id: p._id.toString(),
        name: p.name,
        qty,
        oldPrice: p.price,
        newPrice,
      });

      updates.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { price: newPrice } },
        },
      });
    }
  }

  console.log(`\nIdentified ${updates.length} products with unit price glitch to update.`);

  // Save backup file
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `price_fix_backup_${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✓ Backup saved to: ${backupPath}`);

  if (!isExecute) {
    console.log('\n[DRY RUN MODE] No changes written to database.');
    console.log('Sample 10 items that will be updated:');
    backupData.slice(0, 10).forEach(b => {
      console.log(`  ${b.name} (${b.qty} units) | Old: Rs. ${b.oldPrice} --> New: Rs. ${b.newPrice}`);
    });
    console.log('\nTo apply changes, run:');
    console.log('  node scripts/fix_unit_pricing.js --execute');
  } else {
    console.log(`\n[EXECUTE MODE] Updating ${updates.length} products in MongoDB Atlas...`);
    // Run in chunks of 500 for maximum stability
    const chunkSize = 500;
    let modifiedTotal = 0;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const res = await collection.bulkWrite(chunk, { ordered: false });
      modifiedTotal += res.modifiedCount;
      console.log(`  Processed ${Math.min(i + chunkSize, updates.length)} / ${updates.length} updates...`);
    }

    console.log(`\n✓ SUCCESS! Updated ${modifiedTotal} product prices in MongoDB.`);
    console.log(`✓ Catalog remains 100% intact (0 products deleted, 0 products archived).`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
