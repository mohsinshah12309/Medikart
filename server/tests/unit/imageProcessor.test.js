/**
 * Unit tests for Image Processor — Phase 10.
 */

const fs = require("fs");
const path = require("path");
const { processProductImage } = require("../../src/integrations/imageProcessor");

describe("imageProcessor — content validation & WebP conversion", () => {
  const sampleImagePath = "D:/Projects/testing/Acefer (50Mg5Ml) 120Ml Syrup.png";

  test("successfully processes a real image file into compressed WebP", async () => {
    const rawBuffer = fs.readFileSync(sampleImagePath);
    const result = await processProductImage(rawBuffer);

    expect(result).toBeDefined();
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.info.format).toBe("webp");
    expect(result.info.width).toBeLessThanOrEqual(1200);
    expect(result.info.sizeBytes).toBeLessThan(150 * 1024); // under 150KB
  });

  test("rejects a renamed fake file (non-image content disguised as .jpg)", async () => {
    const fakeBuffer = Buffer.from("MZ9000... fake executable binary content disguised as jpg");
    await expect(processProductImage(fakeBuffer)).rejects.toThrow("File is corrupted or not a valid image file");
  });

  test("rejects a truncated / corrupted image buffer gracefully", async () => {
    const truncatedBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // incomplete JPEG header
    await expect(processProductImage(truncatedBuffer)).rejects.toThrow("corrupted or not a valid image file");
  });

  test("rejects empty buffer", async () => {
    await expect(processProductImage(Buffer.alloc(0))).rejects.toThrow("Empty or invalid file buffer");
  });
});
