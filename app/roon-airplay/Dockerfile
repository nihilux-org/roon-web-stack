FROM alpine:3.23 AS metadata-reader-builder

RUN apk add --no-cache build-base autoconf automake libtool git && \
    git clone --depth=1 https://github.com/mikebrady/shairport-sync-metadata-reader.git /build && \
    cd /build && autoreconf -i -f && ./configure && make

FROM alpine:3.23 AS downloader

ARG TARGETARCH
RUN apk add --no-cache curl && \
    ARCH=$(echo "$TARGETARCH" | sed 's/arm64/aarch64/' | sed 's/x86_64/amd64/') && \
    curl -sL -o /liquidsoap.apk \
      "https://github.com/savonet/liquidsoap/releases/download/v2.4.2/liquidsoap-ocaml5.4.0-${ARCH}-2.4.2-r0.apk"

FROM mikebrady/shairport-sync:latest

RUN echo 'https://dl-cdn.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories && \
    echo 'https://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories && \
    apk update
COPY --from=downloader /liquidsoap.apk /tmp/
RUN apk add --allow-untrusted --no-cache /tmp/liquidsoap.apk && \
    rm /tmp/liquidsoap.apk
RUN apk add --no-cache su-exec curl
RUN mkdir -p /opt/liquidsoap /opt/scripts /var/run/shairport-sync
COPY --from=metadata-reader-builder /build/shairport-sync-metadata-reader /usr/local/bin/shairport-sync-metadata-reader
COPY pipeline.liq /opt/liquidsoap/pipeline.liq
COPY config/shairport-sync.conf /etc/shairport-sync.conf
COPY scripts/notify-roon.sh /opt/scripts/notify.sh
COPY scripts/metadata-bridge.sh /opt/scripts/metadata-bridge.sh
COPY entrypoint.sh /entrypoint-custom.sh
RUN chmod +x /entrypoint-custom.sh && \
    chmod +x /opt/scripts/notify.sh && \
    chmod +x /opt/scripts/metadata-bridge.sh && \
    chown -R liquidsoap:liquidsoap /opt/liquidsoap /opt/scripts
USER liquidsoap
RUN liquidsoap --cache-stdlib
USER root

ENTRYPOINT ["/entrypoint-custom.sh"]

EXPOSE 8000
