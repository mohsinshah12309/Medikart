const xlsx = require("xlsx");
const mongoose = require("mongoose");
require("dotenv").config();

function makeSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/medikart");
  const Product = require("../src/modules/products/product.model");
  const Category = require("../src/modules/categories/category.model");

  const wb = xlsx.readFile("D:/Mohsin/Downloads/Extracted_Stock_Items.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const items = xlsx.utils.sheet_to_json(sheet);
  console.log("Excel Total Rows:", items.length);

  const categories = await Category.find({}).lean();
  const catMapByName = new Map();
  categories.forEach(c => {
    catMapByName.set(c.name.toLowerCase(), c._id);
    catMapByName.set(c.slug.toLowerCase(), c._id);
  });

  const defaultMedicinesCatId = catMapByName.get("medicines");
  console.log("Medicines Category ID:", defaultMedicinesCatId);

  const existingProducts = await Product.find({}, { name: 1, sku: 1 }).lean();
  console.log("Existing in DB:", existingProducts.length);

  // Count how many times each name appears in DB
  const dbNameCounts = new Map();
  const existingSkus = new Set(existingProducts.map(p => p.sku));

  existingProducts.forEach(p => {
    const k = p.name.trim().toLowerCase();
    dbNameCounts.set(k, (dbNameCounts.get(k) || 0) + 1);
  });

  let toInsert = [];
  let skuTracker = new Set([...existingSkus]);
  let seenExcelNameCounts = new Map();

  for (const it of items) {
    const rawName = (it["Item Name"] || "").toString().trim();
    if (!rawName) continue;
    const nameKey = rawName.toLowerCase();

    const seenSoFar = seenExcelNameCounts.get(nameKey) || 0;
    seenExcelNameCounts.set(nameKey, seenSoFar + 1);

    const countInDb = dbNameCounts.get(nameKey) || 0;

    // If this occurrence has already been accounted for in DB, skip
    if (seenSoFar < countInDb) {
      continue;
    }

    const generic = (it["Generic Name"] || "").toString().trim();
    const mfr = (it["Manufacturer"] || "").toString().trim();
    const price = Math.round((Number(it["Retail Value"]) || 0) * 100) / 100;
    const b2bCat = (it["B2b Category"] || "").toString().trim();

    let catId = defaultMedicinesCatId;
    if (b2bCat && catMapByName.has(b2bCat.toLowerCase())) {
      catId = catMapByName.get(b2bCat.toLowerCase());
    }

    let baseSku = `SKU-${makeSlug(rawName)}`;
    let sku = baseSku;
    if (skuTracker.has(sku)) {
      sku = `${baseSku}-${it["Item Id"] || Math.floor(Math.random() * 100000)}`;
    }
    skuTracker.add(sku);

    toInsert.push({
      name: rawName,
      genericName: generic,
      description: `Generic: ${generic || "N/A"} | Manufacturer: ${mfr || "N/A"}`,
      price: price,
      sku: sku,
      categoryIds: [catId],
      isNarcotic: false,
      requiresPrescription: false,
      stockStatus: "in_stock",
      images: [
        {
          path: "/images/placeholder-product.png",
          isPrimary: true
        }
      ],
      discount: {
        type: "percentage",
        active: false
      },
      active: true
    });
  }

  console.log("New products to insert:", toInsert.length);
  console.log("Projected total after insert:", existingProducts.length + toInsert.length);

  if (process.argv.includes("--commit")) {
    console.log("Executing insertMany in batches of 200...");
    let inserted = 0;
    const batchSize = 200;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const res = await Product.insertMany(batch);
      inserted += res.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} (${inserted}/${toInsert.length})`);
    }

    const newTotal = await Product.countDocuments({});
    console.log("SUCCESS: New MongoDB Total Products:", newTotal);
  } else {
    console.log("Dry run complete. Run with --commit to apply.");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
