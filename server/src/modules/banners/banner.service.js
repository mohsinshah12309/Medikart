const Banner = require("./banner.model");
const { NotFoundError } = require("../../utils/errors");
const redisClient = require("../../config/redisClient");

const invalidateBannerCache = async () => {
  try {
    if (typeof redisClient.keys === "function") {
      const keys = await redisClient.keys("cache:storefront:banners:*");
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    await redisClient.del("cache:storefront:banners:all");
  } catch (err) {
    console.error("[Cache] Banner invalidation error:", err.message);
  }
};

const createBanner = async (data) => {
  const banner = new Banner(data);
  await banner.save();
  await invalidateBannerCache();
  return banner;
};

const getBanners = async ({ placement, active } = {}) => {
  const query = {};
  if (placement) query.placement = placement;
  if (active !== undefined) query.active = active;

  return Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });
};

const getBannerById = async (id) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new NotFoundError("Banner not found");
  return banner;
};

const updateBanner = async (id, updateData) => {
  const banner = await Banner.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!banner) throw new NotFoundError("Banner not found");
  await invalidateBannerCache();
  return banner;
};

const deleteBanner = async (id) => {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw new NotFoundError("Banner not found");
  await invalidateBannerCache();
  return banner;
};

module.exports = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  invalidateBannerCache,
};
