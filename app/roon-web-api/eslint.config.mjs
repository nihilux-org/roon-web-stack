import _import from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [{
    ignores: ["**/jest.config.js", "**/webpack.config.js", "bin", "coverage", "src/roon-kit", "**/*.md"],
}, {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }, ...fixupConfigRules(compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/strict-type-checked",
      "plugin:prettier/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript"
  )).map(config => ({
    ...config,
    files: ["**/*.ts"],
  })), {
    files: ["**/*.ts"],

    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      "prettier": fixupPluginRules(prettier),
      "simple-import-sort": simpleImportSort,
      "import": fixupPluginRules(_import),
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },

      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },

    rules: {
      "no-console": "error",

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
      "no-duplicate-imports": "error",

      "no-multiple-empty-lines": [
        "error",
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0,
        },
      ],

      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "import/no-unassigned-import": "error",

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
    },
  },
];
