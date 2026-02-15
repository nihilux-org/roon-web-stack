import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
