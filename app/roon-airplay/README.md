# roon-airplay

A Docker container that exposes an AirPlay receiver and converts the audio to an HTTP stream for Roon.

This container runs `shairport-sync` to receive AirPlay audio from iOS devices, macOS, or iTunes, then uses `liquidsoap` to encode the raw PCM audio to OGG/FLAC and serves it via an embedded HTTP server (Liquidsoap harbor). Roon can then play this stream as an internet radio station.

## How it works

1. `shairport-sync` receives AirPlay audio and writes raw PCM to a FIFO pipe at `/tmp/shairport-sync-audio`, and writes metadata (artist, title, album) to `/tmp/shairport-sync-metadata`
2. `shairport-sync-metadata-reader` parses the metadata pipe and outputs human-readable text
3. `metadata-bridge.sh` accumulates metadata fields and sends them to roon-web-api via HTTP PUT
4. `liquidsoap` encodes audio to OGG/FLAC and serves it via HTTP on port 8000
5. `roon-web-api` receives the metadata and updates Roon's track info display

## Docker image

### Building the image

Build from the root of the monorepo:

```bash
docker build -t roon-airplay:latest -f app/roon-airplay/Dockerfile app/roon-airplay/
```

### Running the container

```bash
docker run \
  -d \
  --network host \
  --cap-add=sys_nice \
  --name roon-airplay \
  -e ROON_WEB_HOST=192.168.1.100 \
  -e ROON_WEB_PORT=3000 \
  -e ROON_AIRPLAY_HOST=name_or_ip_of_the_docker_host.local \
  -e ROON_AIRPLAY_PORT=8000
  -v /path/to/config:/etc/shairport-sync \
  roon-airplay:latest
```

### Required Docker flags

| Flag                 | Purpose                                                                                                                                                     |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--network host`     | **Required.** AirPlay uses mDNS/Bonjour for discovery, which requires host network access. Without this, i<br/>OS devices cannot find the AirPlay receiver. |
| `--capp-add=sys_nice`| **Prefered.** Ensure smoother scheduling for real time processing inside of the `roon-airplay` container.                                                   |

### Environment variables

| Variable            | Default     | Description                                                                                                 |
|---------------------|-------------|-------------------------------------------------------------------------------------------------------------|
| `ROON_WEB_HOST`     | `127.0.0.1` | Host where `roon-web-api` is running. Used by the notification script to signal AirPlay session start/stop. |
| `ROON_WEB_PORT`     | `3000`      | Port where `roon-web-api` is listening.                                                                     |
| `ROON_AIRPLAY_HOST` | `none`      | Host where `roon-airplay` is running. Needed in order to send the stream address to your roon server.       |
| `ROON_WEB_PORT`     | `8000`      | Port where `roon-airplay` is listening. Needed in order to send the stream address to your roon server.     |

### Volume mounts

| Path | Purpose |
|------|---------|
| `/etc/shairport-sync` | Optional. Persist custom shairport-sync configuration. |

## Stream URL

The HTTP stream is available at:

```
http://<host-ip>:8000/airplay
```

## Configuring Roon

When used with `roon-web-stack` you need to activate the feature in the extension settings (in roon: `Settings/Extensions`)
When activated, you also need to define a default zone where, when an `Airplay` stream is detected, the stream will be automatically played.
Other needed configuration is done via the `env variables` of the `roon-airplay` container.
When setup, the behavior is:
- when a stream is sent to the `roon-airplay` entrypoint, the stream is automatically sent to the configured zone
- the queue of the airplay zone is *suspended*, the same way it is suspended when listening a web radio.
- you can transfer the stream to any other zone, group zone, etc.
- when stream stops, the queue of the streaming zone is automatically restored

### Airplay support limitations

There are many limitations in Airplay support:
- playback control is not functional: `shairport-sync` does not support playback control from the `Airplay` entrypoint, so no playback support from `roon` is available
- volume management: in order to avoid two layers of volume management, volume management is disabled in `Airplay`. SO the `roon` zone volume management is the only way.

If you interrupt the stream from `roon` (via the `stop` button) the airplay device will continue to stream.

### Example of a complete docker-compose setup:

```yaml
name: roon-web-stack
services:
  roon-web-stack:
    image: nihiluxorg/roon-web-stack:latest
    container_name: roon-web-stack
    network_mode: host
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - config:/usr/src/app/config
    environment:
      - "PORT=8484"
      - "LOG_LEVEL=debug"
  roon-airplay:
    image: nihiluxorg/roon-airplay:latest
    container_name: roon-airplay
    network_mode: host
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - "ROON_WEB_HOST=host.docker.internal"
      - "ROON_WEB_PORT=8484"
      - "ROON_AIRPLAY_HOST=docker-host.local"
      - "ROON_AIRPLAY_PORT=8000"
    cap_add:
      - SYS_NICE

volumes:
  config:
```

## AirPlay device name

The AirPlay receiver appears on your network as **"roon airplay"**.

You can change this by modifying `config/shairport-sync.conf` before building the image:

```
general =
{
    name = "your custom name";
    ...
}
```

## Notifications

When an AirPlay session starts or stops, the container sends HTTP requests to the `roon-web-api`:

- **Session start**: `POST http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay`
- **Session stop**: `DELETE http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay`

This allows `roon-web-api` to track AirPlay state and potentially trigger actions in Roon.

## Metadata

The container automatically extracts metadata from the AirPlay source and sends it to roon-web-api, which updates Roon's track info display. The following metadata fields are included:

| Field              | Source |
|--------------------|--------|
| artist             | AirPlay metadata |
| title (track name) | AirPlay metadata |
| album              | AirPlay metadata |

### How it works

1. `shairport-sync` writes metadata to a FIFO pipe at `/tmp/shairport-sync-metadata`
2. `shairport-sync-metadata-reader` parses the pipe and outputs human-readable text
3. `metadata-bridge.sh` accumulates fields and sends them as JSON via HTTP PUT to `http://${ROON_WEB_HOST}:${ROON_WEB_PORT}/airplay/metadata`
4. roon-web-api receives the metadata and calls `AudioInputSessionManager#update_track_info` to update Roon's three-line display

## Troubleshooting

### AirPlay device not showing up

- **Check network mode**: Ensure you are using `--network host`. AirPlay discovery via mDNS does not work through Docker's bridge network.
- **Check firewall**: Ensure UDP port 5353 (mDNS) is not blocked by your host firewall.
- **Same network**: The iOS device and the Docker host must be on the same network segment for mDNS discovery to work.

### No audio from the stream

- **Check if liquidsoap is running**: Look at container logs for "Liquidsoap started successfully".
- **Check if AirPlay is connected**: You should see "Starting shairport-sync..." in the logs when audio starts.
- **Verify stream is accessible**: Open `http://<host-ip>:8000/airplay` in a browser or use `curl -I` to check if the stream endpoint responds.

### Audio is distorted or has artifacts

- **Check sample rate**: The pipeline expects 44.1kHz stereo PCM. If your source uses a different rate, audio may be distorted.
- **Network issues**: AirPlay is sensitive to network latency. Use a wired connection if possible.

### Container exits immediately

- **Check logs**: Run `docker logs roon-airplay` to see the error.
- **FIFO pipe issues**: If the container restarts frequently, there may be a stale FIFO pipe. The entrypoint script handles cleanup automatically, but check logs if issues persist.

### Roon cannot connect to the stream

- **Check host IP**: Ensure you are using the correct IP address in the stream URL.
- **Check port accessibility**: Ensure port 8000 is accessible from the Roon server.
- **Test directly**: Try opening the stream URL in VLC or another media player first.

## Logs

View container logs:

```bash
docker logs -f roon-airplay
```

The entrypoint script outputs status messages for:
- Base services startup (dbus, avahi, nqptp)
- FIFO pipe creation
- Liquidsoap startup
- Stream URL availability
- Shairport-sync startup
- Metadata pipeline startup (shairport-sync-metadata-reader → metadata-bridge.sh → roon-web-api)

## Technical details

- **Audio format**: Raw PCM (S16_LE, 44100Hz, 2 channels) from shairport-sync
- **Encoding**: OGG/FLAC (lossless, compression level 1)
- **Stream protocol**: HTTP via Liquidsoap `output.harbor` (no external streaming server)
- **Metadata**: Sent to roon-web-api via HTTP PUT as JSON (artist, title, album)
- **Metadata source**: shairport-sync metadata pipe via shairport-sync-metadata-reader
- **Base image**: `mikebrady/shairport-sync:latest` (Alpine-based)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
