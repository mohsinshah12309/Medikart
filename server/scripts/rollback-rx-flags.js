/**
 * Rollback Script: Undo Rx / Prescription Required Flags
 * 
 * Reverses all changes made by migrate-rx-flags.js.
 * Restores products back to isNarcotic: false, requiresPrescription: false, rxStatus: "none".
 * Logs "narcotics_flag_removed" in ActivityLog for compliance auditability.
 *
 * Usage:
 *   node scripts/rollback-rx-flags.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../src/modules/products/product.model");
const ActivityLog = require("../src/modules/activity-logs/activityLog.model");

const REPORT_FILE = path.join(__dirname, "rx-migration-report.json");

async function rollback() {
  console.log(`\n======================================================`);
  console.log(`  Rx Flags Rollback Script (Reverting all changes)`);
  console.log(`======================================================\n`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

  let productIds = [];

  if (fs.existsSync(REPORT_FILE)) {
    const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf8"));
    if (report.updated && report.updated.length > 0) {
      productIds = report.updated.map((u) => u.productId);
    } else if (report.exactMatches && report.exactMatches.length > 0) {
      productIds = report.exactMatches.map((m) => m.productId);
    }
  }

  // Also query any product with rxSource: "client list 2026-10"
  const flaggedProducts = await Product.find({
    $or: [
      { _id: { $in: productIds } },
      { rxSource: "client list 2026-10" },
    ],
  });

  console.log(`Found ${flaggedProducts.length} products to revert.\n`);

  let revertedCount = 0;
  for (const product of flaggedProducts) {
    const beforeState = {
      isNarcotic: product.isNarcotic,
      requiresPrescription: product.requiresPrescription,
      rxStatus: product.rxStatus,
      rxSource: product.rxSource,
    };

    product.isNarcotic = false;
    product.requiresPrescription = false;
    product.rxStatus = "none";
    product.rxFlaggedAt = null;
    product.rxFlaggedBy = null;
    product.rxSource = null;

    await product.save();

    await ActivityLog.create({
      actor: {
        id: "system_rollback",
        email: "system@medikart.pk",
        role: "system",
      },
      action: "narcotics_flag_removed",
      entityType: "product",
      entityId: product._id,
      before: beforeState,
      after: {
        isNarcotic: false,
        requiresPrescription: false,
        rxStatus: "none",
      },
      timestamp: new Date(),
    });

    revertedCount++;
  }

  console.log(`Successfully reverted ${revertedCount} products.`);
  console.log(`Audit log entries created: ${revertedCount}`);

  await mongoose.disconnect();
  console.log(`MongoDB disconnected cleanly.`);
}

rollback().catch((err) => {
  console.error("Rollback failed:", err);
  process.exit(1);
});
