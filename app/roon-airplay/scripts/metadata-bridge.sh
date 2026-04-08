#!/bin/sh

LANG=C.UTF-8
export LANG

ROON_WEB_HOST=${ROON_WEB_HOST:-127.0.0.1}
ROON_WEB_PORT=${ROON_WEB_PORT:-3000}

_meta_artist=""
_meta_title=""
_meta_album=""

json_escape() {
	printf '%s' "$1" | sed \
		-e 's/\\/\\\\/g' \
		-e 's/"/\\"/g' \
		-e 's/	/\\t/g' \
		-e 's/\r/\\r/g'
}

extract_value() {
	_line="$1"
	_line="${_line#*\"}"
	_line="${_line%\".}"
	printf '%s\n' "$_line"
}

push_metadata() {
	if [ -z "$_meta_artist" ] && [ -z "$_meta_title" ] && [ -z "$_meta_album" ]; then
		return 0
	fi

	_escaped_artist=$(json_escape "$_meta_artist")
	_escaped_title=$(json_escape "$_meta_title")
	_escaped_album=$(json_escape "$_meta_album")

	_json="{\"artist\":\"${_escaped_artist}\",\"album\":\"${_escaped_album}\",\"title\":\"${_escaped_title}\"}"

	_http_code=$(curl \
		-w '%{http_code}' -o /dev/null -sSg \
		--max-time 5 \
		-X PUT "http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay/metadata" \
		-H "Content-Type: application/json" \
		-d "$_json" \
		< /dev/null 2>&1)
	_rc=$?

	if [ "$_rc" -ne 0 ]; then
		echo "metadata-bridge: curl failed (rc=$_rc, http=$_http_code)" >&2
	elif [ "$_http_code" -ge 400 ]; then
		echo "metadata-bridge: server error (http=$_http_code)" >&2
	fi
	return 0
}

push_image() {
	_coverart_file=$(ls /tmp/shairport-sync/.cache/coverart/cover-* 2>/dev/null | head -1)
	if [ -z "$_coverart_file" ]; then
		return 0
	fi

	_case="${_coverart_file##*.}"
	case "$_case" in
		jpg) _content_type="image/jpeg" ;;
		png) _content_type="image/png" ;;
		*) _content_type="image/jpeg" ;;
	esac

	_http_code=$(curl \
		-w '%{http_code}' -o /dev/null -sSg \
		--max-time 5 \
		-X PUT "http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay/image" \
		-H "Content-Type: ${_content_type}" \
		--data-binary @"$_coverart_file" \
		< /dev/null 2>&1)
	_rc=$?

	if [ "$_rc" -ne 0 ]; then
		echo "metadata-bridge: image curl failed (rc=$_rc, http=$_http_code)" >&2
	elif [ "$_http_code" -ge 400 ]; then
		echo "metadata-bridge: image server error (http=$_http_code)" >&2
	fi
	return 0
}

reset_metadata() {
	_meta_artist=""
	_meta_title=""
	_meta_album=""
}

while IFS= read -r _line || [ -n "$_line" ]; do
	case "$_line" in
		Artist:\ *)
			_meta_artist=$(extract_value "$_line")
			;;

		Title:\ *)
			_meta_title=$(extract_value "$_line")
			;;

		Album\ Name:*)
			_meta_album=$(extract_value "$_line")
			;;

		*Metadata*bundle*end*)
			push_metadata
			reset_metadata
			;;

		*Picture\ received*)
			push_image
			;;

		*)
			;;
	esac
done
