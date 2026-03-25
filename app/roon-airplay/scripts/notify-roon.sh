#!/bin/sh

ROON_WEB_HOST=${ROON_WEB_HOST:-127.0.0.1}
ROON_WEB_PORT=${ROON_WEB_PORT:-3000}
ROON_AIRPLAY_HOST=${ROON_AIRPLAY_HOST:-"host.docker.internal"}
ROON_AIRPLAY_PORT=${ROON_AIRPLAY_PORT:-8000}
HTTP_METHOD="$1"

curl -X "$HTTP_METHOD" -H "x-roon-airplay-stream-url: http://${ROON_AIRPLAY_HOST}:${ROON_AIRPLAY_PORT}/airplay" "http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay" < /dev/null > /dev/null 2>&1
