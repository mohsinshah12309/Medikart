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

// Phase 5 — Auth Routes (public — mounted BEFORE the auth middleware)
const adminUserRoutes = require("./modules/admin-users/adminUser.routes");


const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Base Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());

// Public static serving for uploaded product images & placeholder asset
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

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

// ─── PUBLIC auth routes ────────────────────────────────────────────────────────
// Mounted BEFORE the auth middleware so login is never blocked.
// Allow-list: only /api/v1/auth/* is public. Everything else under /admin/* is protected.
app.use("/api/v1/auth/admin", adminUserRoutes);

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
  });
}

module.exports = app;
