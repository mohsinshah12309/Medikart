const express = require("express");
const router = express.Router();
const Product = require("./product.model");
const Category = require("../categories/category.model");
const { getStorewideDiscount } = require("../settings/settings.service");
const { getEffectivePrice } = require("../discounts/discount.service");
const { getDeliveryCharge } = require("../cities/city.service");

// Helper: attach coverImage and fallback placeholder if no images exist
const PLACEHOLDER_PATH = "/uploads/placeholder.webp";
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

// GET /api/v1/products - Public listing/browsing
router.get("/products", async (req, res, next) => {
  try {
    const { search, categoryId, page = 1, limit = 20 } = req.query;
    const query = { active: true };

    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { genericName: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    if (categoryId) {
      query.categoryIds = categoryId;
    }

    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const skip = (p - 1) * l;

    const products = await Product.find(query)
      .populate("categoryIds", "name slug discount active")
      .sort({ name: 1 })
      .skip(skip)
      .limit(l);

    const storewidePercent = await getStorewideDiscount();

    const formattedProducts = products.map((prod) => {
      const formatted = formatProductWithImages(prod);
      const category = formatted.categoryIds?.[0] ?? null;
      const { effectivePrice, appliedDiscount, discountPercent } = getEffectivePrice(
        formatted,
        category,
        storewidePercent
      );
      
      return {
        ...formatted,
        effectivePrice,
        appliedDiscount,
        discountPercent,
      };
    });

    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: formattedProducts.length,
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        pages: Math.ceil(totalCount / l),
      },
      data: { products: formattedProducts },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id - Public detail
router.get("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, active: true })
      .populate("categoryIds", "name slug discount active");

    if (!product) {
      return res.status(404).json({ status: "fail", message: "Product not found" });
    }

    const formatted = formatProductWithImages(product);
    const storewidePercent = await getStorewideDiscount();
    const category = formatted.categoryIds?.[0] ?? null;
    const { effectivePrice, appliedDiscount, discountPercent } = getEffectivePrice(
      formatted,
      category,
      storewidePercent
    );

    res.status(200).json({
      status: "success",
      data: {
        product: {
          ...formatted,
          effectivePrice,
          appliedDiscount,
          discountPercent,
        }
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/categories - Public category listing
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/delivery-charge - Public delivery charge calculator
router.get("/delivery-charge", async (req, res, next) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ status: "fail", message: "City query parameter is required" });
    }
    const charge = await getDeliveryCharge(city);
    res.status(200).json({
      status: "success",
      data: {
        city,
        deliveryCharge: charge,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cities - Public listing of active cities
router.get("/cities", async (req, res, next) => {
  try {
    const { getAllCities } = require("../cities/city.service");
    const cities = await getAllCities({ active: true });
    res.status(200).json({
      status: "success",
      results: cities.length,
      data: { cities },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/content - Public read-only page content for About/Contact pages
router.get("/content", async (req, res, next) => {
  try {
    const { getPageContent } = require("../settings/settings.service");
    const content = await getPageContent();
    res.status(200).json({
      status: "success",
      data: content,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
