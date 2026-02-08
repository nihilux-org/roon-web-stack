ARG BUN_VERSION=1.3.9
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

COPY --from=builder /usr/src/app/roon-web-api/bin/roon-web-api ./roon-web-api
COPY --from=builder /usr/src/app/roon-web-api/bin/node_modules ./node_modules
COPY --from=builder /usr/src/app/roon-web-ng-client/dist/roon-web-ng-client/browser ./web

USER bun

CMD ["./roon-web-api"]
