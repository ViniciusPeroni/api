export default {
  testEnvironment: "node",
  testMatch: ["**/__test__/**/*.test.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.js"],
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
  verbose: true,
  forceExit: true,
  setupFiles: ["<rootDir>/__test__/setup.js"],
};
