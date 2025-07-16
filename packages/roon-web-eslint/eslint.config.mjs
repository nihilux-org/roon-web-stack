import { dirname } from "node:path";

import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import promisePlugin from "eslint-plugin-promise";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unUsedImports from "eslint-plugin-unused-imports";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  globalIgnores(["bin/**", "coverage/**", "dist/**"]),
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tsEslint.configs.recommendedTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      eslintPluginPrettierRecommended,
    ],
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unUsedImports,
      "promise-plugin": promisePlugin,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "script",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: dirname("./"),
      },
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^@mock.*", "^\\..*mock.*"],
            ["^", "^@.*", "\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "no-console": "error",
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
  },
  {
    files: ["**/*.mjs"],
    extends: [eslint.configs.recommended, importPlugin.flatConfigs.recommended, eslintPluginPrettierRecommended],
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unUsedImports,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "simple-import-sort/imports": "error",
      "unused-imports/no-unused-imports": "error",
      "import/no-unresolved": "off",
    },
  }
);
