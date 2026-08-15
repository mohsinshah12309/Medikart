/**
 * Image Processor Integration — Phase 10.
 *
 * Uses `sharp` for server-side self-hosted image processing:
 *   - Real content-type validation: inspects image metadata/headers (magic bytes).
 *     Rejects disguised files (e.g. a .exe renamed as .jpg) and corrupted buffers.
 *   - Resizes image to sane max dimensions (max width 1200px, preserves aspect ratio).
 *   - Converts to WebP format with quality=80 compression.
 *   - Returns processed buffer & size details.
 */

const sharp = require("sharp");
const { ValidationError } = require("../utils/errors");

const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;
const ALLOWED_FORMATS = ["jpeg", "png", "webp", "gif", "avif", "tiff", "heif"];

/**
 * Validates and processes an image buffer.
 *
 * @param {Buffer} buffer - Raw file buffer from upload middleware
 * @param {object} [options]
 * @param {number} [options.maxWidth=1200]
 * @param {number} [options.quality=80]
 * @returns {Promise<{ buffer: Buffer, info: object }>}
 */
const processProductImage = async (buffer, options = {}) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ValidationError("Empty or invalid file buffer provided");
  }

  const maxWidth = options.maxWidth || MAX_WIDTH;
  const quality = options.quality || WEBP_QUALITY;

  // 1. Real Content-Type Validation via Sharp Metadata (magic bytes inspection)
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (err) {
    throw new ValidationError("File is corrupted or not a valid image file");
  }

  if (!metadata || !metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
    throw new ValidationError(
      `Unsupported or invalid image content format '${metadata?.format || "unknown"}'`
    );
  }

  // 2. Process image: resize + webp conversion + compression
  try {
    const processedPipeline = sharp(buffer)
      .rotate() // auto-orient EXIF orientation
      .resize({
        width: maxWidth,
        withoutEnlargement: true, // don't upscale small images
        fit: "inside",
      })
      .webp({ quality });

    const { data, info } = await processedPipeline.toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      info: {
        width: info.width,
        height: info.height,
        format: "webp",
        sizeBytes: data.length,
        originalFormat: metadata.format,
      },
    };
  } catch (err) {
    throw new ValidationError(`Failed to process image: ${err.message}`);
  }
};

module.exports = {
  processProductImage,
  MAX_WIDTH,
  WEBP_QUALITY,
  ALLOWED_FORMATS,
};
