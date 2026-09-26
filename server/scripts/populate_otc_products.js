const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../server/.env") });
const redisClient = require("../src/config/redisClient");

async function populateOtc() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/medikart");
  
  const Category = mongoose.model("Category", new mongoose.Schema({}, { strict: false }));
  const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false }));

  const categories = await Category.find({}).lean();
  const otcCat = categories.find(c => c.slug === "otc" || c.name?.toLowerCase().includes("over the counter"));
  
  if (!otcCat) {
    console.error("❌ OTC Category not found in database!");
    process.exit(1);
  }

  console.log(`✅ Found OTC Category: "${otcCat.name}" (ID: ${otcCat._id}, Slug: ${otcCat.slug})`);

  const vitaminsCat = categories.find(c => c.slug === "vitamins");
  const herbalCat = categories.find(c => c.slug === "herbal");
  const nutraceuticalCat = categories.find(c => c.slug === "nutraceutical");
  const consumerCat = categories.find(c => c.slug === "consumer");
  const flatItemsCat = categories.find(c => c.slug === "flat-items");
  const diapersCat = categories.find(c => c.slug === "diapers-napkins");

  const targetCategoryIds = [
    vitaminsCat?._id,
    herbalCat?._id,
    nutraceuticalCat?._id,
    consumerCat?._id,
    flatItemsCat?._id,
    diapersCat?._id
  ].filter(Boolean);

  const otcKeywords = [
    /panadol/i, /paracetamol/i, /disprin/i, /calpol/i, /brufen/i, /ponstan/i, /volini/i, /deep heat/i,
    /gaviscon/i, /\beno\b/i, /digas/i, /smecta/i, /hydralyte/i, /ispaghol/i, /mucaine/i, /strepsil/i,
    /joshanda/i, /vaporub/i, /sancos/i, /pulmonol/i, /nafsal/i, /cac 1000/i, /surbex/i, /redoxon/i,
    /evion/i, /neurobion/i, /polyfax/i, /betadine/i, /pyodine/i, /dettol/i, /saniplast/i, /burnol/i,
    /lozenge/i, /balm/i, /antacid/i, /\bors\b/i, /rehydration/i, /saline/i,
    /vitamin/i, /calcium/i, /\bzinc\b/i, /\biron\b/i, /fish oil/i, /omega/i, /multivitamin/i,
    /hamdard/i, /qarshi/i, /herbion/i, /sualin/i, /\bsafi\b/i, /cinkara/i, /nutrifactor/i,
    /bandage/i, /cotton/i, /thermometer/i, /sanitizer/i,
    /sunblock/i, /sunscreen/i, /vaseline/i, /moisturi/i, /serum/i, /face wash/i,
    /mouthwash/i, /toothpaste/i, /denture/i, /soap/i, /cleanser/i, /wipes/i,
    /gripe water/i, /bonnisan/i, /colic/i, /sudocrem/i, /tiger balm/i, /iodex/i, /moov/i,
    /fastum/i, /voltral/i, /arinac/i, /sinutab/i, /softin/i, /rigix/i, /telfast/i,
    /rennie/i, /digene/i, /carminative/i, /savlon/i, /somogel/i, /dentonic/i, /sensodyne/i,
    /corsodyl/i, /glucose/i, /pedialyte/i, /infacol/i, /cevit/i, /sangobion/i, /fefol/i,
    /enervit/i, /theragran/i, /trikatu/i
  ];

  const excludeKeywords = [
    /injection/i, /infusion/i, /ampoule/i, /vial\b/i, /insulin/i, /xanax/i, /alprazolam/i,
    /lexotan/i, /bromazepam/i, /diazepam/i, /valium/i, /clonazepam/i, /rivotril/i,
    /tramadol/i, /morphine/i, /methotrexate/i, /chemotherapy/i
  ];

  const query = {
    $and: [
      {
        $or: [
          { categoryIds: { $in: targetCategoryIds } },
          ...otcKeywords.map(rgx => ({ name: rgx })),
          ...otcKeywords.map(rgx => ({ genericName: rgx }))
        ]
      },
      ...excludeKeywords.map(rgx => ({ name: { $not: rgx } })),
      ...excludeKeywords.map(rgx => ({ genericName: { $not: rgx } }))
    ]
  };

  const initialCount = await Product.countDocuments({ categoryIds: otcCat._id });
  console.log(`Current products in OTC category: ${initialCount}`);

  const updateResult = await Product.updateMany(query, {
    $addToSet: { categoryIds: otcCat._id }
  });

  const finalCount = await Product.countDocuments({ categoryIds: otcCat._id });
  console.log(`Updated products in OTC category. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
  console.log(`New total products in OTC category: ${finalCount}`);

  // Flush storefront redis cache
  try {
    const keys = await redisClient.keys("cache:storefront:*");
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} Redis storefront cache keys.`);
    }
  } catch (err) {
    console.warn("Redis cache clear warning:", err.message);
  }

  await mongoose.disconnect();
  console.log("Done!");
}

populateOtc().catch((err) => {
  console.error("Error populating OTC:", err);
  process.exit(1);
});
