// @ts-check
import tsEslint from "typescript-eslint";

import rootConfig from "../roon-web-eslint/eslint.config.mjs";

export default tsEslint.config([...rootConfig]);
