const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Phase 4 — API Routes
const productRoutes = require("./modules/products/product.routes");
const categoryRoutes = require("./modules/categories/category.routes");

// Load environment variables
dotenv.config();

const app = express();

// Base Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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

// Phase 4 — Product & Category CRUD APIs
// Per rules.md Section 2: /api/v1/<resource>
app.use("/api/v1/admin/products", productRoutes);
app.use("/api/v1/admin/categories", categoryRoutes);

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
