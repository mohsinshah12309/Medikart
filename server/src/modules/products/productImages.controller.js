/**
 * Product Images Controller — Phase 10.
 *
 * Implements self-hosted product multi-image pipeline (FR-AD-40):
 *   - POST /api/v1/admin/products/:id/images (multi-file upload)
 *   - PATCH /api/v1/admin/products/:id/images/:imageId/primary (set cover/primary image)
 *   - DELETE /api/v1/admin/products/:id/images/:imageId (delete single image)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Product = require("./product.model");
const { processProductImage } = require("../../integrations/imageProcessor");
const { NotFoundError, ValidationError } = require("../../utils/errors");

const MAX_IMAGES_PER_PRODUCT = 10;
const PLACEHOLDER_PATH = "/uploads/placeholder.webp";

/** Helper: sanitize SKU for safe filesystem directory naming */
const sanitizeFolder = (str) => String(str || "default").replace(/[^a-zA-Z0-9_-]/g, "_");

/**
 * POST /api/v1/admin/products/:id/images
 * Upload 1 or more images for a product.
 */
const uploadProductImages = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const files = req.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new ValidationError("No image files uploaded in request");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // OWASP API4: Cap max images per product
    const currentCount = product.images ? product.images.length : 0;
    if (currentCount + files.length > MAX_IMAGES_PER_PRODUCT) {
      throw new ValidationError(
        `Cannot exceed maximum limit of ${MAX_IMAGES_PER_PRODUCT} images per product. Currently has ${currentCount}.`
      );
    }

    // Ensure uploads directory for product exists
    const skuDir = sanitizeFolder(product.sku);
    const targetDir = path.join(__dirname, "../../../uploads/products", skuDir);
    fs.mkdirSync(targetDir, { recursive: true });

    const newImageDocs = [];

    for (const file of files) {
      // Process image using sharp (validates content, resizes, converts to WebP, compresses)
      const { buffer, info } = await processProductImage(file.buffer);

      // Generate unique filename
      const fileHash = crypto.randomBytes(8).toString("hex");
      const filename = `${fileHash}_${Date.now()}.webp`;
      const diskPath = path.join(targetDir, filename);

      // Write processed WebP to disk
      fs.writeFileSync(diskPath, buffer);

      // Public web URL path
      const publicPath = `/uploads/products/${skuDir}/${filename}`;

      // First image added is set primary if product currently has no images
      const isPrimary = currentCount === 0 && newImageDocs.length === 0;

      newImageDocs.push({
        path: publicPath,
        isPrimary,
        sizeBytes: info.sizeBytes,
      });
    }

    // If new images added and no primary exists, make the first one primary
    if (product.images.length === 0 && newImageDocs.length > 0) {
      newImageDocs[0].isPrimary = true;
    }

    product.images.push(...newImageDocs);
    await product.save();

    res.status(201).json({
      status: "success",
      message: `Successfully uploaded ${newImageDocs.length} image(s)`,
      data: {
        images: product.images,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/products/:id/images/:imageId/primary
 * Set an image as the primary cover image for a product.
 */
const setPrimaryImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const targetImage = product.images.find((img) => img._id.toString() === imageId);
    if (!targetImage) {
      throw new NotFoundError("Image not found on this product");
    }

    // Set target image as primary, unset all others
    product.images.forEach((img) => {
      img.isPrimary = img._id.toString() === imageId;
    });

    await product.save();

    res.status(200).json({
      status: "success",
      message: "Primary cover image updated",
      data: {
        primaryImage: targetImage,
        images: product.images,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/products/:id/images/:imageId
 * Remove a single image from a product and disk.
 */
const deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const targetImage = product.images.find((img) => img._id.toString() === imageId);
    if (!targetImage) {
      throw new NotFoundError("Image not found on this product");
    }

    const wasPrimary = targetImage.isPrimary;
    const relPath = targetImage.path;

    // Delete physical file from disk if not placeholder
    if (relPath && !relPath.includes("placeholder")) {
      const absolutePath = path.join(__dirname, "../../../", relPath);
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.error(`Failed to delete file ${absolutePath}:`, err.message);
        }
      }
    }

    // Remove image subdocument from product
    product.images = product.images.filter((img) => img._id.toString() !== imageId);

    // If deleted image was primary and other images exist, promote first remaining image to primary
    if (wasPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.status(200).json({
      status: "success",
      message: "Image deleted successfully",
      data: {
        images: product.images,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProductImages,
  setPrimaryImage,
  deleteProductImage,
  MAX_IMAGES_PER_PRODUCT,
  PLACEHOLDER_PATH,
};
