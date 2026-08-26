/**
 * Reports Routes — Phase 19 (FR-SYS-06).
 *
 * Admin-only endpoint to trigger the weekly report on demand.
 * Mounted in app.js under /api/v1/admin/reports (behind the auth middleware).
 *
 *   POST /api/v1/admin/reports/weekly/trigger
 *     Triggers the weekly report for the default last-7-days window (or an
 *     optional { from, to } body), emails the Excel file, and returns a JSON
 *     confirmation.
 *
 * Why a separate file: keeps order.routes.js focused on order CRUD. Reports
 * are a cross-cutting admin concern and will expand (e.g. monthly report,
 * custom date range) without polluting the order routes.
 */

const express = require('express');
const { runWeeklyReport } = require('../../jobs/weeklyReport.job');
const { BadRequestError } = require('../../utils/errors');

const router = express.Router();

/**
 * POST /api/v1/admin/reports/weekly/trigger
 *
 * Body (all optional):
 *   { from: "YYYY-MM-DD", to: "YYYY-MM-DD", recipient: "email@example.com" }
 *
 * Returns:
 *   { status: "success", data: { count, filename, recipient } }
 */
router.post('/weekly/trigger', async (req, res, next) => {
  try {
    const { from, to, recipient } = req.body || {};

    // Parse optional ISO date strings
    let fromDate, toDate;

    if (from !== undefined) {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        throw new BadRequestError(`Invalid 'from' date: "${from}"`);
      }
      fromDate.setHours(0, 0, 0, 0);
    }

    if (to !== undefined) {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        throw new BadRequestError(`Invalid 'to' date: "${to}"`);
      }
      toDate.setHours(23, 59, 59, 999);
    }

    const result = await runWeeklyReport({
      from: fromDate,
      to: toDate,
      recipient,
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
