/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/client/**/*.ts"],
      exclude: [
        "bin",
        "coverage",
        "node_modules",
        "src/**/index.ts",
        "src/**/*.mock.ts",
        "src/**/*.test.ts"
      ],
      thresholds: {
        100: true,
      },
    },
  },
  define: {
    "import.meta.vitest": mode !== "production",
  },
}));
