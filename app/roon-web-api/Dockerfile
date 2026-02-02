ARG BUN_VERSION=1.3.6
ARG ALPINE_VERSION=3.23

FROM oven/bun:${BUN_VERSION}-alpine AS builder
WORKDIR /usr/src
COPY . .
RUN bun run cd

FROM alpine:${ALPINE_VERSION} AS runtime

RUN apk add --no-cache libgcc libstdc++

WORKDIR /usr/src/app

RUN addgroup -g 1000 bun && adduser -u 1000 -G bun -s /bin/sh -D bun \
    && mkdir /usr/src/app/config \
    && chown bun:bun /usr/src/app/config \
    && ln -sv /usr/src/app/config/config.json /usr/src/app/config.json

ARG BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=${BUN_RUNTIME_TRANSPILER_CACHE_PATH}

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV WEB_NG_PATH=/usr/src/app

COPY ./LICENSE ./LICENSE

COPY --from=builder /usr/src/node_modules/.bun/node-roon-api-audioinput@github+roonlabs+node-roon-api-audioinput+21ff59e/node_modules/node-roon-api-audioinput ./node_modules/node-roon-api-audioinput
COPY --from=builder /usr/src/node_modules/.bun/node-roon-api-browse@github+roonlabs+node-roon-api-browse+98adcba/node_modules/node-roon-api-browse ./node_modules/node-roon-api-browse
COPY --from=builder /usr/src/node_modules/.bun/node-roon-api-image@github+roonlabs+node-roon-api-image+a5f0efa/node_modules/node-roon-api-image ./node_modules/node-roon-api-image
COPY --from=builder /usr/src/node_modules/.bun/node-roon-api-settings@github+roonlabs+node-roon-api-settings+67cd8ca/node_modules/node-roon-api-settings ./node_modules/node-roon-api-settings
COPY --from=builder /usr/src/node_modules/.bun/node-roon-api-status@github+roonlabs+node-roon-api-status+504c918/node_modules/node-roon-api-status ./node_modules/node-roon-api-status
COPY --from=builder /usr/src/node_modules/.bun/node-roon-api-transport@github+roonlabs+node-roon-api-transport+2ee6000/node_modules/node-roon-api-transport ./node_modules/node-roon-api-transport
COPY --from=builder /usr/src/app/roon-web-api/bin/roon-web-api ./roon-web-api
COPY --from=builder /usr/src/app/roon-web-ng-client/dist/roon-web-ng-client/browser ./web

USER bun

CMD ["./roon-web-api"]
