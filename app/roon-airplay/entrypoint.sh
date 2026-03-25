#!/bin/sh

set -e

PIPE_PATH="/tmp/shairport-sync-audio"
LIQUIDSOAP_SCRIPT="/opt/liquidsoap/pipeline.liq"
LIQUIDSOAP_PID=""
METADATA_READER_PID=""

cleanup() {
    echo "Received shutdown signal, cleaning up..."

    if [ -n "$LIQUIDSOAP_PID" ] && kill -0 "$LIQUIDSOAP_PID" 2>/dev/null; then
        echo "Stopping Liquidsoap (PID: $LIQUIDSOAP_PID)..."
        kill "$LIQUIDSOAP_PID" 2>/dev/null || true
        wait "$LIQUIDSOAP_PID" 2>/dev/null || true
    fi

    if [ -p "$PIPE_PATH" ]; then
        echo "Removing FIFO pipe..."
        rm -f "$PIPE_PATH"
    fi

    if [ -n "$METADATA_READER_PID" ] && kill -0 "$METADATA_READER_PID" 2>/dev/null; then
        echo "Stopping metadata pipeline (PID: $METADATA_READER_PID)..."
        kill "$METADATA_READER_PID" 2>/dev/null || true
        wait "$METADATA_READER_PID" 2>/dev/null || true
    fi

    if [ -p "/tmp/shairport-sync-metadata" ]; then
        rm -f "/tmp/shairport-sync-metadata"
    fi

    echo "Cleanup complete."
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "Starting base services..."
rm -rf /run/dbus/dbus.pid /run/avahi-daemon/pid 2>/dev/null || true
dbus-uuidgen --ensure 2>/dev/null || true
dbus-daemon --system 2>/dev/null || true
avahi-daemon --daemonize --no-chroot 2>/dev/null || true

echo "Starting NQPTP..."
/usr/local/bin/nqptp > /dev/null 2>&1 &

echo "Waiting for avahi..."
for i in $(seq 1 10); do
    if [ -f /var/run/avahi-daemon/pid ]; then
        break
    fi
    sleep 0.5
done

echo "Creating FIFO pipe at $PIPE_PATH..."
rm -f "$PIPE_PATH"
mkfifo "$PIPE_PATH"
chmod 666 "$PIPE_PATH"

echo "Starting Liquidsoap..."
su-exec liquidsoap liquidsoap "$LIQUIDSOAP_SCRIPT" &
LIQUIDSOAP_PID=$!

sleep 2

if ! kill -0 "$LIQUIDSOAP_PID" 2>/dev/null; then
    echo "ERROR: Liquidsoap failed to start!"
    cleanup
    exit 1
fi

echo "Liquidsoap started successfully (PID: $LIQUIDSOAP_PID)"

echo "Starting metadata pipeline..."
mkfifo /tmp/shairport-sync-metadata 2>/dev/null || true
chmod 666 /tmp/shairport-sync-metadata 2>/dev/null || true
su-exec liquidsoap sh -c 'shairport-sync-metadata-reader < /tmp/shairport-sync-metadata 2>/dev/null | /opt/scripts/metadata-bridge.sh 2>&1' &
METADATA_READER_PID=$!
echo "Metadata pipeline started (PID: $METADATA_READER_PID)"

echo "Starting shairport-sync..."
exec shairport-sync
