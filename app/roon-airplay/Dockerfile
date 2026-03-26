FROM alpine:3.20 AS metadata-reader-builder

RUN apk add --no-cache build-base autoconf automake libtool git && \
    git clone --depth=1 https://github.com/mikebrady/shairport-sync-metadata-reader.git /build && \
    cd /build && autoreconf -i -f && ./configure && make

FROM savonet/liquidsoap-alpine:v2.4.2 AS liquidsoap-img

USER root
RUN liquidsoap --cache-stdlib

FROM mikebrady/shairport-sync:latest

RUN apk add --no-cache curl su-exec
COPY --from=liquidsoap-img /usr/bin/liquidsoap /usr/bin/
COPY --from=liquidsoap-img /usr/lib/*.so* /usr/lib/
COPY --from=liquidsoap-img /usr/lib/pulseaudio/ /usr/lib/pulseaudio/
COPY --from=liquidsoap-img /usr/share/liquidsoap/ /usr/share/liquidsoap/
COPY --from=metadata-reader-builder /build/shairport-sync-metadata-reader /usr/local/bin/
COPY pipeline.liq /opt/liquidsoap/pipeline.liq
COPY config/shairport-sync.conf /etc/shairport-sync.conf
COPY scripts/notify-roon.sh /opt/scripts/notify.sh
COPY scripts/metadata-bridge.sh /opt/scripts/metadata-bridge.sh
COPY entrypoint.sh /entrypoint-custom.sh
RUN chmod +x /entrypoint-custom.sh && \
    chmod +x /opt/scripts/notify.sh && \
    chmod +x /opt/scripts/metadata-bridge.sh && \
    mkdir -p /opt/liquidsoap /opt/scripts /var/run/shairport-sync && \
    chown -R shairport-sync:shairport-sync /opt/liquidsoap /opt/scripts && \
    liquidsoap --cache-stdlib

ENTRYPOINT ["/entrypoint-custom.sh"]
