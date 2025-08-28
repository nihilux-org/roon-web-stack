// @ts-check
import { dirname } from "node:path";

import tsEslint from "typescript-eslint";

import rootConfig from "../roon-web-eslint/eslint.config.mjs";

export default tsEslint.config([
  ...rootConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        // eslint-disable-next-line no-undef
        tsconfigRootDir: dirname(new URL(import.meta.url).pathname),
      },
    },
  },
]);
