/**
 * Product controller — Phase 4.
 *
 * Per rules.md Section 2: controllers stay thin — they read the request, call
 * the service, shape the response. Business rules live in the service layer.
 *
 * All errors are thrown as typed errors (NotFoundError, ValidationError) and
 * caught by the central errorHandler middleware — never send raw status codes
 * or stack traces from here.
 */

const productService = require("./product.service");

/**
 * POST /admin/products — create a new product
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    // Return only the newly created ID for test script compatibility
    res.status(201).json({ _id: product._id });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/products — get all products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { active, isNarcotic, stockStatus, categoryId, search, page, limit } = req.query;

    // Extract query filters if provided
    const filters = {
      active: active === "true" ? true : active === "false" ? false : undefined,
      isNarcotic: isNarcotic === "true" ? true : isNarcotic === "false" ? false : undefined,
      stockStatus,
      categoryId,
      search,
    };

    const Product = require("./product.model");
    const countQuery = {};
    if (filters.active !== undefined) countQuery.active = filters.active;
    if (filters.isNarcotic !== undefined) countQuery.isNarcotic = filters.isNarcotic;
    if (filters.stockStatus) countQuery.stockStatus = filters.stockStatus;
    if (filters.categoryId) countQuery.categoryIds = filters.categoryId;
    if (filters.search) {
      const escapedSearch = filters.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      countQuery.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { genericName: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    const [totalCount, products] = await Promise.all([
      Product.countDocuments(countQuery),
      productService.getAllProducts(filters, page, limit),
    ]);
    
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;

    res.status(200).json({
      status: "success",
      results: products.length,
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        pages: Math.ceil(totalCount / l),
      },
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/products/:id — get a single product
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/products/:id — update a product
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    // Return both _id (for test compatibility) and product data
    res.status(200).json({ _id: product._id, status: "success", data: { product } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/products/:id — delete a product
 */
const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send(); // 204 No Content on successful delete
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/products/:id/narcotics — Phase 11 single product flag update
 */
const setNarcoticFlag = async (req, res, next) => {
  try {
    const product = await productService.setNarcoticFlag(
      req.params.id,
      req.body.isNarcotic,
      req.admin
    );
    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/products/bulk/narcotics — Phase 11 bulk product flag update
 */
const bulkSetNarcoticFlag = async (req, res, next) => {
  try {
    const products = await productService.bulkSetNarcoticFlag(
      req.body.productIds,
      req.body.isNarcotic,
      req.admin
    );
    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/products/narcotics — Phase 11 narcotics audit view
 */
const getNarcoticProducts = async (req, res, next) => {
  try {
    const products = await productService.getNarcoticProducts();
    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  setNarcoticFlag,
  bulkSetNarcoticFlag,
  getNarcoticProducts,
};

