# roon-web-client

A client package to consume the [API](../../app/roon-web-api) part of this project.

Here to abstract all the internal choreography implied by this [API](../../app/roon-web-api).

It's an `ES module`, so it should be convenient to include in app built with any modern `javascript` framework.

It has no dependency, (even if `rxjs` is used in the `backend` and this `monorepo` includes an `Angular` app), so it can be easily used in another `stack`.

## How to use it

### Consuming the package

Add this package to your dependency manager.  
For typings, you must also add the [model](../roon-web-model) of this `monorepo` as a devDependency

```json
{
  "dependencies": {
    "@nihilux/roon-web-client": "${version}"
  },
  "devDependencies": {
    "@nihilux/roon-web-model": "${version}"
  }
}
```

This package is `private`, so to use it, fork this `monorepo` and build your app in the `app` folder (you can delete the `roon-cqrs-web-ng-client` folder of your fork).  
Then build and copy the generated bundle at the expected place.  
See [CD](../../.github/workflows/cd.yml) and the step `Copy web app`.  
Just modify the first part of this `cp` command, your `index.html` and the rest of your bundle will be served by the `node` app inside the built `Docker` image at `/`.  

### In the code

#### Building a client

The only export of this package is a factory object with a `build` function that takes the `api` host as a `URL`:

```typescript
import { roonWebClientFactory } from "@nihilux/roon-web-client";

const protocol = "http";
const host = "hostname";
const port = 3000;
const client = roonWebClientFactory.build(new URL(`${protocol}://${host}:${port}`));
```

If you use this package in an app `built` with the [API](../../app/roon-web-api) in the same `Docker` image, you can simply use `window.location.href` as `URL` (see how it's done [in the Angular app](../../app/roon-web-ng-client/src/app/services/roon.service.ts), in the `start` method).

#### Using a client

To avoid missing any `event`, you must register any `EventListener` before calling `start` on the client.  
 Then you must wait for the `Promise` returned by the `start` method to complete before using other methods (an explicit `Error` will be thrown otherwise):

```typescript
const roonStateListener: RoonStateListener = (state) => {
  console.log(state);
};
client.onRoonState(roonStateListener);

// rince and repeat for all other events you want to listen (all listeners are typed)

void await client.start(); // feel free to do more for error handling!

const library: RoonApiBrowseLoadResponse = await client.library();
```

You'll find all the signatures and methods [in this definition file in the model package](../roon-web-model/src/client-model/client-model.d.ts).

#### Client lifecycle

doc to come...


## Disclaimer

**This doc is not complete, but as stated, it's a private package. I'll spend more time on this if some people starts to use this package, forking this repo.**
