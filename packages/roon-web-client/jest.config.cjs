module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [".*\\.(mock)|d\\.ts", ".*index(\\.mock)?\\.ts"],
  coverageProvider: "v8",
  coverageReporters: ["html", "text", "text-summary", "cobertura"],
  // coverageReporters: [
  //   "json",
  //   "text",
  //   "lcov",
  //   "clover"
  // ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  globals: {
    window: {},
  },
  moduleNameMapper: {
    "@model": "<rootDir>/../roon-cqrs-model/src/index.ts",
    "@mock": "<rootDir>/src/mock/index.ts",
  },
  transform: {
    "^.+\\.ts?$": ["ts-jest", {}],
  },
};
