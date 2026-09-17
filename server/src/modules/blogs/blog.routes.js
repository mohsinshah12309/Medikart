const express = require("express");
const router = express.Router();
const blogController = require("./blog.controller");
const auth = require("../../middleware/auth");
const requirePermission = require("../../middleware/requirePermission");

// Public Storefront Endpoints
router.get("/blogs", blogController.getPublicBlogs);
router.get("/blogs/:slug", blogController.getPublicBlogBySlug);

// Admin-Only Protected Endpoints
router.get("/admin/blogs", auth, blogController.getAdminBlogs);
router.get("/admin/blogs/:id", auth, blogController.getAdminBlogById);
router.post("/admin/blogs", auth, blogController.createAdminBlog);
router.put("/admin/blogs/:id", auth, blogController.updateAdminBlog);
router.delete("/admin/blogs/:id", auth, blogController.deleteAdminBlog);

// AI Content Generation & Thumbnail Generation Actions
router.post("/admin/blogs/generate-content", auth, blogController.generateAiBlogContent);
router.post("/admin/blogs/generate-thumbnail", auth, blogController.generateThumbnailPreview);

module.exports = router;
