/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Serial execution is required: unit and integration tests share the same
  // MongoDB test database and use overlapping fixtures (same slugs/emails/cities).
  // Parallel workers cause cross-file data races (one file's beforeAll deleteMany
  // can wipe another file's fixtures mid-run). Single-worker serial execution
  // keeps each test file's setup/teardown fully isolated.
  maxWorkers: 1,
  maxConcurrency: 1,

  // Two named projects let npm scripts choose scope without manual --testMatch overrides:
  //   npm test          → unit only  (fast, safe to run frequently)
  //   npm run test:all  → unit + integration (full suite, slower due to real HTTP calls)
  // This replaces the previous single testMatch that silently excluded integration tests.
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
      // Integration tests start the real Express app and hit live Atlas dev DB.
      // 60 s per-test timeout is set inside the test file itself (jest.setTimeout).
    },
  ],
};
