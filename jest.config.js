module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["backend/src/**/*.js", "!backend/src/server.js"],
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      testMatch: ["<rootDir>/backend/tests/unit/**/*.test.js"],
    },
    {
      displayName: "integration",
      testEnvironment: "node",
      testMatch: ["<rootDir>/backend/tests/integration/**/*.test.js"],
    },
  ],
};
