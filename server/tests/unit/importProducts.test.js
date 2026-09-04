/**
 * importProducts.test.js — Phase 9 unit tests for product import script.
 */

const { validateInputFile, importProducts } = require("../../scripts/importProducts");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");
const mongoose = require("mongoose");
const Product = require("../../src/modules/products/product.model");
const Category = require("../../src/modules/categories/category.model");

describe("importProducts file validation", () => {
  test("throws error when file path is missing", () => {
    expect(() => validateInputFile("")).toThrow("No file path provided");
  });

  test("throws error when file does not exist", () => {
    expect(() => validateInputFile("non-existent-file-xyz.xlsx")).toThrow("File not found");
  });

  test("throws error for unsupported file extension", () => {
    const invalidFile = path.join(__dirname, "importProducts.test.js");
    expect(() => validateInputFile(invalidFile)).toThrow("Invalid file type");
  });

  test("accepts valid xlsx file path", () => {
    const sampleFile = path.join(__dirname, "../fixtures/sample_products.xlsx");
    const resolved = validateInputFile(sampleFile);
    expect(resolved).toContain("sample_products.xlsx");
  });
});

describe("importProducts row-level execution", () => {
  const tempFilePath = path.join(__dirname, "temp_test_import.xlsx");

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  afterEach(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test("imports 8 valid products, rejects 2 broken rows, and logs reasons", async () => {
    // Generate test data rows
    const data = [
      ["Item Name", "Generic Name", "B2b Category", "Manufacturer", "Retail Value", "isNarcotic"],
      ["Product 1", "Gen 1", "Medicines", "Mfg 1", 100, "false"],
      ["Product 2", "Gen 2", "Medicines", "Mfg 2", 200, "false"],
      ["Product 3", "Gen 3", "Vitamins", "Mfg 3", 150, "false"],
      ["Product 4", "Gen 4", "Vitamins", "Mfg 4", 250, "false"],
      ["Product 5", "Gen 5", "Milk & Powder", "Mfg 5", 500, "false"],
      ["Product 6", "Gen 6", "Milk & Powder", "Mfg 6", 600, "false"],
      ["Product 7", "Gen 7", "Medicines", "Mfg 7", 120, "true"],
      ["Product 8", "Gen 8", "Vitamins", "Mfg 8", 180, "true"],
      ["Product 9 Bad Price", "Gen 9", "Medicines", "Mfg 9", "", "false"], // missing price
      ["Product 10 Bad Cat", "Gen 10", "Unrecognized Category", "Mfg 10", 300, "false"] // unrecognized category
    ];

    // Create workbook and write to file
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products");
    xlsx.writeFile(workbook, tempFilePath);

    // Spy on console.log / console.error to avoid outputting clutter to test reports
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const result = await importProducts(tempFilePath);

      // Verify returned counts
      expect(result.importedCount).toBe(8);
      expect(result.errors.length).toBe(2);

      // Verify detailed reasons
      expect(result.errors[0]).toEqual({
        row: 10,
        item: "Product 9 Bad Price",
        reason: expect.stringMatching(/Missing or invalid price/i)
      });
      expect(result.errors[1]).toEqual({
        row: 11,
        item: "Product 10 Bad Cat",
        reason: expect.stringMatching(/Unrecognized category/i)
      });

      // Verify DB records
      const productsInDb = await Product.find({}).populate("categoryIds");
      expect(productsInDb.length).toBe(8);

      // Verify individual products and check fields
      const p1 = productsInDb.find(p => p.name === "Product 1");
      expect(p1).toBeDefined();
      expect(p1.price).toBe(100);
      expect(p1.isNarcotic).toBe(false);
      expect(p1.categoryIds[0].name).toBe("Medicines");

      const p7 = productsInDb.find(p => p.name === "Product 7");
      expect(p7).toBeDefined();
      expect(p7.price).toBe(120);
      expect(p7.isNarcotic).toBe(true);

      const p9 = productsInDb.find(p => p.name === "Product 9 Bad Price");
      expect(p9).toBeUndefined();

      const p10 = productsInDb.find(p => p.name === "Product 10 Bad Cat");
      expect(p10).toBeUndefined();

    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  }, 15000);
});
