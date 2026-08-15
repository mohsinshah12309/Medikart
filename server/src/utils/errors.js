/**
 * Typed error classes — Phase 4.
 *
 * These are thrown by controllers/services and caught by the central
 * errorHandler middleware. Never send raw stack traces or generic 500s to
 * clients — always a typed error with a clear message.
 *
 * Per rules.md Section 2 & 3: one central error handling pattern across the
 * entire API.
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes known errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, 400);
    this.details = details;
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
};
