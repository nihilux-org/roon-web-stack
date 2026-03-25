#!/bin/sh

ROON_WEB_HOST=${ROON_WEB_HOST:-127.0.0.1}
ROON_WEB_PORT=${ROON_WEB_PORT:-3000}
HTTP_METHOD="$1"

curl -X "$HTTP_METHOD" "http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay" < /dev/null > /dev/null 2>&1
