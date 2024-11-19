module.exports = {
  preset: "jest-preset-angular",
  // globalSetup: "jest-preset-angular/global-setup",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transform: {
    "^.+\\.(ts|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "projects/nihilux/ngx-spatial-navigable/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.html$",
        astTransformers: ["jest-preset-angular/InlineHtmlStripStylesTransformer"],
        isolatedModules: true,
        preserveSymlinks: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "html", "js", "json"],
  moduleDirectories: ["node_modules", "projects/nihilux/ngx-spatial-navigable/src"],
  modulePaths: ["<rootDir>/projects/nihilux/ngx-spatial-navigable/src"],
  coveragePathIgnorePatterns: [
    ".*\\.(mock)|d\\.ts",
  ],
  testPathIgnorePatterns: ["<rootDir>/src"],
};
