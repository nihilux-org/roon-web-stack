module.exports = {
  preset: "jest-preset-angular",
  // globalSetup: "jest-preset-angular/global-setup",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transform: {
    "^.+\\.(ts|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "./tsconfig.spec.json",
        stringifyContentPathRegex: "\\.html$",
        astTransformers: ["jest-preset-angular/InlineHtmlStripStylesTransformer"],
        isolatedModules: true,
        preserveSymlinks: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "html", "js", "json"],
  moduleDirectories: ["node_modules", "src"],
  modulePaths: ["<rootDir>"],
  testPathIgnorePatterns: ["<rootDir>/projects"],
  moduleNameMapper: {
    "^@app/(.*)$": ["<rootDir>/src/app/$1"],
    "^@components/(.*)$": ["<rootDir>/src/app/components/$1"],
    "^@mock/(.*)$": ["<rootDir>/src/mock/$1"],
    "^@services/(.*)$": ["<rootDir>/src/app/services/$1"],
    "@model/client": ["<rootDir>/src/app/model/index.ts"],
    "@nihilux/ngx-spatial-navigable": ["<rootDir>/projects/nihilux/ngx-spatial-navigable/src/public-api.ts"],
  },
  coveragePathIgnorePatterns: [
    ".*\\.(mock)|d\\.ts",
  ],
};
