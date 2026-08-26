const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const auth = require("./middleware/auth");

// Phase 4 — CRUD Routes
const productRoutes = require("./modules/products/product.routes");
const categoryRoutes = require("./modules/categories/category.routes");

// Phase 7 — Cities & Delivery Pricing
const cityRoutes = require("./modules/cities/city.routes");

// Phase 8 — Settings (storewide discount placeholder)
const settingsRoutes = require("./modules/settings/settings.routes");

// Phase 11 — Activity Logs
const activityLogRoutes = require("./modules/activity-logs/activityLog.routes");

// Fix 1 — Prescription Access Control (authenticated admin route)
const prescriptionRoutes = require("./modules/prescriptions/prescription.routes");

// Phase 12 — OTP Routes (public — customer-facing)
const otpRoutes = require("./modules/otp/otp.routes");

// Phase 13 — Order Routes (public + admin)
const {
  publicOrderRoutes,
  adminOrderRoutes,
} = require("./modules/orders/order.routes");

// Phase 5 — Auth Routes (public — mounted BEFORE the auth middleware)
const adminUserRoutes = require("./modules/admin-users/adminUser.routes");

// Phase 19 — Weekly Report (admin trigger route + cron scheduler)
const reportsRoutes = require('./modules/orders/reports.routes');
const { scheduleWeeklyReport } = require('./jobs/weeklyReport.job');


const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Base Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());

// Public static serving for uploaded PRODUCT images & the placeholder asset ONLY.
// Prescriptions are NEVER served statically — they are only reachable through
// the authenticated admin route GET /api/v1/admin/prescriptions/:filename
// (Fix 1 — FR-SYS-02 / PRD §15.3 / §17.7).
const productsUploadsDir = path.join(__dirname, "../uploads/products");
app.use("/uploads/products", express.static(productsUploadsDir));

// Placeholder asset is outside the products dir — serve it explicitly.
const placeholderPath = path.join(__dirname, "../uploads/placeholder.webp");
app.get("/uploads/placeholder.webp", (req, res) => {
  res.sendFile(placeholderPath);
});

// FR-SYS-01 / Phase 2: GET /health reports DB connection status.
// mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting,
// 3 = disconnecting.
app.get("/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "ok",
    database: dbConnected ? "connected" : "disconnected",
  });
});

const paymentRoutes = require("./modules/payments/payment.routes");

// ─── PUBLIC routes ─────────────────────────────────────────────────────────────
// Mounted BEFORE the auth middleware so public endpoints are never blocked.
app.use("/api/v1/auth/admin", adminUserRoutes);
app.use("/api/v1/otp", otpRoutes);
app.use("/api/v1/orders", publicOrderRoutes);
app.use("/api/v1/payments", paymentRoutes);

// ─── PROTECTED /admin routes ───────────────────────────────────────────────────
// auth middleware is applied here, before any /admin route, so every route
// mounted under /api/v1/admin/* is protected by default.
// To make a future route public, mount it above this line — never disable auth
// per-route by skipping the middleware selectively.
app.use("/api/v1/admin", auth);

// Phase 4 — Product & Category CRUD APIs (now auth-protected)
// Per rules.md Section 2: /api/v1/<resource>
app.use("/api/v1/admin/products", productRoutes);
app.use("/api/v1/admin/categories", categoryRoutes);

// Phase 7 — Cities & Delivery Pricing (auth-protected)
app.use("/api/v1/admin/cities", cityRoutes);

// Phase 8 — Settings: storewide discount (auth-protected)
app.use("/api/v1/admin/settings", settingsRoutes);

// Phase 11 — Activity Logs (auth-protected)
app.use("/api/v1/admin/activity-logs", activityLogRoutes);

// Fix 1 — Authenticated prescription access (mounted AFTER auth middleware)
app.use("/api/v1/admin/prescriptions", prescriptionRoutes);

// Phase 13 — Admin Order Routes (auth-protected)
app.use("/api/v1/admin/orders", adminOrderRoutes);

// Phase 19 — Admin Reports Routes (auth-protected)
app.use('/api/v1/admin/reports', reportsRoutes);

// Central error handler — must be AFTER all routes
// Per rules.md Section 2: typed errors (NotFoundError, ValidationError)
// caught here, never raw stack traces to clients
app.use(errorHandler);

// Start Server if run directly
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  // Phase 2: connect to MongoDB on startup. connectDB() never throws and
  // never crashes the process — a failed connection is logged clearly and
  // GET /health reports "database": "disconnected" until the DB is reachable.
  connectDB().finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    // Phase 19: register the weekly report cron job (skipped in test env).
    scheduleWeeklyReport();
  });
}

module.exports = app;
