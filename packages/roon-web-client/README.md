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
    "@nihilux/roon-web-client": "workspace:*"
  },
  "devDependencies": {
    "@nihilux/roon-web-model": "workspace:*"
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

// rinse and repeat for all other events you want to listen (all listeners are typed)

await client.start(); // feel free to do more for error handling!

const library: RoonApiBrowseLoadResponse = await client.load({ hierarchy: "browse", level: 0, count: 100 });
```

You'll find all the signatures and methods [in this definition file in the model package](../roon-web-model/src/client-model/index.ts).

#### Client lifecycle

The client follows a straightforward lifecycle:

```
build → register listeners → start → use → stop
```

1. **Build**: Create a client instance using the factory
2. **Register listeners**: Subscribe to events before starting (to avoid missing any)
3. **Start**: Call `start()` to register with the API and establish the SSE connection
4. **Use**: Interact with Roon via `command()`, `browse()`, `load()`, etc.
5. **Stop**: Call `stop()` to cleanly unregister and close the connection

```typescript
// Build
const client = roonWebClientFactory.build(new URL("http://localhost:3000"));

// Register listeners BEFORE starting
client.onRoonState((state) => console.log("Roon state:", state));
client.onZoneState((zone) => console.log("Zone update:", zone));

// Start
await client.start();

// Use
await client.command({ type: "PLAY", data: { zone_id: "..." } });

// Stop when done
await client.stop();
```

**Optional client ID**: You can pass a previous `roonClientId` to `start()` to restore a previous session:

```typescript
await client.start("saved-client-id");
```

#### Error handling and reconnection

The client handles connection issues automatically:

- **Automatic reconnection**: When the SSE connection drops, the client marks itself for refresh. Subsequent API calls will trigger an automatic reconnection attempt.
- **Ping timeout**: The server sends periodic pings. If no ping is received within 1.5x the expected interval, the client marks itself for refresh.
- **Client state events**: Subscribe to `onClientState` to monitor connection health:

```typescript
client.onClientState((clientState) => {
  switch (clientState.status) {
    case "started":
      console.log("Connected, client ID:", clientState.roonClientId);
      break;
    case "outdated":
      console.log("Server version changed, refresh needed");
      break;
    case "to-refresh":
      console.log("Connection lost, will refresh on next call");
      break;
    case "not-started":
      console.log("Client not started");
      break;
  }
});
```

- **Manual refresh**: Call `refresh()` to force a reconnection if needed:

```typescript
await client.refresh();
```

- **Restart**: Call `restart()` to close and re-establish the connection:

```typescript
await client.restart();
```

#### Event types

The client emits events via typed listeners. Register listeners using `on*` methods and unregister with `off*` methods:

| Listener | Event Data | Description |
|----------|------------|-------------|
| `onRoonState` | `ApiState` | Overall Roon state: connection status, available zones and outputs |
| `onZoneState` | `ZoneState` | Zone updates: playback state, now playing info, volume |
| `onQueueState` | `QueueState` | Queue updates: tracks in the current zone's queue |
| `onCommandState` | `CommandState` | Command results: success/failure of sent commands |
| `onClientState` | `ClientState` | Client connection status: started, outdated, to-refresh |
| `onSharedConfig` | `SharedConfig` | Shared configuration: custom actions |

**Event data types:**

```typescript
// ApiState - overall Roon status
interface ApiState {
  state: RoonState; // "LOST" | "STARTING" | "STOPPED" | "SYNC" | "SYNCING"
  zones: ZoneDescription[];
  outputs: OutputDescription[];
}

// ZoneState - zone playback info
interface ZoneState {
  zone_id: string;
  display_name: string;
  state: RoonPlaybackState; // "playing" | "paused" | "loading" | "stopped"
  nice_playing?: {
    track: Track;
    state: RoonPlaybackState;
    nb_items_in_queue?: number;
  };
  // ... more fields
}

// QueueState - queue contents
interface QueueState {
  zone_id: string;
  tracks: QueueTrack[];
}

// CommandState - command result
interface CommandState {
  command_id: string;
  state: CommandResult; // "APPLIED" | "REJECTED"
  cause?: string;
}

// ClientState - client status
interface ClientState {
  status: ClientStatus; // "started" | "outdated" | "not-started" | "to-refresh"
  roonClientId?: string;
}
```

#### Available methods

| Method | Description |
|--------|-------------|
| `start(clientId?)` | Register with the API and establish SSE connection |
| `stop()` | Unregister and close the connection |
| `restart()` | Close and re-establish the connection |
| `refresh()` | Reconnect if needed |
| `command(cmd)` | Send a control command (play, pause, volume, etc.) |
| `browse(options)` | Browse the Roon library hierarchy |
| `load(options)` | Load items from a browse level |
| `loadPath(zone_id, path)` | Navigate to a specific library path |
| `findItemIndex(search)` | Find an item by first letter in a list |
| `version()` | Get the roon-web-stack version |

## Note

This is a private package intended for use within this monorepo. If you're forking this project, the documentation above should help you integrate the client into your own app.
