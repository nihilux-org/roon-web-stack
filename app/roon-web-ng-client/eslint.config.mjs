import globals from "globals";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import _import from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/setup-jest.ts"],
}, {
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.browser,
        },
    },
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@angular-eslint/recommended",
    "plugin:@angular-eslint/template/process-inline-templates",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
)).map(config => ({
    ...config,
    files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        prettier: fixupPluginRules(prettier),
        "simple-import-sort": simpleImportSort,
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: "./tsconfig.spec.json",
        },
    },

    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },

        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
                project: "./tsconfig.specs.json",
            },
        },
    },

    rules: {
        "no-console": "error",

        "simple-import-sort/imports": ["error", {
            groups: [["^@mock.*", "^\\..*mock.*"], ["^", "^@.*", "\\."]],
        }],

        "simple-import-sort/exports": "error",
        "no-duplicate-imports": "error",

        "no-multiple-empty-lines": ["error", {
            max: 1,
            maxEOF: 0,
            maxBOF: 0,
        }],

        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "import/no-unassigned-import": "error",

        "@typescript-eslint/restrict-template-expressions": ["error", {
            allowNumber: true,
        }],
    },
}, {
  files: ["src/**/*.ts"],
  rules: {
    "@angular-eslint/directive-selector": ["error", {
      type: "attribute",
      prefix: "nr",
      style: "camelCase",
    }],

    "@angular-eslint/component-selector": ["error", {
      type: "element",
      prefix: "nr",
      style: "kebab-case",
    }],
  }
},...fixupConfigRules(compat.extends(
    "plugin:@angular-eslint/template/recommended",
    "plugin:@angular-eslint/template/accessibility",
)).map(config => ({
    ...config,
    files: ["**/*.html"],
})), {
    files: ["**/*.html"],
    rules: {},
}];
