const express = require("express");
const requirePermission = require("../../middleware/requirePermission");
const router = express.Router();
const bannerController = require("./banner.controller");

// Admin CRUD routes (mounted under /api/v1/admin/banners)
router.get("/", requirePermission("view_banners", "manage_banners"), bannerController.getAdminBanners);
router.post("/", requirePermission("manage_banners"), bannerController.createBanner);
router.put("/:id", requirePermission("manage_banners"), bannerController.updateBanner);
router.patch("/:id", bannerController.updateBanner);
router.delete("/:id", requirePermission("manage_banners"), bannerController.deleteBanner);

module.exports = router;
