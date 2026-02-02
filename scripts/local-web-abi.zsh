#!/usr/bin/env zsh

autoload colors;
colors;

usage="local-web-api [-d|--debug <debug>]";

zmodload zsh/zutil;
zparseopts -D -F -K -- \
  {h,-help}=flag_help \
  {d,-debug}=flag_debug || {
    print "${usage}" && exit 1;
  };

if (( $#flag_help )); then
  print "${usage}";
  exit 0;
fi

script_source=$(readlink -f "${0%/*}")
cd "${script_source}/.." || exit;

ROON_WEB_API_MODULE_PATH="./app/roon-web-api"
ROON_WEB_API_BUILD_PATH="${ROON_WEB_API_MODULE_PATH}/bin"
ROON_WEB_API_BUILD_NODE_MODULE_PATH="${ROON_WEB_API_BUILD_PATH}/node_modules"
ROON_WEB_STACK_ROOT_NODE_MODULES="./node_modules"
ROON_WEB_STACK_ROOT_NODE_MODULES_BUN="${ROON_WEB_STACK_ROOT_NODE_MODULES}/.bun"
ROON_WEB_STACK_NG_CLIENT_BUILD="./app/roon-web-ng-client/dist/roon-web-ng-client/browser"
ROON_WEB_STACK_NG_CLIENT_BUILD_DESTINATION="${ROON_WEB_API_BUILD_PATH}/web"

rm -rf "${ROON_WEB_API_BUILD_PATH}"

if (( $#flag_debug )); then
  bun run cd:debug;
else
  bun run cd;
fi

rm -f "${ROON_WEB_API_MODULE_PATH}"/.*.bun-build

mkdir -p "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}"

#cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api@github+roonlabs+node-roon-api+5125839/node_modules/node-roon-api" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api"
cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api-audioinput@github+roonlabs+node-roon-api-audioinput+21ff59e/node_modules/node-roon-api-audioinput" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api-audioinput"
cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api-browse@github+roonlabs+node-roon-api-browse+98adcba/node_modules/node-roon-api-browse" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api-browse"
cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api-image@github+roonlabs+node-roon-api-image+a5f0efa/node_modules/node-roon-api-image" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api-image"
cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api-settings@github+roonlabs+node-roon-api-settings+67cd8ca/node_modules/node-roon-api-settings" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api-settings"
cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api-status@github+roonlabs+node-roon-api-status+504c918/node_modules/node-roon-api-status" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api-status"
cp -R "${ROON_WEB_STACK_ROOT_NODE_MODULES_BUN}/node-roon-api-transport@github+roonlabs+node-roon-api-transport+2ee6000/node_modules/node-roon-api-transport" "${ROON_WEB_API_BUILD_NODE_MODULE_PATH}/node-roon-api-transport"

cp -R "${ROON_WEB_STACK_NG_CLIENT_BUILD}" "${ROON_WEB_STACK_NG_CLIENT_BUILD_DESTINATION}"

cd "${ROON_WEB_API_BUILD_PATH}" || exit

export PORT=8686
export LOG_LEVEL=debug
export WEB_NG_PATH=/Users/nihil/Github/roon-web-stack/app/roon-web-api/bin

if (( $#flag_debug )); then
  bun run ./app.js
else
  ./roon-web-api
fi
