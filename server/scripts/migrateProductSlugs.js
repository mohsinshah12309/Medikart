/**
 * migrateProductSlugs.js — Generates clean, unique, SEO-friendly slugs for all active products.
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });

const Product = require("../src/modules/products/product.model");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB. Fetching products...");

  const products = await Product.find({}, { _id: 1, name: 1, sku: 1, slug: 1 }).sort({ createdAt: 1 });
  console.log(`Total products to check: ${products.length}`);

  const usedSlugs = new Set();
  const bulkOps = [];
  let updatedCount = 0;

  for (const p of products) {
    let baseSlug = slugify(p.name);
    if (!baseSlug) {
      baseSlug = "product-" + p._id.toString().slice(-6);
    }

    let finalSlug = baseSlug;
    if (usedSlugs.has(finalSlug)) {
      // Append short id suffix for deterministic uniqueness
      finalSlug = `${baseSlug}-${p._id.toString().slice(-6)}`;
    }

    // Ensure completely unique even in edge cases
    let counter = 1;
    while (usedSlugs.has(finalSlug)) {
      counter++;
      finalSlug = `${baseSlug}-${p._id.toString().slice(-6)}-${counter}`;
    }

    usedSlugs.add(finalSlug);

    if (p.slug !== finalSlug) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { slug: finalSlug } },
        },
      });
      updatedCount++;
    }

    if (bulkOps.length >= 1000) {
      await Product.bulkWrite(bulkOps);
      bulkOps.length = 0;
      console.log(`Saved batch... (${updatedCount} processed so far)`);
    }
  }

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
    console.log(`Saved final batch.`);
  }

  console.log(`Successfully migrated ${updatedCount} product slugs! Total unique slugs in set: ${usedSlugs.size}`);

  // Create or sync index
  await Product.syncIndexes();
  console.log("Indexes synchronized successfully.");

  await mongoose.disconnect();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
