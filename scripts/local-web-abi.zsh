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

ROON_WEB_STACK_ROOT="${script_source}/.."

cd "${ROON_WEB_STACK_ROOT}" || exit;

ROON_WEB_API_BIN="${ROON_WEB_STACK_ROOT}/app/roon-web-api/bin"
ROON_WEB_NG_CLIENT_BUILD="${ROON_WEB_STACK_ROOT}/app/roon-web-ng-client/dist/roon-web-ng-client/browser"

if (( $#flag_debug )); then
  bun run cd:debug;
else
  bun run cd;
fi

rm -f "${ROON_WEB_STACK_ROOT}/**/.*.bun-build"

cp -r "${ROON_WEB_NG_CLIENT_BUILD}" "${ROON_WEB_API_BIN}/web"

cd "${ROON_WEB_API_BIN}" || exit

export PORT=8686
export LOG_LEVEL=debug
export WEB_NG_PATH="${ROON_WEB_API_BIN}"

if (( $#flag_debug )); then
  bun run ./roon-web-api.js
else
  ./roon-web-api
fi
