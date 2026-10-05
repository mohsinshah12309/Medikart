const conditionService = require("./condition.service");
const redisClient = require("../../config/redisClient");
const { cacheService, CACHE_POLICIES } = require("../../services/cache/cacheService");

// Public list
const getPublicConditions = async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:conditions:all";
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.CONDITIONS,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const conditions = await conditionService.getConditions({ active: true });
        return {
          status: "success",
          results: conditions.length,
          data: { conditions },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const getPublicConditionDetail = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const cacheKey = `cache:storefront:condition:${idOrSlug}`;
    const responseBody = await cacheService.fetchWithCache({
      key: cacheKey,
      policy: CACHE_POLICIES.CONDITIONS,
      bypassCache: req.query.bypassCache === "true",
      fetcher: async () => {
        const condition = await conditionService.getConditionByIdOrSlug(idOrSlug);
        return {
          status: "success",
          data: { condition },
        };
      },
    });

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

// Admin list
const getAdminConditions = async (req, res, next) => {
  try {
    const { active } = req.query;
    const conditions = await conditionService.getConditions({
      active: active !== undefined ? active === "true" : undefined,
    });
    res.status(200).json({
      status: "success",
      results: conditions.length,
      data: { conditions },
    });
  } catch (error) {
    next(error);
  }
};

const createCondition = async (req, res, next) => {
  try {
    const condition = await conditionService.createCondition(req.body);
    res.status(201).json({
      status: "success",
      data: { condition },
    });
  } catch (error) {
    next(error);
  }
};

const updateCondition = async (req, res, next) => {
  try {
    const condition = await conditionService.updateCondition(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      data: { condition },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCondition = async (req, res, next) => {
  try {
    await conditionService.deleteCondition(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Condition deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicConditions,
  getPublicConditionDetail,
  getAdminConditions,
  createCondition,
  updateCondition,
  deleteCondition,
};
