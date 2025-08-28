// @ts-check
import { dirname } from "@angular/compiler-cli";
import tsParser from "@typescript-eslint/parser";
import tsEslint from "typescript-eslint";

import rootConfig from "../../../eslint.config.mjs";

export default tsEslint.config([...rootConfig], {
  files: ["**/*.ts"],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "script",
    parserOptions: {
      project: "./tsconfig.lint.json",
      // eslint-disable-next-line no-undef
      tsconfigRootDir: dirname(new URL(import.meta.url).pathname),
    },
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.lint.json",
        tsconfigRootDir: "projects/nihilux/ngx-spatial-navigable",
      },
    },
  },
});
