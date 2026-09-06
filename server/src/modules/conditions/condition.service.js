const Condition = require("./condition.model");
const { NotFoundError } = require("../../utils/errors");
const redisClient = require("../../config/redisClient");

const invalidateConditionCache = async () => {
  try {
    if (typeof redisClient.keys === "function") {
      const keys = await redisClient.keys("cache:storefront:conditions:*");
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    await redisClient.del("cache:storefront:conditions:all");
  } catch (err) {
    console.error("[Cache] Condition invalidation error:", err.message);
  }
};

const createCondition = async (data) => {
  if (!data.slug && data.name) {
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  const condition = new Condition(data);
  await condition.save();
  await invalidateConditionCache();
  return condition;
};

const getConditions = async ({ active } = {}) => {
  const query = {};
  if (active !== undefined) query.active = active;

  return Condition.find(query)
    .populate("linkedCategoryIds", "name slug")
    .populate("linkedProductIds", "name genericName price")
    .sort({ displayOrder: 1, name: 1 });
};

const getConditionByIdOrSlug = async (idOrSlug) => {
  let condition;
  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    condition = await Condition.findById(idOrSlug)
      .populate("linkedCategoryIds", "name slug")
      .populate("linkedProductIds", "name genericName price images coverImage");
  } else {
    condition = await Condition.findOne({ slug: idOrSlug })
      .populate("linkedCategoryIds", "name slug")
      .populate("linkedProductIds", "name genericName price images coverImage");
  }
  if (!condition) throw new NotFoundError("Condition not found");
  return condition;
};

const updateCondition = async (id, updateData) => {
  if (updateData.name && !updateData.slug) {
    updateData.slug = updateData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  const condition = await Condition.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!condition) throw new NotFoundError("Condition not found");
  await invalidateConditionCache();
  return condition;
};

const deleteCondition = async (id) => {
  const condition = await Condition.findByIdAndDelete(id);
  if (!condition) throw new NotFoundError("Condition not found");
  await invalidateConditionCache();
  return condition;
};

module.exports = {
  createCondition,
  getConditions,
  getConditionByIdOrSlug,
  updateCondition,
  deleteCondition,
  invalidateConditionCache,
};
