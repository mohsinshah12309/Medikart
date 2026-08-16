/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/unit/**/*.test.js"],
  // The unit/integration tests share a single MongoDB test database and use
  // overlapping fixtures (same slugs/emails/cities). Running them in parallel
  // across multiple workers causes cross-file data races (e.g. one file's
  // beforeAll deleteMany wiping another file's fixtures). Serial execution
  // keeps each test file's setup/teardown isolated.
  maxWorkers: 1,
  maxConcurrency: 1,
};
