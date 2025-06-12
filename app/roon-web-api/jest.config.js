module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    ".*\\.(mock)|d\\.ts",
    ".*index(\\.mock)?\\.ts",
    "app.ts",
    "src/roon-kit/.",
    "src/infrastructure/logger.ts",
    "src/infrastructure/host-info.ts",
    // FIXME: Coverage!
    "src/route/.",
    "src/service/register-graceful-shutdown.ts",
  ],
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
  moduleNameMapper: {
    "@data": "<rootDir>/src/data/index.ts",
    "@infrastructure": "<rootDir>/src/infrastructure/index.ts",
    "@mock": "<rootDir>/src/mock/index.ts",
    "@service": "<rootDir>/src/service/index.ts",
    "@model": "<rootDir>/../../packages/roon-cqrs-model/src/index.ts",
    "@roon-kit": "<rootDir>/src/roon-kit/index.ts",
  },
  transform: {
    "^.+\\.ts?$": ["ts-jest", {}],
  },
};
