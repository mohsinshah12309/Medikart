const conditionService = require("./condition.service");
const redisClient = require("../../config/redisClient");

// Public list
const getPublicConditions = async (req, res, next) => {
  try {
    const cacheKey = "cache:storefront:conditions:all";
    let cached = null;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (err) {
      console.error("[Cache] Condition read error:", err.message);
    }

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const conditions = await conditionService.getConditions({ active: true });
    const responseBody = {
      status: "success",
      results: conditions.length,
      data: { conditions },
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseBody), "EX", 300);
    } catch (err) {
      console.error("[Cache] Condition write error:", err.message);
    }

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const getPublicConditionDetail = async (req, res, next) => {
  try {
    const condition = await conditionService.getConditionByIdOrSlug(req.params.idOrSlug);
    res.status(200).json({
      status: "success",
      data: { condition },
    });
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
