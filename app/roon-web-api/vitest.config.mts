import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["**/*.ts"],
      exclude: [
        "bin",
        "coverage",
        "node_modules",
        "src/app.ts",
        "src/setup-test.ts",
        "src/roon-kit/**/*",
        "src/infrastructure/logger.ts",
        "src/infrastructure/host-info.ts",
        "src/route/**/*",
        "src/service/graceful-shutdown.ts",
        "src/**/*.mock.ts",
        "src/**/*.test.ts",
      ],
      thresholds: {
        100: true
      },
    },
  },
});
