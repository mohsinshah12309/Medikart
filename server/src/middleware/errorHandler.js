/**
 * Central error handler middleware — Phase 4.
 *
 * Per rules.md Section 2: one central errorHandler middleware; controllers
 * throw typed errors (NotFoundError, ValidationError, etc.), never send a raw
 * res.status(500) with a stack trace to the client.
 *
 * This catches all errors thrown in routes/controllers/services and formats
 * them consistently.
 */

const { AppError } = require("../utils/errors");

const errorHandler = (err, req, res, next) => {
  // If it's one of our known operational errors (AppError subclasses)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // For Zod validation errors (from zod.parse failures)
  if (err.name === "ZodError") {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // For Mongoose validation errors
  if (err.name === "ValidationError" && err.errors) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      details: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // For Mongoose CastError (invalid ObjectId format)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // For duplicate key errors (MongoDB unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      status: "error",
      message: `Duplicate value for field: ${field}`,
    });
  }

  // For Multer errors (file upload size/limits) (Phase 22 / Step 6)
  if (err.name === "MulterError") {
    const isSizeLimit = err.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({
      status: "error",
      message: isSizeLimit ? "File too large" : err.message,
    });
  }

  // Handle standard HTTP/Express errors (e.g., body-parser 413 Payload Too Large or 400 Malformed JSON)
  if (err.status || err.statusCode) {
    const statusCode = err.status || err.statusCode;
    return res.status(statusCode).json({
      status: "error",
      message: err.message || "Request failed",
    });
  }

  // Unknown/unexpected errors — log the full error server-side with Request ID, but never
  // expose stack traces or database/filesystem internals to the client
  console.error(`❌ [Request ID: ${req.id || "N/A"}] Unexpected error:`, err);

  return res.status(500).json({
    status: "error",
    message: "An unexpected error occurred",
  });
};

module.exports = errorHandler;
