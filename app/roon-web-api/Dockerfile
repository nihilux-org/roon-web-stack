ARG ALPINE_VERSION=3.20

FROM node:20-alpine${ALPINE_VERSION} AS builder
RUN mkdir -p /usr/src/roon-web-stack
WORKDIR /usr/src/roon-web-stack
COPY . /usr/src/roon-web-stack
RUN corepack enable yarn && \
    yarn workspaces focus @nihilux/roon-web-api --production

FROM alpine:${ALPINE_VERSION}
WORKDIR /usr/src/app
RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node \
  && chown node:node ./
RUN mkdir /usr/src/app/config \
    && chown node:node /usr/src/app/config \
    && ln -sv /usr/src/app/config/config.json /usr/src/app/config.json
VOLUME /usr/src/app/config
ENV HOST=0.0.0.0
COPY --from=builder /usr/local/bin/node /usr/local/bin/
COPY --from=builder /usr/local/bin/docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]
RUN apk add --no-cache libstdc++ dumb-init
COPY --from=builder /usr/src/roon-web-stack/LICENSE ./LICENSE
COPY --from=builder /usr/src/roon-web-stack/app/roon-web-api/node_modules ./node_modules
COPY --from=builder /usr/src/roon-web-stack/app/roon-web-api/bin/app.js ./app.js
COPY --from=builder /usr/src/roon-web-stack/app/roon-web-ng-client/dist/roon-web-ng-client/browser ./web
USER node
CMD ["dumb-init", "node", "app.js"]
