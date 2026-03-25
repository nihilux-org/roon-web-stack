/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    coverage: {
      provider: "istanbul",
      include: ["**/*.ts"],
      exclude: [
        "bin",
        "coverage",
        "node_modules",
        "src/index.ts",
        "src/build.ts",
        "src/setup-test.ts",
        "src/roon-kit/**/*",
        "src/infrastructure/logger.ts",
        "src/infrastructure/host-info.ts",
        "src/router/app-router.ts",
        "src/**/*.mock.ts",
        "src/**/*.test.ts",
      ],
      thresholds: {
        100: true,
      },
    },
  },
});
