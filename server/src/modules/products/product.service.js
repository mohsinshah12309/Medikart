/**
 * Product service — Phase 4.
 *
 * Per rules.md Section 2: business rules live in the service layer only.
 * Controllers stay thin — they read the request, call the service, shape the
 * response.
 *
 * This service handles CRUD operations for products. Discount calculation
 * (Phase 8) and narcotics gating (Phase 15) will be added in later phases.
 */

const Product = require("./product.model");
const { NotFoundError } = require("../../utils/errors");

/**
 * Create a new product
 */
const createProduct = async (productData) => {
  const product = new Product(productData);
  await product.save();
  return product;
};

const PLACEHOLDER_PATH = "/uploads/placeholder.webp";

/** Helper: attach coverImage and fallback placeholder if no images exist */
const formatProductWithImages = (productDoc) => {
  if (!productDoc) return productDoc;
  const obj = productDoc.toObject ? productDoc.toObject() : { ...productDoc };

  if (!obj.images || obj.images.length === 0) {
    obj.images = [{ path: PLACEHOLDER_PATH, isPrimary: true }];
    obj.coverImage = PLACEHOLDER_PATH;
  } else {
    const primary = obj.images.find((img) => img.isPrimary) || obj.images[0];
    obj.coverImage = primary ? primary.path : obj.images[0].path;
  }

  return obj;
};

/**
 * Get all products (with optional filtering)
 */
const getAllProducts = async (filters = {}) => {
  const query = {};

  // Build query filters if provided
  if (filters.active !== undefined) {
    query.active = filters.active;
  }
  if (filters.isNarcotic !== undefined) {
    query.isNarcotic = filters.isNarcotic;
  }
  if (filters.stockStatus) {
    query.stockStatus = filters.stockStatus;
  }
  if (filters.categoryId) {
    query.categoryIds = filters.categoryId;
  }

  const products = await Product.find(query)
    .populate("categoryIds", "name slug")
    .sort({ createdAt: -1 });

  return products.map(formatProductWithImages);
};

/**
 * Get a single product by ID
 */
const getProductById = async (productId) => {
  const product = await Product.findById(productId).populate(
    "categoryIds",
    "name slug"
  );

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return formatProductWithImages(product);
};

/**
 * Update a product by ID
 */
const updateProduct = async (productId, updateData) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $set: updateData },
    {
      new: true, // return updated document
      runValidators: true, // run schema validators
    }
  ).populate("categoryIds", "name slug");

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return product;
};

/**
 * Delete a product by ID
 */
const deleteProduct = async (productId) => {
  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return product;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
