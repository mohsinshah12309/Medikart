/**
 * Validation middleware helper — Phase 4.
 *
 * Wraps Zod schema validation at the route boundary. Per rules.md Section 2:
 * every request body validated before reaching service logic, with an explicit
 * allow-list of settable fields per request type (mass assignment protection).
 */

const { ValidationError } = require("../utils/errors");

const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and validate the request body against the schema
      // Zod will strip any fields not in the schema (strict mode)
      const validated = schema.parse(req.body);
      req.body = validated; // replace body with validated/stripped version
      next();
    } catch (error) {
      // Zod errors are caught by the central errorHandler
      next(error);
    }
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { validate, validateParams, validateQuery };
