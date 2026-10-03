const fs = require("fs");
const path = require("path");
const { results, checkServerAlive, HEALTH_URL } = require("./helpers");
const { runNumericBvaTests } = require("./test_numeric_bva");
const { runStringBvaTests } = require("./test_string_bva");
const { runFileUploadBvaTests } = require("./test_file_uploads");
const { runStateTransitionTests } = require("./test_state_transitions");
const { runMalformedAndConcurrencyTests } = require("./test_malformed_and_concurrency");

async function runAll() {
  console.log("================================================================");
  console.log("   MEDIKART BOUNDARY VALUE ANALYSIS & EDGE-CASE TEST SUITE       ");
  console.log("================================================================\n");

  const initialAlive = await checkServerAlive();
  console.log(`Pre-test Server Health (${HEALTH_URL}): ${initialAlive ? "\x1b[32mCONNECTED & READY\x1b[0m" : "\x1b[31mDOWN\x1b[0m"}`);
  if (!initialAlive) {
    console.error("Cannot proceed: Server is not alive or DB is disconnected.");
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    await runNumericBvaTests();
    await runStringBvaTests();
    await runFileUploadBvaTests();
    await runStateTransitionTests();
    await runMalformedAndConcurrencyTests();
  } catch (err) {
    console.error("Test execution encountered an error:", err);
  }

  const durationMs = Date.now() - startTime;
  const postAlive = await checkServerAlive();

  console.log("\n================================================================");
  console.log("                     BVA TEST EXECUTION SUMMARY                 ");
  console.log("================================================================\n");

  const passed = results.filter(r => r.status === "PASS").length;
  const crashed = results.filter(r => r.status.includes("CRASHED")).length;
  const failedBehavior = results.filter(r => r.status.includes("INCORRECT BEHAVIOR")).length;
  const total = results.length;

  console.log(`Total Scenarios Tested : ${total}`);
  console.log(`Passed                 : \x1b[32m${passed}\x1b[0m`);
  console.log(`Crashed / 500 Server   : \x1b[31m${crashed}\x1b[0m`);
  console.log(`Incorrect Behavior     : \x1b[33m${failedBehavior}\x1b[0m`);
  console.log(`Final Process Liveness : ${postAlive ? "\x1b[32mHEALTHY\x1b[0m" : "\x1b[41m\x1b[37mCRASHED\x1b[0m"}`);
  console.log(`Execution Duration     : ${(durationMs / 1000).toFixed(2)}s\n`);

  if (crashed > 0 || failedBehavior > 0) {
    console.log("Failed Scenarios List:");
    results.filter(r => r.status !== "PASS").forEach(r => {
      console.log(` - [${r.status}] ${r.category} > ${r.testId}: ${r.description}`);
      console.log(`     Expected: ${r.expected}`);
      console.log(`     Actual:   ${r.actual}`);
    });
  }

  // Save report to disk
  const reportPath = path.join(__dirname, "bva_report.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total,
    passed,
    crashed,
    failedBehavior,
    serverHealthy: postAlive,
    durationMs,
    results
  }, null, 2));

  console.log(`\nDetailed JSON report written to: ${reportPath}`);
}

runAll();
