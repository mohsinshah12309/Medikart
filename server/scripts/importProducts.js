/**
 * Import Products Script — Phase 9 (Bulk Excel Product Import).
 *
 * Usage:
 *   node server/scripts/importProducts.js [path-to-excel-file]
 *
 * Features:
 *   - File validation: existence, extension check (.xlsx, .xls, .csv), size cap (50MB).
 *   - Error boundary: corrupted files fail safely without crashing.
 *   - Category matching: maps "B2b Category" against active DB Categories.
 *   - Row-level validation: missing price or unrecognized category skips THAT row only.
 *   - Detailed summary: prints total parsed, imported, skipped with row numbers and exact reasons.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const mongoose = require("mongoose");

const { connectDB } = require("../src/config/db");
const Product = require("../src/modules/products/product.model");
const Category = require("../src/modules/categories/category.model");

// Pre-configured valid categories for initial catalog setup
const DEFAULT_CATEGORIES = [
  { name: "Medicines", slug: "medicines" },
  { name: "Vitamins", slug: "vitamins" },
  { name: "Milk & Powder", slug: "milk-powder" },
];

/** Slugify helper for SKU generation */
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Flexibly extract column value by trying multiple header names */
function getColumnValue(row, possibleNames) {
  for (const key of Object.keys(row)) {
    const normalizedKey = key.trim().toLowerCase();
    for (const name of possibleNames) {
      if (normalizedKey === name.toLowerCase()) {
        return row[key];
      }
    }
  }
  return undefined;
}

/** Validate input file path, extension, and size */
function validateInputFile(filePath) {
  if (!filePath) {
    throw new Error("No file path provided. Usage: node importProducts.js <path-to-excel>");
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found at path: ${resolvedPath}`);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const allowedExts = [".xlsx", ".xls", ".csv"];
  if (!allowedExts.includes(ext)) {
    throw new Error(`Invalid file type '${ext}'. Allowed types: ${allowedExts.join(", ")}`);
  }

  const stats = fs.statSync(resolvedPath);
  const maxSizeBytes = 50 * 1024 * 1024; // 50MB
  if (stats.size > maxSizeBytes) {
    throw new Error(`File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds limit of 50MB`);
  }

  return resolvedPath;
}

/** Main Import Execution */
async function importProducts() {
  const inputArg = process.argv[2] || "D:/Mohsin/Downloads/Sample_Item_List_With_Errors.xlsx";

  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 9 — Bulk Excel Product Import");
  console.log("══════════════════════════════════════════════════════\n");

  let filePath;
  try {
    filePath = validateInputFile(inputArg);
    console.log(`📂 Processing file: ${filePath}`);
  } catch (err) {
    console.error(`❌ File Validation Error: ${err.message}`);
    process.exit(1);
  }

  // Connect to Database
  await connectDB();

  // Ensure default categories exist in DB so standard categories are recognized
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({
      $or: [
        { name: new RegExp(`^${cat.name}$`, "i") },
        { slug: cat.slug },
      ],
    });
    if (!existing) {
      await Category.create({ name: cat.name, slug: cat.slug, active: true });
      console.log(`🌱 Seeded category: ${cat.name}`);
    }
  }

  // Build category lookup map (case-insensitive name -> ObjectId)
  const allCategories = await Category.find({ active: true });
  const categoryMap = new Map();
  for (const cat of allCategories) {
    categoryMap.set(cat.name.trim().toLowerCase(), cat._id);
    categoryMap.set(cat.slug.trim().toLowerCase(), cat._id);
  }

  // Parse Excel file safely
  let workbook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (err) {
    console.error(`❌ Failed to parse Excel file: ${err.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`📊 Found ${rows.length} total rows in sheet '${sheetName}'\n`);

  let importedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const excelRowNumber = i + 2; // Row 1 is header
    const row = rows[i];

    // Extract fields using flexible column aliases
    const name = getColumnValue(row, ["Item Name", "Name", "Product Name", "Title"]);
    const genericName = getColumnValue(row, ["Generic Name", "Generic", "Description"]);
    const categoryName = getColumnValue(row, ["B2b Category", "Category", "Category Name"]);
    const manufacturer = getColumnValue(row, ["Manufacturer", "Brand"]);
    const retailValueRaw = getColumnValue(row, ["Retail Value", "Price", "Retail Price"]);
    const isNarcoticRaw = getColumnValue(row, ["isNarcotic", "Narcotic"]);

    // Skip empty or note/footer rows (e.g. rows that don't look like product data)
    if (!name && !categoryName && !retailValueRaw) {
      continue;
    }

    const itemNameStr = String(name || "").trim();

    // Skip header note rows if any got parsed
    if (itemNameStr.toLowerCase().startsWith("note:")) {
      continue;
    }

    // 1. Validate Product Name
    if (!itemNameStr) {
      errors.push({
        row: excelRowNumber,
        item: "Unknown",
        reason: "Missing product name",
      });
      continue;
    }

    // 2. Validate Price / Retail Value
    const retailValueNum = parseFloat(retailValueRaw);
    if (
      retailValueRaw === "" ||
      retailValueRaw === undefined ||
      retailValueRaw === null ||
      isNaN(retailValueNum) ||
      retailValueNum <= 0
    ) {
      errors.push({
        row: excelRowNumber,
        item: itemNameStr,
        reason: `Missing or invalid price / retail value (got: '${retailValueRaw}')`,
      });
      continue;
    }

    // 3. Validate Category
    const categoryStr = String(categoryName || "").trim();
    const categoryId = categoryMap.get(categoryStr.toLowerCase());
    if (!categoryId) {
      errors.push({
        row: excelRowNumber,
        item: itemNameStr,
        reason: `Unrecognized category '${categoryStr}'`,
      });
      continue;
    }

    // Generate unique SKU
    const baseSku = `SKU-${slugify(itemNameStr).slice(0, 30)}`;
    let sku = baseSku;
    let skuSuffix = 1;
    while (await Product.findOne({ sku })) {
      sku = `${baseSku}-${skuSuffix++}`;
    }

    // Determine isNarcotic flag
    const isNarcotic = String(isNarcoticRaw).toLowerCase() === "true" || String(isNarcoticRaw) === "1";

    // Build Product data
    const productData = {
      name: itemNameStr,
      description: genericName ? `Generic: ${genericName}${manufacturer ? ` | Manufacturer: ${manufacturer}` : ""}` : (manufacturer ? `Manufacturer: ${manufacturer}` : ""),
      price: retailValueNum,
      sku,
      categoryIds: [categoryId],
      isNarcotic,
      stockStatus: "in_stock",
      images: [{ path: "/images/placeholder-product.png", isPrimary: true }],
      active: true,
    };

    try {
      await Product.create(productData);
      importedCount++;
      console.log(`  ✅ Row ${excelRowNumber}: Imported '${itemNameStr}' (PKR ${retailValueNum})`);
    } catch (err) {
      errors.push({
        row: excelRowNumber,
        item: itemNameStr,
        reason: `DB Insertion error: ${err.message}`,
      });
    }
  }

  // Summary Output
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Import Execution Summary");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  ✅ Successfully Imported : ${importedCount} products`);
  console.log(`  ❌ Skipped / Failed Rows : ${errors.length} rows\n`);

  if (errors.length > 0) {
    console.log("⚠️  Detailed Error Report:");
    for (const err of errors) {
      console.log(`   • Row ${err.row} [${err.item}]: ${err.reason}`);
    }
  }
  console.log("══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();

  if (errors.length > 0 && importedCount === 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  importProducts().catch((err) => {
    console.error("Fatal error during import:", err.message);
    mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { importProducts, validateInputFile };
