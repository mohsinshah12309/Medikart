const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { resetRateLimiters } = require("../src/middleware/rateLimiter");

// 1. Force environment to test
process.env.NODE_ENV = "test";

// 2. Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 3. Force MONGODB_URI to target the test database
if (process.env.MONGODB_URI_TEST) {
  process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
} else {
  process.env.MONGODB_URI = "mongodb://localhost:27017/medikart_test";
}

// 4. Hook mongoose.connect to block connection to the dev database (safety check layer 1)
const originalConnect = mongoose.connect;
mongoose.connect = async function (uri, options) {
  const connectionString = uri || process.env.MONGODB_URI;

  if (connectionString) {
    const isDevDb = connectionString.includes("/medikart_dev") || 
                     (connectionString.includes(".mongodb.net") && !connectionString.includes("/medikart_test"));
    if (isDevDb) {
      throw new Error(
        `[SAFETY CHECK FAIL] Refusing to connect to DEV/PROD database URI: ${connectionString}`
      );
    }
  }

  // Perform the connection
  const conn = await originalConnect.apply(this, arguments);

  // Check the resolved database name (safety check layer 2)
  const dbName = mongoose.connection.name;
  const devDbNames = ["medikart_dev", "test"];
  
  if (process.env.NODE_ENV !== "test" || devDbNames.includes(dbName)) {
    await mongoose.connection.close();
    throw new Error(
      `[SAFETY CHECK FAIL] Refusing to run tests on database: "${dbName}". NODE_ENV is "${process.env.NODE_ENV}".`
    );
  }

  return conn;
};

// 5. Global hooks
beforeAll(() => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `[SAFETY CHECK FAIL] NODE_ENV is "${process.env.NODE_ENV}". Refusing to run tests in non-test environment.`
    );
  }
});

beforeEach(() => {
  resetRateLimiters();
});
