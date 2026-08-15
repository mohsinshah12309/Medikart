/**
 * importProducts.test.js — Phase 9 unit tests for file validation helper.
 */

const { validateInputFile } = require("../../scripts/importProducts");
const path = require("path");

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
    const sampleFile = "D:/Mohsin/Downloads/Sample_Item_List_With_Errors.xlsx";
    const resolved = validateInputFile(sampleFile);
    expect(resolved).toContain("Sample_Item_List_With_Errors.xlsx");
  });
});
