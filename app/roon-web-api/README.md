# roon-web-api

**This app includes source coming from [Stevenic/roon-kit](https://github.com/Stevenic/roon-kit):** see the [README.md](src/roon-kit/README.md) in the corresponding source folder for more details.

A [CQRS](https://martinfowler.com/bliki/CQRS.html) http mirror of [`roon` API](https://github.com/RoonLabs/node-roon-api).

## Why?

The [`roon` API](https://github.com/RoonLabs/node-roon-api) is kind of complicated to use: it is deeply connected, needs to subscribe at each kind of event (zone, outputs, queue) and is very generic.  
On top of that, every client needs to maintain its own connection and is, in fact, considered as an independent extension.

To avoid all these complications, this `node` app:
- establishes a unique connection to the `roon` server
- deals with disconnection and reconnection with the `roon` server
- subscribes to all known zones, all known outputs and all queues
- exposes a common and generic way to mutate states (the `Command` in [CQRS](https://martinfowler.com/bliki/CQRS.html))
- exposes as a [`Server Sent Event`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) endpoint that publish every event for every zone, every output and every queue
- re-exposes the [`roon` API](https://github.com/RoonLabs/node-roon-api) for `browsing` and `loading` content as to fetch images
- exposes a strongly typed and minimal api
- is ready to serve the content of a `SPA` as `web client`

## How to consume this api?

As stated, [`roon` API](https://github.com/RoonLabs/node-roon-api) is deeply connected and this [CQRS](https://martinfowler.com/bliki/CQRS.html) mirror is too.  
Every client needs first to `register`, the use the `client_id` provided in the `Location` header of the `register` response,  as a `path` parameter to call all others APIs (excluded the `image` API).

To ease this choreography, a [client module](../../packages/roon-web-client) is also available in this repo. Utilisation of this [client module](../../packages/roon-web-client) is highly recommended.

if you're still interested to understand how the API works, see the [api-route.ts](./src/route/api-route.ts). 
Another option is to look at the code of the [client](../../packages/roon-web-client/src/client/roon-web-client-factory.ts).

## Docker image

See the documentation available in the [main README](../../README.md) for how to use this docker image.

## Dev mode

Use, at the root of this `monorepo` the command:
```bash
yarn backend
```
It will transpile the app and launch it via `nodemon` which will recompile the app after any change made in the code.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
