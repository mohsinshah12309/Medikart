/**
 * Upload Middleware — Phase 10.
 *
 * Multer memory-storage middleware for uploading product images.
 * Keeps file buffers in memory so `imageProcessor.js` can inspect magic bytes
 * and process/compress before saving to disk.
 *
 * Security Limits (OWASP API4):
 *   - Max 5MB per file
 *   - Max 5 files per upload request batch
 */

const multer = require("multer");
const { ValidationError } = require("../utils/errors");

const storage = multer.memoryStorage();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const MAX_FILES_PER_REQUEST = 5;

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },
  fileFilter: (req, file, cb) => {
    // Basic preliminary mime check; deep magic-byte validation is done in imageProcessor.js
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ValidationError("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
