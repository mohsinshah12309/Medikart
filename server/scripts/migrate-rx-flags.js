/**
 * Migration Script: Migrate Rx / Prescription Required Flags
 * 
 * Flags 66 controlled/narcotic products from client review list (2026-10).
 * Supports:
 *   --dry-run : Generates Match Report without modifying any data.
 *   --apply   : Applies flags idempotently, logs to ActivityLog, and writes report.
 *
 * Usage:
 *   node scripts/migrate-rx-flags.js --dry-run
 *   node scripts/migrate-rx-flags.js --apply
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../src/modules/products/product.model");
const ActivityLog = require("../src/modules/activity-logs/activityLog.model");

const LIST_FILE = path.join(__dirname, "narcotics-list-2026.json");
const REPORT_FILE = path.join(__dirname, "rx-migration-report.json");

async function run() {
  const isApply = process.argv.includes("--apply");
  const isDryRun = !isApply || process.argv.includes("--dry-run");

  console.log(`\n======================================================`);
  console.log(`  Rx Flags Migration Script (Mode: ${isApply ? "APPLY (LIVE WRITE)" : "DRY RUN (READ ONLY)"})`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(LIST_FILE)) {
    console.error(`Error: List file not found at ${LIST_FILE}`);
    process.exit(1);
  }

  const list = JSON.parse(fs.readFileSync(LIST_FILE, "utf8"));
  console.log(`Loaded ${list.length} target items from client dataset.`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}\n`);

  const report = {
    executedAt: new Date().toISOString(),
    mode: isApply ? "apply" : "dry-run",
    totalItems: list.length,
    exactMatches: [],
    probableMatches: [],
    ambiguousMatches: [],
    unmatched: [],
    alreadyFlagged: [],
    updated: [],
  };

  for (const item of list) {
    // 1. Exact match by SKU
    let product = await Product.findOne({ sku: item.sku });

    if (product) {
      const matchObj = {
        itemNo: item.no,
        name: item.name,
        generic: item.generic,
        sku: item.sku,
        class: item.class,
        risk: item.risk,
        productId: product._id.toString(),
        productName: product.name,
        currentStatus: {
          isNarcotic: product.isNarcotic,
          requiresPrescription: product.requiresPrescription,
          rxStatus: product.rxStatus || "none",
        },
      };

      report.exactMatches.push(matchObj);

      if (product.rxStatus === "prescription_required" && product.isNarcotic === true) {
        report.alreadyFlagged.push(matchObj);
      }

      if (isApply) {
        const beforeState = {
          isNarcotic: product.isNarcotic,
          requiresPrescription: product.requiresPrescription,
          rxStatus: product.rxStatus || "none",
        };

        const targetRxStatus = "prescription_required";
        const isNarcoticFlag = true;

        product.isNarcotic = isNarcoticFlag;
        product.requiresPrescription = true;
        product.rxStatus = targetRxStatus;
        product.rxFlaggedAt = new Date();
        product.rxFlaggedBy = "system_migration";
        product.rxSource = "client list 2026-10";

        await product.save();

        // Log into ActivityLog
        await ActivityLog.create({
          actor: {
            id: "system_migration",
            email: "system@medikart.pk",
            role: "system",
          },
          action: "narcotics_flag_added",
          entityType: "product",
          entityId: product._id,
          before: beforeState,
          after: {
            isNarcotic: true,
            requiresPrescription: true,
            rxStatus: targetRxStatus,
            rxSource: "client list 2026-10",
          },
          timestamp: new Date(),
        });

        report.updated.push({
          productId: product._id.toString(),
          sku: product.sku,
          name: product.name,
        });
      }
      continue;
    }

    // 2. Probable match by exact name
    const escapedName = item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const nameMatches = await Product.find({ name: new RegExp(`^${escapedName}$`, "i") });

    if (nameMatches.length === 1) {
      report.probableMatches.push({
        itemNo: item.no,
        target: item,
        matchedProduct: {
          id: nameMatches[0]._id.toString(),
          name: nameMatches[0].name,
          sku: nameMatches[0].sku,
        },
      });
      continue;
    } else if (nameMatches.length > 1) {
      report.ambiguousMatches.push({
        itemNo: item.no,
        target: item,
        candidates: nameMatches.map((m) => ({ id: m._id.toString(), name: m.name, sku: m.sku })),
      });
      continue;
    }

    // 3. Unmatched
    report.unmatched.push(item);
  }

  console.log(`--- MATCH RESULTS SUMMARY ---`);
  console.log(`Exact Matches (by SKU):       ${report.exactMatches.length} / ${list.length}`);
  console.log(`Probable Matches (by Name):   ${report.probableMatches.length}`);
  console.log(`Ambiguous Matches:            ${report.ambiguousMatches.length}`);
  console.log(`Unmatched Items:              ${report.unmatched.length}`);

  if (isApply) {
    console.log(`\nSuccessfully applied flags to: ${report.updated.length} products.`);
    console.log(`ActivityLog audit records created: ${report.updated.length}`);
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report written to: ${REPORT_FILE}`);

  await mongoose.disconnect();
  console.log(`MongoDB disconnected cleanly.`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
