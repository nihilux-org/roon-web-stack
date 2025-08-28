// @ts-check
import { dirname } from "@angular/compiler-cli";
import tsParser from "@typescript-eslint/parser";
import angular from "angular-eslint";
import tsEslint from "typescript-eslint";

import rootConfig from "../../packages/roon-web-eslint/eslint.config.mjs";

export default tsEslint.config(
  [...rootConfig],
  {
    files: ["**/*.ts"],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "script",
      parserOptions: {
        project: "tsconfig.lint.json",
        // eslint-disable-next-line no-undef
        tsconfigRootDir: dirname(new URL(import.meta.url).pathname),
      },
    },
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          style: "kebab-case",
        },
      ],
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "tsconfig.lint.json",
        },
      },
    },
  },
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  }
);
