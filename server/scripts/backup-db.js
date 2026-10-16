/**
 * Quick Zero-Dependency Backup Script for Medikart Products & Logs
 *
 * Saves a timestamped JSON snapshot of products and activity logs.
 * Usage:
 *   node scripts/backup-db.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../src/modules/products/product.model");
const ActivityLog = require("../src/modules/activity-logs/activityLog.model");

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, `../backups/backup-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Connecting to database...`);
  await mongoose.connect(process.env.MONGODB_URI);

  console.log(`Backing up Products collection...`);
  const products = await Product.find({}).lean();
  fs.writeFileSync(
    path.join(backupDir, "products.json"),
    JSON.stringify(products, null, 2)
  );
  console.log(`✓ Saved ${products.length} products.`);

  console.log(`Backing up ActivityLogs collection...`);
  const logs = await ActivityLog.find({}).lean();
  fs.writeFileSync(
    path.join(backupDir, "activitylogs.json"),
    JSON.stringify(logs, null, 2)
  );
  console.log(`✓ Saved ${logs.length} activity logs.`);

  // Write manifest
  fs.writeFileSync(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(
      {
        timestamp,
        database: mongoose.connection.name,
        productsCount: products.length,
        logsCount: logs.length,
      },
      null,
      2
    )
  );

  console.log(`\n======================================================`);
  console.log(` Backup completed successfully!`);
  console.log(` Folder: ${backupDir}`);
  console.log(` Restore command: node scripts/restore-db.js "${backupDir}"`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

backup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
