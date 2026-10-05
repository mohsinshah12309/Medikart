const bannerService = require("./banner.service");
const redisClient = require("../../config/redisClient");
const { cacheService, CACHE_POLICIES } = require("../../services/cache/cacheService");

// Public list (active banners by placement)
const getPublicBanners = async (req, res, next) => {
  try {
    const { placement } = req.query;
    const cacheKey = `cache:storefront:banners:${placement || "all"}`;
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.BANNERS,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const banners = await bannerService.getBanners({ placement, active: true });
        return {
          status: "success",
          results: banners.length,
          data: { banners },
        };
      },
    });

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
