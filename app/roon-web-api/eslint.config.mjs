// @ts-check
import { globalIgnores } from "eslint/config";
import tsEslint from "typescript-eslint";

import rootConfig from "../../packages/roon-web-eslint/eslint.config.mjs";

export default tsEslint.config(globalIgnores(["src/roon-kit/**"]), [...rootConfig]);
