// @ts-check
import { dirname } from "node:path";

import { globalIgnores } from "eslint/config";
import tsEslint from "typescript-eslint";

import rootConfig from "../../packages/roon-web-eslint/eslint.config.mjs";

export default tsEslint.config(globalIgnores(["src/roon-kit/**"]), [
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
