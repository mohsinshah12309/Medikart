/**
 * MongoDB connection — Phase 2 (Database Connection, MongoDB Free Tier).
 *
 * Connects to MongoDB Atlas using MONGODB_URI from server/.env.
 *
 * - Fails gracefully: a bad/unreachable URI logs a clear, specific error and
 *   returns `false` instead of crashing the process, so the server stays up
 *   and GET /health can report "database": "disconnected".
 * - Never logs the connection string or any credentials.
 * - Keeps Mongoose's default connection pooling (maxPoolSize: 100) untouched,
 *   per NFR-PERF-05 (pooled connections reused across requests).
 */
const mongoose = require("mongoose");

// Bound how long a connect attempt may take so a bad cluster never hangs the
// process indefinitely. The driver's default is 30s; 10s is enough for a dev
// server to fail fast and report the problem clearly.
const CONNECT_TIMEOUT_MS = 10000;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "[DB] MONGODB_URI is not set. Add it to server/.env (see server/.env.example).",
    );
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      // NOTE: No poolSize/maxPoolSize override — Mongoose/driver defaults
      // (maxPoolSize: 100) are intentionally left as-is (NFR-PERF-05).
    });
    console.log("[DB] MongoDB connected successfully");
    return true;
  } catch (err) {
    // err.message contains the driver's reason (e.g. "Server selection timed
    // out", "Authentication failed") without credentials, so it is safe to
    // log. We never log the full MONGODB_URI.
    console.error(`[DB] MongoDB connection failed: ${err.message}`);
    return false;
  }
}

// Handle errors that occur *after* the initial connect (network blips,
// replica-set changes, expired credentials, etc.) — log them clearly instead
// of letting them surface as an unhandled 'error' event and crash the process.
mongoose.connection.on("error", (err) => {
  console.error(`[DB] MongoDB runtime error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  if (process.env.NODE_ENV !== "test") {
    console.warn("[DB] MongoDB disconnected");
  }
});

mongoose.connection.on("reconnected", () => {
  console.log("[DB] MongoDB reconnected");
});

module.exports = { connectDB };
