/**
 * Monthly Refill Reminder Job — Daily Cron Scheduler.
 *
 * Runs daily:
 *   1. Queries MonthlyRefill where nextReminderAt <= now AND reminderSentAt is null.
 *   2. Populates customer and active items.
 *   3. Calls sendRefillReminderEmail(customer, items).
 *   4. On success: sets reminderSentAt = now, saves doc.
 *   5. On failure: leaves reminderSentAt = null so it retries on the next day.
 *   6. Logs summary (sent / failed counts) per run.
 */

const cron = require("node-cron");
const MonthlyRefill = require("../modules/customers/monthlyRefill.model");
const { sendRefillReminderEmail } = require("../services/mailjetReminder.service");

let cronTask = null;

/**
 * Execute a single refill reminder batch run.
 * Can be called on-demand (e.g. in tests or manual triggers).
 */
const runMonthlyRefillReminder = async () => {
  const now = new Date();
  console.log(`[refillReminder] Starting daily reminder batch at ${now.toISOString()}`);

  try {
    const eligibleLists = await MonthlyRefill.find({
      nextReminderAt: { $lte: now, $ne: null },
      reminderSentAt: null,
      "items.0": { $exists: true }, // Must have at least 1 item
    })
      .populate("customerId")
      .populate("items.productId");

    console.log(`[refillReminder] Found ${eligibleLists.length} eligible refill lists for reminder`);

    let sentCount = 0;
    let failedCount = 0;

    for (const refill of eligibleLists) {
      const customer = refill.customerId;

      // Skip if customer deleted, blocked, or not email-verified
      if (!customer || customer.isBlocked || !customer.emailVerified) {
        console.warn(
          `[refillReminder] Skipping refill ${refill._id}: customer invalid, blocked, or unverified`
        );
        continue;
      }

      // Format items for email
      const activeItems = (refill.items || [])
        .filter((it) => it.productId && it.productId.active)
        .map((it) => ({
          name: it.productId.name,
          quantity: it.quantity,
          sku: it.productId.sku,
        }));

      if (activeItems.length === 0) {
        console.warn(`[refillReminder] Skipping refill ${refill._id}: no active products in list`);
        continue;
      }

      const res = await sendRefillReminderEmail(customer, activeItems);

      if (res.success) {
        refill.reminderSentAt = new Date();
        await refill.save();
        sentCount++;
      } else {
        // Leave reminderSentAt = null so it retries next day
        failedCount++;
      }
    }

    console.log(
      `[refillReminder] Batch finished: ${sentCount} reminders sent, ${failedCount} failed out of ${eligibleLists.length} eligible`
    );

    return {
      eligible: eligibleLists.length,
      sent: sentCount,
      failed: failedCount,
    };
  } catch (err) {
    console.error("[refillReminder] Batch error during runMonthlyRefillReminder:", err);
    return {
      eligible: 0,
      sent: 0,
      failed: 0,
      error: err.message,
    };
  }
};

/**
 * Schedule the daily cron job.
 * Default: 09:00 AM every day. Configurable via REFILL_REMINDER_CRON_SCHEDULE.
 */
const scheduleMonthlyRefillReminder = () => {
  if (process.env.NODE_ENV === "test") {
    // Never start background jobs in tests to avoid timer leakage
    return null;
  }

  const schedule = process.env.REFILL_REMINDER_CRON_SCHEDULE || "0 9 * * *"; // Daily 09:00 AM

  cronTask = cron.schedule(schedule, async () => {
    console.log("[refillReminder] Daily cron triggered");
    try {
      await runMonthlyRefillReminder();
    } catch (err) {
      console.error("[refillReminder] Cron task error:", err.message);
    }
  });

  console.log(`[refillReminder] Scheduled daily cron with expression: "${schedule}"`);
  return cronTask;
};

/**
 * Stop the cron job.
 */
const stopMonthlyRefillReminder = () => {
  if (cronTask) {
    cronTask.stop();
    console.log("[refillReminder] Stopped refill reminder cron job");
    cronTask = null;
  }
};

module.exports = {
  runMonthlyRefillReminder,
  scheduleMonthlyRefillReminder,
  stopMonthlyRefillReminder,
};
