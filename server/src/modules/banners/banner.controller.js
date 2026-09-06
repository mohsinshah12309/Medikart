const bannerService = require("./banner.service");
const redisClient = require("../../config/redisClient");

// Public list (active banners by placement)
const getPublicBanners = async (req, res, next) => {
  try {
    const { placement } = req.query;
    const cacheKey = `cache:storefront:banners:${placement || "all"}`;

    let cached = null;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (err) {
      console.error("[Cache] Banner read error:", err.message);
    }

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const banners = await bannerService.getBanners({ placement, active: true });
    const responseBody = {
      status: "success",
      results: banners.length,
      data: { banners },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (err) {
      console.error("[Cache] Banner write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

// Admin list
const getAdminBanners = async (req, res, next) => {
  try {
    const { placement, active } = req.query;
    const banners = await bannerService.getBanners({
      placement,
      active: active !== undefined ? active === "true" : undefined,
    });
    res.status(200).json({
      status: "success",
      results: banners.length,
      data: { banners },
    });
  } catch (error) {
    next(error);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body);
    res.status(201).json({
      status: "success",
      data: { banner },
    });
  } catch (error) {
    next(error);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.updateBanner(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      data: { banner },
    });
  } catch (error) {
    next(error);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    await bannerService.deleteBanner(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Banner deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
