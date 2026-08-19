/**
 * Prescription controller — Fix 1 (Prescription Access Control).
 *
 * GET /api/v1/admin/prescriptions/:filename
 *
 * Serves a prescription file ONLY if:
 *   1. The requester is an authenticated admin (auth middleware applied at mount).
 *   2. The filename is tied to a real order's prescriptionUrl (object-level check).
 *
 * This prevents both public access and an authenticated admin from fetching
 * arbitrary files by guessing filenames — the file must belong to an order.
 */

const fs = require("fs");
const path = require("path");
const Order = require("../orders/order.model");
const { NotFoundError, ForbiddenError } = require("../../utils/errors");

const PRESCRIPTIONS_DIR = path.join(
  __dirname,
  "../../../uploads/prescriptions",
);

/**
 * GET /api/v1/admin/prescriptions/:filename
 */
const getPrescription = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Object-level check: the filename must be tied to a real order's
    // prescriptionUrl. We never serve a file that isn't referenced by an order.
    const order = await Order.findOne({
      prescriptionUrl: { $regex: new RegExp(`${filename}$`) },
    });

    if (!order) {
      throw new NotFoundError("Prescription not found");
    }

    // Resolve the file path safely — the filename was already validated by
    // Zod (no slashes, no ".."), and we join against the fixed directory.
    const filePath = path.join(PRESCRIPTIONS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError("Prescription file not found on disk");
    }

    // Determine content type from extension (we only allow jpg/png/pdf at upload)
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".pdf") contentType = "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => next(err));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPrescription };
