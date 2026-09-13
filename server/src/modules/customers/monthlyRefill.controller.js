/**
 * Monthly Refill Controller — HTTP Handlers.
 */

const monthlyRefillService = require("./monthlyRefill.service");

const getRefillList = async (req, res, next) => {
  try {
    const list = await monthlyRefillService.getRefillList(req.customer.id);
    return res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const list = await monthlyRefillService.addItem(req.customer.id, req.body);
    return res.status(200).json({
      status: "success",
      message: "Item added to monthly refill list",
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const updateItemQuantity = async (req, res, next) => {
  try {
    const list = await monthlyRefillService.updateItemQuantity(
      req.customer.id,
      req.params.itemId,
      req.body.quantity
    );
    return res.status(200).json({
      status: "success",
      message: "Refill item quantity updated",
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const list = await monthlyRefillService.removeItem(
      req.customer.id,
      req.params.itemId
    );
    return res.status(200).json({
      status: "success",
      message: "Item removed from monthly refill list",
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const clearRefillList = async (req, res, next) => {
  try {
    const result = await monthlyRefillService.clearRefillList(req.customer.id);
    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const reorderRefill = async (req, res, next) => {
  try {
    const result = await monthlyRefillService.reorderRefill(
      req.customer.id,
      req.body || {}
    );
    return res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRefillList,
  addItem,
  updateItemQuantity,
  removeItem,
  clearRefillList,
  reorderRefill,
};
