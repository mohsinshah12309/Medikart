/**
 * Quick Zero-Dependency Restore Script for Medikart Products & Logs
 *
 * Restores products and activity logs from a snapshot folder.
 * Usage:
 *   node scripts/restore-db.js [path-to-backup-dir]
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../src/modules/products/product.model");
const ActivityLog = require("../src/modules/activity-logs/activityLog.model");

async function restore() {
  const targetDir =
    process.argv[2] ||
    (() => {
      const backupsRoot = path.join(__dirname, "../backups");
      if (!fs.existsSync(backupsRoot)) return null;
      const dirs = fs
        .readdirSync(backupsRoot)
        .filter((d) => d.startsWith("backup-"))
        .sort()
        .reverse();
      return dirs.length > 0 ? path.join(backupsRoot, dirs[0]) : null;
    })();

  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error(`Error: Backup directory not found at ${targetDir}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  Restoring from: ${targetDir}`);
  console.log(`======================================================\n`);

  await mongoose.connect(process.env.MONGODB_URI);

  const productsFile = path.join(targetDir, "products.json");
  if (fs.existsSync(productsFile)) {
    const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
    console.log(`Restoring ${products.length} products...`);
    for (const p of products) {
      await Product.findByIdAndUpdate(p._id, p, { upsert: true });
    }
    console.log(`✓ Products restored.`);
  }

  const logsFile = path.join(targetDir, "activitylogs.json");
  if (fs.existsSync(logsFile)) {
    const logs = JSON.parse(fs.readFileSync(logsFile, "utf8"));
    console.log(`Restoring ${logs.length} activity logs...`);
    for (const l of logs) {
      await ActivityLog.findByIdAndUpdate(l._id, l, { upsert: true });
    }
    console.log(`✓ Activity logs restored.`);
  }

  console.log(`\nDatabase restore completed successfully.`);
  await mongoose.disconnect();
}

restore().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});
