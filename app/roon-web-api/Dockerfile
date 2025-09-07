# ---- build stage -------------------------------------------------------------
ARG ALPINE_VERSION=3.22
FROM node:22-alpine${ALPINE_VERSION} AS builder

# Workdir & sources
RUN mkdir -p /usr/src/roon-web-stack
WORKDIR /usr/src/roon-web-stack
COPY . /usr/src/roon-web-stack

# Use Yarn Berry (v4) and node_modules linker (not PnP)
# This avoids the "Invalid subcommand" error and ensures node_modules exist.
RUN corepack enable \
 && corepack prepare yarn@stable --activate \
 && yarn --version \
 && yarn config set nodeLinker node-modules \
 && yarn workspaces focus @nihilux/roon-web-api --production

# ---- runtime stage -----------------------------------------------------------
FROM alpine:${ALPINE_VERSION}

# Minimal runtime prerequisites
RUN apk add --no-cache libstdc++ dumb-init

# App user & dirs
WORKDIR /usr/src/app
RUN addgroup -g 1000 node \
 && adduser -u 1000 -G node -s /bin/sh -D node \
 && chown node:node /usr/src/app \
 && mkdir -p /usr/src/app/config \
 && chown node:node /usr/src/app/config \
 && ln -sv /usr/src/app/config/config.json /usr/src/app/config.json

ENV HOST=0.0.0.0

# Bring in Node runtime and the default entrypoint from the builder image
COPY --from=builder /usr/local/bin/node /usr/local/bin/
COPY --from=builder /usr/local/bin/docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]

# License, server, deps
COPY --from=builder /usr/src/roon-web-stack/LICENSE ./LICENSE
COPY --from=builder /usr/src/roon-web-stack/app/roon-web-api/node_modules ./node_modules
COPY --from=builder /usr/src/roon-web-stack/app/roon-web-api/bin/app.js ./app.js

# IMPORTANT: use the bundle you actually have (bin/browser), not ng-client/dist
COPY --from=builder /usr/src/roon-web-stack/app/roon-web-api/bin/browser ./web

USER node
CMD ["dumb-init", "node", "app.js"]
