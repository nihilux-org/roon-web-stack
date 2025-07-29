/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig(({ mode }) => ({
  plugins: [angular({
    tsconfig: "./tsconfig.spec.json",
  }), tsconfigPaths()],
  test: {
    setupFiles: "./src/setup-test.ts",
    environment: "jsdom",
    globals: true,
  },
  define: {
    "import.meta.vitest": mode !== "production",
  },
}));
