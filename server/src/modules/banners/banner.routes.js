const express = require("express");
const router = express.Router();
const bannerController = require("./banner.controller");

// Admin CRUD routes (mounted under /api/v1/admin/banners)
router.get("/", bannerController.getAdminBanners);
router.post("/", bannerController.createBanner);
router.put("/:id", bannerController.updateBanner);
router.patch("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
