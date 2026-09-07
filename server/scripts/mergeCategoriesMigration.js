const path = require('path');
const serverDir = path.resolve(__dirname, '..');
const mongoose = require(path.join(serverDir, 'node_modules/mongoose'));
const dotenv = require(path.join(serverDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(serverDir, '.env') });

async function runMigration() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const categoriesCol = db.collection('categories');
  const productsCol = db.collection('products');

  console.log('\n--- 1. MERGING NUTRA & NUTRACEUTICALS INTO NUTRACEUTICAL ---');
  let nutraceuticalsCat = await categoriesCol.findOne({
    $or: [{ slug: 'nutraceuticals' }, { name: /Nutraceuticals/i }]
  });
  let nutraCat = await categoriesCol.findOne({
    $or: [{ slug: 'nutra' }, { name: /^Nutra$/i }]
  });

  let targetNutraId;
  if (nutraceuticalsCat) {
    targetNutraId = nutraceuticalsCat._id;
    await categoriesCol.updateOne(
      { _id: targetNutraId },
      { $set: { name: 'Nutraceutical', slug: 'nutraceutical' } }
    );
    console.log(`Updated category ${targetNutraId} to name: "Nutraceutical", slug: "nutraceutical"`);
  } else {
    const res = await categoriesCol.insertOne({
      name: 'Nutraceutical',
      slug: 'nutraceutical',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    targetNutraId = res.insertedId;
    console.log(`Created new category ${targetNutraId} with name: "Nutraceutical", slug: "nutraceutical"`);
  }

  if (nutraCat && nutraCat._id.toString() !== targetNutraId.toString()) {
    const migratedProducts = await productsCol.updateMany(
      { category: nutraCat._id },
      { $set: { category: targetNutraId } }
    );
    console.log(`Migrated ${migratedProducts.modifiedCount} products from Nutra (${nutraCat._id}) to Nutraceutical (${targetNutraId})`);
    await categoriesCol.deleteOne({ _id: nutraCat._id });
    console.log(`Deleted obsolete category "Nutra" (${nutraCat._id})`);
  }

  console.log('\n--- 2. MERGING SURGICAL & SURGICAL FURNITURE INTO SURGICAL ITEMS ---');
  let surgicalCat = await categoriesCol.findOne({
    $or: [{ slug: 'surgical' }, { name: /^Surgical$/i }]
  });
  let surgicalFurnCat = await categoriesCol.findOne({
    $or: [{ slug: 'surgical-furniture' }, { name: /Surgical Furniture/i }]
  });

  let targetSurgicalId;
  if (surgicalCat) {
    targetSurgicalId = surgicalCat._id;
    await categoriesCol.updateOne(
      { _id: targetSurgicalId },
      { $set: { name: 'Surgical Items', slug: 'surgical-items' } }
    );
    console.log(`Updated category ${targetSurgicalId} to name: "Surgical Items", slug: "surgical-items"`);
  } else {
    const res = await categoriesCol.insertOne({
      name: 'Surgical Items',
      slug: 'surgical-items',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    targetSurgicalId = res.insertedId;
    console.log(`Created new category ${targetSurgicalId} with name: "Surgical Items", slug: "surgical-items"`);
  }

  if (surgicalFurnCat && surgicalFurnCat._id.toString() !== targetSurgicalId.toString()) {
    const migratedProducts = await productsCol.updateMany(
      { category: surgicalFurnCat._id },
      { $set: { category: targetSurgicalId } }
    );
    console.log(`Migrated ${migratedProducts.modifiedCount} products from Surgical Furniture (${surgicalFurnCat._id}) to Surgical Items (${targetSurgicalId})`);
    await categoriesCol.deleteOne({ _id: surgicalFurnCat._id });
    console.log(`Deleted obsolete category "Surgical Furniture" (${surgicalFurnCat._id})`);
  }

  const allCats = await categoriesCol.find({}).sort({ name: 1 }).toArray();
  console.log('\n--- UPDATED CATEGORIES LIST --- (Total: ' + allCats.length + ')');
  allCats.forEach(c => console.log(`• ${c._id} | "${c.name}" | slug: "${c.slug}"`));

  await mongoose.disconnect();
  console.log('\nMigration successfully completed.');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
