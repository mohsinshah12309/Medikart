const Blog = require("./blog.model");
const Category = require("../categories/category.model");
const { createBlog, updateBlog, getRelatedProductsForBlog } = require("./blog.service");
const { generateStructuredBlogContent } = require("./blogAi.service");
const { generateBrandedBlogThumbnail } = require("./blogThumbnail.service");
const redisClient = require("../../config/redisClient");

/**
 * Public: GET /api/v1/blogs - List blogs with filtering and caching
 */
exports.getPublicBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const cacheKey = `cache:storefront:blogs:p:${page}:l:${limit}:c:${category || ""}:s:${search || ""}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached && req.query.bypassCache !== "true") {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (_) {}

    const filter = { active: true };
    if (category && category !== "all") {
      filter.$or = [{ categorySlug: category }, { categoryName: new RegExp(category, "i") }];
    }
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      filter.$or = [
        { title: { $regex: cleanSearch, $options: "i" } },
        { summary: { $regex: cleanSearch, $options: "i" } },
        { tags: { $in: [new RegExp(cleanSearch, "i")] } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select("title slug summary thumbnailUrl categoryName categorySlug author readTimeMinutes tags publishedAt")
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const responseBody = {
      status: "success",
      results: blogs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: { blogs },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (_) {}

    return res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

/**
 * Public: GET /api/v1/blogs/:slug - Get single blog with related categories & products
 */
exports.getPublicBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cacheKey = `cache:storefront:blog:${slug}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached && req.query.bypassCache !== "true") {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (_) {}

    const blog = await Blog.findOne({ slug, active: true })
      .populate("category", "name slug image")
      .lean();

    if (!blog) {
      return res.status(404).json({ status: "fail", message: "Article not found" });
    }

    // 1. Fetch related articles in same category
    const relatedBlogs = await Blog.find({
      categorySlug: blog.categorySlug,
      _id: { $ne: blog._id },
      active: true,
    })
      .select("title slug summary thumbnailUrl categoryName readTimeMinutes publishedAt")
      .limit(3)
      .lean();

    // 2. Fetch sibling related categories from Category model
    const relatedCategories = await Category.find({ active: true })
      .select("name slug image icon")
      .limit(4)
      .lean();

    // 3. Fetch related products using existing product queries
    const relatedProducts = await getRelatedProductsForBlog(blog);

    const responseBody = {
      status: "success",
      data: {
        blog,
        relatedBlogs,
        relatedCategories,
        relatedProducts,
      },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (_) {}

    return res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: GET /api/v1/admin/blogs - List all blogs with admin pagination
 */
exports.getAdminBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { categoryName: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (req.query.active !== undefined) {
      filter.active = req.query.active === "true";
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: blogs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: { blogs },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: GET /api/v1/admin/blogs/:id
 */
exports.getAdminBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("category", "name slug");
    if (!blog) {
      return res.status(404).json({ status: "fail", message: "Blog not found" });
    }
    res.status(200).json({ status: "success", data: { blog } });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: POST /api/v1/admin/blogs
 */
exports.createAdminBlog = async (req, res, next) => {
  try {
    const blog = await createBlog(req.body);
    res.status(201).json({ status: "success", data: { blog } });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: PUT /api/v1/admin/blogs/:id
 */
exports.updateAdminBlog = async (req, res, next) => {
  try {
    const blog = await updateBlog(req.params.id, req.body);
    if (!blog) {
      return res.status(404).json({ status: "fail", message: "Blog not found" });
    }
    res.status(200).json({ status: "success", data: { blog } });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: DELETE /api/v1/admin/blogs/:id
 */
exports.deleteAdminBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ status: "fail", message: "Blog not found" });
    }
    res.status(200).json({ status: "success", message: "Blog deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: POST /api/v1/admin/blogs/generate-content - AI-Assisted Structured Blog Generator
 */
exports.generateAiBlogContent = async (req, res, next) => {
  try {
    const { topic, notes, category } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ status: "fail", message: "Topic is required" });
    }

    const generated = await generateStructuredBlogContent({ topic, notes, category });
    res.status(200).json({
      status: "success",
      data: generated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: POST /api/v1/admin/blogs/generate-thumbnail - Auto-generate branded banner preview
 */
exports.generateThumbnailPreview = async (req, res, next) => {
  try {
    const { title, slug, category, author, readTime, bgImage, useAiImage } = req.body;
    if (!title) {
      return res.status(400).json({ status: "fail", message: "Title is required for thumbnail generation" });
    }

    const result = await generateBrandedBlogThumbnail({
      title,
      slug: slug || "preview",
      category,
      author,
      readTime,
      bgImage,
      useAiImage: Boolean(useAiImage),
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
