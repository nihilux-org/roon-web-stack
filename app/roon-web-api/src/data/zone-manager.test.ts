import { loggerMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";
import { dataConverterMock } from "./data-converter.mock";
import { queueBotMock } from "./queue-bot-manager.mock";
import { queueManagerFactoryMock } from "./queue-manager.mock";

import { Subject } from "rxjs";
import { Mock } from "vitest";
import { logger } from "@infrastructure";
import {
  ApiState,
  Output,
  OutputListener,
  Queue,
  QueueManager,
  QueueSseMessage,
  QueueState,
  RoonApiBrowse,
  RoonApiImage,
  RoonApiTransport,
  RoonApiTransportOutputs,
  RoonApiTransportZones,
  RoonServer,
  RoonSseMessage,
  RoonState,
  RoonSubscriptionResponse,
  ServerListener,
  Zone,
  ZoneListener,
  ZoneManager,
  ZoneState,
} from "@nihilux/roon-web-model";

describe("zone-manager.ts test suite", () => {
  let zoneManager: ZoneManager;
  let serverPairedListener: ServerListener;
  let serverLostListener: ServerListener;
  let zoneListener: ZoneListener;
  let outputListener: OutputListener;
  let RoonApiBrowse: RoonApiBrowse;
  let RoonApiImage: RoonApiImage;
  let RoonApiTransport: RoonApiTransport;
  let server: RoonServer;
  let queueManager: QueueManager;
  let queueManagerRoonSseMessage: Subject<RoonSseMessage> | undefined = undefined;
  let otherQueueManager: QueueManager;
  let otherQueueManagerRoonSseMessage: Subject<RoonSseMessage> | undefined = undefined;
  let yetAnotherQueueManager: QueueManager;
  let yetAnotherQueueManagerRoonSseMessage: Subject<RoonSseMessage> | undefined = undefined;
  let yetAnotherQueueManagerIsStarted: Mock;
  beforeEach(async () => {
    await vi
      .importActual<{ zoneManager: ZoneManager }>("./zone-manager")
      .then((module) => {
        zoneManager = module.zoneManager as unknown as ZoneManager;
      })
      .catch((err: unknown) => {
        logger.error(err);
      });
    RoonApiBrowse = vi.mocked({}) as unknown as RoonApiBrowse;
    RoonApiImage = vi.mocked({}) as unknown as RoonApiImage;
    RoonApiTransport = vi.mocked({}) as unknown as RoonApiTransport;
    server = {
      services: {
        RoonApiTransport,
        RoonApiBrowse,
        RoonApiImage,
      },
    } as unknown as RoonServer;
    roonMock.server.mockImplementation(() => Promise.resolve(server));
    roonMock.onServerPaired.mockImplementation((listener: ServerListener) => {
      serverPairedListener = listener;
      listener(server);
    });
    roonMock.onServerLost.mockImplementation((listener: ServerListener) => {
      serverLostListener = listener;
    });
    roonMock.onOutputs.mockImplementation((listener: OutputListener) => {
      outputListener = listener;
    });
    roonMock.onZones.mockImplementation((listener: ZoneListener) => {
      zoneListener = listener;
    });
    dataConverterMock.convertZone.mockImplementation((z: Zone): ZoneState => {
      if (z.zone_id === ZONE.zone_id) {
        return ZONE_STATE;
      } else if (z.zone_id === OTHER_ZONE.zone_id) {
        return OTHER_ZONE_STATE;
      } else {
        return YET_ANOTHER_ZONE_STATE;
      }
    });
    dataConverterMock.buildApiState.mockImplementation((state: RoonState) => ({
      state,
      zones: [],
    }));
    dataConverterMock.toRoonSseMessage.mockImplementation((data: Zone | Queue | ApiState): RoonSseMessage => {
      if ("display_name" in data) {
        let state;
        if (data.zone_id === ZONE.zone_id) {
          state = ZONE_STATE;
        } else if (data.zone_id === OTHER_ZONE.zone_id) {
          state = OTHER_ZONE_STATE;
        } else {
          state = YET_ANOTHER_ZONE_STATE;
        }
        return {
          event: "zone",
          data: state,
        };
      } else if ("zones" in data) {
        return {
          event: "state",
          data,
        };
      } else {
        return {} as unknown as RoonSseMessage;
      }
    });
    queueManager = {
      queue: vi.fn().mockImplementation(() => ({
        event: "queue",
        data: {
          zone_id: ZONE.zone_id,
        } as Queue,
      })),
      stop: vi.fn(),
      start: vi.fn().mockImplementation(() => Promise.resolve()),
      isStarted: vi.fn().mockImplementation(() => true),
    } as unknown as QueueManager;
    otherQueueManager = {
      queue: vi.fn().mockImplementation(() => ({
        event: "queue",
        data: {
          zone_id: OTHER_ZONE.zone_id,
        } as Queue,
      })),
      stop: vi.fn(),
      start: vi.fn().mockImplementation(() => Promise.resolve()),
      isStarted: vi.fn().mockImplementation(() => true),
    } as unknown as QueueManager;
    yetAnotherQueueManagerIsStarted = vi.fn().mockImplementation(() => true);
    yetAnotherQueueManager = {
      queue: vi.fn().mockImplementation(() => ({
        event: "queue",
        data: {
          zone_id: YET_ANOTHER_ZONE.zone_id,
        } as Queue,
      })),
      stop: vi.fn(),
      start: vi.fn().mockImplementation(() => Promise.resolve()),
      isStarted: yetAnotherQueueManagerIsStarted,
    } as unknown as QueueManager;
    queueManagerFactoryMock.build.mockImplementation(
      (z: Zone, eventEmitter: Subject<RoonSseMessage>, queueSize: number) => {
        expect(queueSize).toEqual(150);
        if (z.zone_id === ZONE.zone_id) {
          queueManagerRoonSseMessage = eventEmitter;
          return queueManager;
        } else if (z.zone_id === OTHER_ZONE.zone_id) {
          otherQueueManagerRoonSseMessage = eventEmitter;
          return otherQueueManager;
        } else {
          yetAnotherQueueManagerRoonSseMessage = eventEmitter;
          return yetAnotherQueueManager;
        }
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("zoneManager#start should register onServerPaired and onServerLost listeners and call roonExtension#startDiscovery", async () => {
    await zoneManager.start();
    expect(roonMock.onServerPaired).toHaveBeenCalledTimes(1);
    expect(roonMock.onServerPaired).toHaveBeenCalledWith(serverPairedListener);
    expect(roonMock.onServerLost).toHaveBeenCalledTimes(1);
    expect(roonMock.onServerLost).toHaveBeenCalledWith(serverLostListener);
    expect(roonMock.startExtension).toHaveBeenCalledTimes(1);
  });

  it("zoneManager#start should call queueBot#start when the connection with the server is established for the first time but not on reconnection", async () => {
    await zoneManager.start();
    expect(queueBotMock.start).toHaveBeenCalledTimes(1);
    expect(queueBotMock.start).toHaveBeenCalledWith(roonMock);
    serverLostListener(server);
    serverPairedListener(server);
    expect(queueBotMock.start).toHaveBeenCalledTimes(1);
  });

  it("zoneManager#start return a rejected Promise if zoneManager has already been started", async () => {
    await zoneManager.start();
    const otherPromise = zoneManager.start();
    await expect(otherPromise).rejects.toEqual(new Error("zoneManager as already been started"));
  });

  it("zoneManager#start should produce the following sequence of states: STARTING, SYNCING", async () => {
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((s) => messages.push(s));
    await zoneManager.start();
    expect(messages).toHaveLength(2);
    expect(messages).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.STARTING,
          zones: [],
          outputs: [],
        },
      },
      {
        event: "state",
        data: {
          state: RoonState.SYNCING,
          zones: [],
          outputs: [],
        },
      },
    ]);
  });

  it("zoneManager#start should be resolved when zoneManager#state publish the SYNC event", async () => {
    const startPromise = zoneManager.start();
    await new Promise<void>((resolve) => {
      zoneManager.events().subscribe((m) => {
        if (m.event === "state" && m.data.state === RoonState.SYNC) {
          void expect(startPromise)
            .resolves.toBeUndefined()
            .then(() => resolve());
        }
      });
      zoneListener(server, "Subscribed", {} as unknown as RoonApiTransportZones);
    });
  });

  it("zoneManager#start should log error and continue if QueueManager#start is rejected", async () => {
    const error = new Error("error");
    otherQueueManager = {
      queue: vi.fn().mockImplementation(() => {
        throw error;
      }),
      stop: vi.fn(),
      start: vi.fn().mockImplementation(() => Promise.reject(error)),
      isStarted: vi.fn().mockImplementation(() => false),
    } as unknown as QueueManager;
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((m) => messages.push(m));
    expect(messages.length).toEqual(4);
  });

  it("zoneManager#zones should return a pair zone_id/zone_display for each known zones", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    const zd = zoneManager.zones();
    expect(zd).toEqual([
      {
        zone_id: ZONE.zone_id,
        display_name: ZONE.display_name,
      },

      {
        zone_id: OTHER_ZONE.zone_id,
        display_name: OTHER_ZONE.display_name,
      },
    ]);
  });

  it("zoneManager should add zones from 'zones_added' in 'Changed' roon zone events in its managed zones and publish its state", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    expect(zoneManager.zones()).toHaveLength(2);
    const states: ZoneState[] = [];
    zoneManager.events().subscribe((event) => {
      if (event.event === "zone") {
        states.push(event.data);
      }
    });
    expect(states).toHaveLength(2);
    zoneListener(server, "Changed", {
      zones_added: [YET_ANOTHER_ZONE],
    });
    const zds = zoneManager.zones();
    expect(zds).toHaveLength(3);
    expect(zds).toEqual([
      {
        zone_id: ZONE.zone_id,
        display_name: ZONE.display_name,
      },
      {
        zone_id: OTHER_ZONE.zone_id,
        display_name: OTHER_ZONE.display_name,
      },
      {
        zone_id: YET_ANOTHER_ZONE.zone_id,
        display_name: YET_ANOTHER_ZONE.display_name,
      },
    ]);
    expect(states).toHaveLength(3);
  });

  it("zoneManager gracefully ignore an already known zone presents in 'zones_added' in 'Changed' roon zone events in its managed zones and not republish its state", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    expect(zoneManager.zones()).toHaveLength(2);
    const states: ZoneState[] = [];
    zoneManager.events().subscribe((event) => {
      if (event.event === "zone") {
        states.push(event.data);
      }
    });
    expect(states).toHaveLength(2);
    zoneListener(server, "Changed", {
      zones_added: [OTHER_ZONE],
    });
    const zds = zoneManager.zones();
    expect(zds).toHaveLength(2);
    expect(zds).toEqual([
      {
        zone_id: ZONE.zone_id,
        display_name: ZONE.display_name,
      },
      {
        zone_id: OTHER_ZONE.zone_id,
        display_name: OTHER_ZONE.display_name,
      },
    ]);
    expect(states).toHaveLength(2);
  });

  it("zoneManager should remove zones from 'zones_removed' in 'Changed' roon zone events from its managed zones", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    expect(zoneManager.zones()).toHaveLength(3);
    zoneListener(server, "Changed", {
      zones_removed: [YET_ANOTHER_ZONE.zone_id],
    });
    const zds = zoneManager.zones();
    expect(zds).toHaveLength(2);
    expect(zds).toEqual([
      {
        zone_id: ZONE.zone_id,
        display_name: ZONE.display_name,
      },
      {
        zone_id: OTHER_ZONE.zone_id,
        display_name: OTHER_ZONE.display_name,
      },
    ]);
  });

  it("zoneManager should not complete the Observers when a zone is removed", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    expect(zoneManager.zones()).toHaveLength(3);
    let stopped = false;
    zoneManager.events().subscribe({
      complete: () => {
        stopped = true;
      },
    });
    zoneListener(server, "Changed", {
      zones_removed: [YET_ANOTHER_ZONE.zone_id],
    });
    const zds = zoneManager.zones();
    expect(zds).toHaveLength(2);
    expect(stopped).toEqual(false);
  });

  it("zoneManager should gracefully handle a 'Changed' zone event containing unknown 'zones_removed'", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    expect(zoneManager.zones()).toHaveLength(3);
    zoneListener(server, "Changed", {
      zones_removed: ["unknown_zone_id"],
    });
    const zds = zoneManager.zones();
    expect(zds).toHaveLength(3);
  });

  it("zoneManager#events should return an Observable forwarding 'zones_changed' from 'Changed' roon zone events as RoonSseMessage", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    zoneListener(server, "Changed", {
      zones_changed: [ZONE, OTHER_ZONE],
    });
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((message) => messages.push(message));
    expect(messages).toHaveLength(5);
    expect(messages).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
            {
              display_name: OTHER_ZONE.display_name,
              zone_id: OTHER_ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },

            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[0].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[0].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[1].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[1].output_id,
            },
          ],
        },
      },
      ZONE_MESSAGE,
      QUEUE_MESSAGE,
      {
        event: "zone",
        data: OTHER_ZONE_STATE,
      },
      {
        event: "queue",
        data: {
          zone_id: OTHER_ZONE.zone_id,
        },
      },
    ]);
  });

  it("zoneManager should gracefully handle a 'Changed' zone event containing an unknown zone", async () => {
    await zoneManager.start();
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((m) => messages.push(m));
    zoneListener(server, "Subscribed", {
      zones: [ZONE],
    });
    zoneListener(server, "Changed", {
      zones_changed: [
        {
          ...ZONE,
          zone_id: "unknown_zone_id",
        },
        ZONE,
      ],
    });
    expect(messages).toHaveLength(5);
    expect(messages).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.SYNCING,
          zones: [],
          outputs: [],
        },
      },
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },
            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
          ],
        },
      },
      ZONE_MESSAGE,
      ZONE_MESSAGE,
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },
            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
          ],
        },
      },
    ]);
  });

  it("zoneManager#events should return an Observable forwarding 'zones_seek_changed' from 'Changed' roon zone events as RoonSseMessage", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((message) => messages.push(message));
    zoneListener(server, "Changed", {
      zones_seek_changed: [
        {
          zone_id: ZONE.zone_id,
          seek_position: 420,
          queue_time_remaining: 424242,
        },
        {
          zone_id: OTHER_ZONE.zone_id,
          seek_position: 420,
          queue_time_remaining: 424242,
        },
      ],
    });
    expect(messages).toHaveLength(7);
    expect(messages).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              zone_id: ZONE.zone_id,
              display_name: ZONE.display_name,
            },
            {
              zone_id: OTHER_ZONE.zone_id,
              display_name: OTHER_ZONE.display_name,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },

            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[0].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[0].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[1].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[1].output_id,
            },
          ],
        },
      },
      ZONE_MESSAGE,
      QUEUE_MESSAGE,
      {
        event: "zone",
        data: OTHER_ZONE_STATE,
      },
      {
        event: "queue",
        data: {
          zone_id: OTHER_ZONE.zone_id,
        },
      },
      ZONE_MESSAGE,
      {
        event: "zone",
        data: OTHER_ZONE_STATE,
      },
    ]);
    expect(dataConverterMock.toRoonSseMessage).toHaveBeenCalledTimes(10);
    const convertZoneArgs = dataConverterMock.toRoonSseMessage.mock.lastCall as unknown[];
    expect(convertZoneArgs[0]).toEqual({
      ...OTHER_ZONE,
      queue_time_remaining: 424242,
      seek_position: 420,
      now_playing: {
        ...OTHER_ZONE.now_playing,
        seek_position: 420,
      },
    });
  });

  it("zoneManager should handle gracefully 'Changed' zone events containing 'zones_seek_changed' about an unknown zone", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((message) => messages.push(message));
    zoneListener(server, "Changed", {
      zones_seek_changed: [
        {
          zone_id: ZONE.zone_id,
          seek_position: 420,
          queue_time_remaining: 424242,
        },
        {
          zone_id: "unknown_zone_id",
          seek_position: 420,
          queue_time_remaining: 424242,
        },
      ],
    });
    zoneListener(server, "Changed", {
      zones_seek_changed: [
        {
          zone_id: ZONE.zone_id,
          seek_position: 420,
          queue_time_remaining: 424242,
        },
      ],
    });
    expect(messages).toHaveLength(7);
  });

  it(
    "zoneManager should handle gracefully 'Changed' zone events containing 'zones_seek_changed' " +
      "without 'seek_position'",
    async () => {
      await zoneManager.start();
      zoneListener(server, "Subscribed", {
        zones: [ZONE, OTHER_ZONE],
      });
      const messages: RoonSseMessage[] = [];
      zoneManager.events().subscribe((message) => messages.push(message));
      zoneListener(server, "Changed", {
        zones_seek_changed: [
          {
            zone_id: ZONE.zone_id,
            seek_position: 420,
            queue_time_remaining: 424242,
          },
        ],
      });
      zoneListener(server, "Changed", {
        zones_seek_changed: [
          {
            zone_id: ZONE.zone_id,
            queue_time_remaining: 424242,
          },
        ],
      });
      expect(messages).toHaveLength(7);
    }
  );

  it(
    "zoneManager should handle gracefully 'Changed' zone events containing 'zones_seek_changed' " +
      "with 'seek_position' for a zone without 'now_playing'",
    async () => {
      await zoneManager.start();
      zoneListener(server, "Subscribed", {
        zones: [
          {
            ...ZONE,
            now_playing: undefined,
          },
          OTHER_ZONE,
        ],
      });
      const messages: RoonSseMessage[] = [];
      zoneManager.events().subscribe((message) => messages.push(message));
      zoneListener(server, "Changed", {
        zones_seek_changed: [
          {
            zone_id: ZONE.zone_id,
            seek_position: 420,
            queue_time_remaining: 424242,
          },
        ],
      });
      zoneListener(server, "Changed", {
        zones_seek_changed: [
          {
            zone_id: ZONE.zone_id,
            queue_time_remaining: 424242,
          },
        ],
      });
      expect(messages).toHaveLength(7);
    }
  );

  it(
    "zoneManager should handle gracefully 'Changed' zone events containing " +
      "'zones_seek_changed' without 'queue_time_remaining'",
    async () => {
      await zoneManager.start();
      zoneListener(server, "Subscribed", {
        zones: [ZONE, OTHER_ZONE],
      });
      const messages: RoonSseMessage[] = [];
      zoneManager.events().subscribe((message) => messages.push(message));
      zoneListener(server, "Changed", {
        zones_seek_changed: [
          {
            zone_id: ZONE.zone_id,
            seek_position: 420,
            queue_time_remaining: 424242,
          },
        ],
      });
      zoneListener(server, "Changed", {
        zones_seek_changed: [
          {
            zone_id: ZONE.zone_id,
            seek_position: 420,
          },
        ],
      });
      expect(messages).toHaveLength(7);
    }
  );

  it("zoneManager#events should send 'complete' to Observers when event 'Unsubscribed' is received from roon", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    let stopped = false;
    zoneManager.events().subscribe({
      complete: () => {
        stopped = true;
      },
    });
    zoneListener(server, "Unsubscribed", {});
    expect(stopped).toEqual(true);
    expect(zoneManager.zones()).toHaveLength(0);
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).toHaveBeenCalledWith("zones unsubscribed: %s", JSON.stringify({}));
    expect(queueManager.stop).toHaveBeenCalledTimes(1);
    expect(otherQueueManager.stop).toHaveBeenCalledTimes(1);
    expect(yetAnotherQueueManager.stop).toHaveBeenCalledTimes(1);
  });

  it("zoneManager should log in debug any unknown zone event received from roon", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE],
    });
    const response: RoonSubscriptionResponse = "Unknown" as RoonSubscriptionResponse;
    const body: RoonApiTransportZones = {
      unknown_attribute: "unknown_attribute",
    } as unknown as RoonApiTransportZones;
    zoneListener(server, response, body);
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      "unknown zone event '$%s' with body %s",
      response,
      JSON.stringify(body)
    );
  });

  it("zoneManager#events should subscribe to an Observable forwarding the QueueSseEvent coming from the associated QueueManager", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    const states: RoonSseMessage[] = [];
    zoneManager.events().subscribe((state) => states.push(state));
    const queueSseMessage: QueueSseMessage = {
      event: "queue",
      data: {
        zone_id: ZONE.zone_id,
        tracks: [
          {
            title: "title",
            queue_item_id: 42,
          },
          {
            title: "other_title",
            queue_item_id: 420,
          },
        ],
      },
    };
    queueManagerRoonSseMessage?.next(queueSseMessage);
    otherQueueManagerRoonSseMessage?.next(queueSseMessage);
    yetAnotherQueueManagerRoonSseMessage?.next(queueSseMessage);
    expect(states).toHaveLength(10);
    expect(states[7]).toEqual(queueSseMessage);
    expect(states[8]).toEqual(queueSseMessage);
    expect(states[9]).toEqual(queueSseMessage);
  });

  it("zoneManager#events should return an Observable forwarding the 'Changed' events concerning the zone Outputs coming from roon API", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    const states: RoonSseMessage[] = [];
    zoneManager.events().subscribe((state) => states.push(state));
    outputListener(server, "Changed", {
      changed_outputs: [
        {
          ...ZONE.outputs[0],
          state: "loading",
        },
      ],
    } as unknown as RoonApiTransportOutputs);
    expect(states).toHaveLength(8);
    expect(dataConverterMock.toRoonSseMessage).toHaveBeenCalledTimes(11);
    const convertZoneArgs = dataConverterMock.toRoonSseMessage.mock.lastCall as unknown[];
    expect(convertZoneArgs[0]).toEqual({
      ...ZONE,
      outputs: [
        {
          ...ZONE.outputs[0],
          state: "loading",
        },
        ZONE.outputs[1],
      ],
    });
  });

  it("zoneManager should gracefully handle a 'Changed' output event without changes", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE],
    });
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((m) => messages.push(m));
    outputListener(server, "Changed", {} as unknown as RoonApiTransportOutputs);
    expect(messages).toHaveLength(3);
    outputListener(server, "Changed", {
      changed_outputs: [
        {
          ...ZONE.outputs[0],
          state: "loading",
        },
      ],
    } as unknown as RoonApiTransportOutputs);
    expect(messages).toHaveLength(4);
    expect(messages).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },

            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
          ],
        },
      },
      ZONE_MESSAGE,
      QUEUE_MESSAGE,
      ZONE_MESSAGE,
    ]);
  });

  it("zoneManager should gracefully handle a 'Changed' output event containing an output associated with an unknown zone", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE],
    });
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((m) => messages.push(m));

    outputListener(server, "Changed", {
      changed_outputs: [
        {
          ...ZONE.outputs[0],
          zone_id: "unknown_zone_id",
        },
        ZONE.outputs[0],
      ],
    } as unknown as RoonApiTransportOutputs);
    expect(messages).toHaveLength(4);
    expect(messages).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },

            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
          ],
        },
      },
      ZONE_MESSAGE,
      QUEUE_MESSAGE,
      ZONE_MESSAGE,
    ]);
  });

  it("zoneManager#events silently ignore any 'Subscribed' event concerning the Outputs of the zone and coming from roon API", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    const states: RoonSseMessage[] = [];
    zoneManager.events().subscribe((state) => states.push(state));
    const response = "Subscribed" as RoonSubscriptionResponse;
    const body = {
      unknown_attribute: "unknown_attribute",
    } as unknown as RoonApiTransportOutputs;
    outputListener(server, response, body);
    expect(states).toHaveLength(7);
  });

  it("zoneManager#events should log and ignore any event other than 'Changed' concerning the Outputs of the zone and coming from roon API", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    const states: RoonSseMessage[] = [];
    zoneManager.events().subscribe((state) => states.push(state));
    const response = "Unknown" as RoonSubscriptionResponse;
    const body = {
      unknown_attribute: "unknown_attribute",
    } as unknown as RoonApiTransportOutputs;
    outputListener(server, response, body);
    expect(states).toHaveLength(7);
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      "unknown output event '%s' with body %s",
      response,
      JSON.stringify(body)
    );
  });

  it("zoneManager#stop should complete all open Observables", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    const stopped: boolean[] = [false, false];
    zoneManager.events().subscribe({
      complete: () => {
        stopped[0] = true;
      },
    });
    zoneManager.events().subscribe({
      complete: () => {
        stopped[1] = true;
      },
    });
    zoneManager.stop();
    expect(stopped).toEqual([true, true]);
  });

  it("zoneManager should not complete any running Observable and publish the state 'LOST' when connection with the roon server is lost", async () => {
    const states: RoonSseMessage[] = [];
    zoneManager.events().subscribe((s) => {
      if (s.event === "state") {
        states.push(s);
      }
    });
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
    });
    const stopped: boolean[] = [false, false, false];
    zoneManager.events().subscribe({
      complete: () => {
        stopped[0] = true;
      },
    });
    zoneManager.events().subscribe({
      complete: () => {
        stopped[1] = true;
      },
    });
    zoneManager.events().subscribe({
      complete: () => {
        stopped[2] = true;
      },
    });
    serverLostListener(server);
    expect(stopped).toEqual([false, false, false]);
    expect(states).toEqual([
      {
        event: "state",
        data: {
          state: RoonState.STARTING,
          zones: [],
          outputs: [],
        },
      },
      {
        event: "state",
        data: {
          state: RoonState.SYNCING,
          zones: [],
          outputs: [],
        },
      },
      {
        event: "state",
        data: {
          state: RoonState.SYNC,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
            {
              display_name: OTHER_ZONE.display_name,
              zone_id: OTHER_ZONE.zone_id,
            },
            {
              display_name: YET_ANOTHER_ZONE.display_name,
              zone_id: YET_ANOTHER_ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },
            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[0].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[0].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[1].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[1].output_id,
            },
            {
              display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
              zone_id: YET_ANOTHER_ZONE.zone_id,
              output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
            },
          ],
        },
      },
      {
        event: "state",
        data: {
          state: RoonState.LOST,
          zones: [
            {
              display_name: ZONE.display_name,
              zone_id: ZONE.zone_id,
            },
            {
              display_name: OTHER_ZONE.display_name,
              zone_id: OTHER_ZONE.zone_id,
            },
            {
              display_name: YET_ANOTHER_ZONE.display_name,
              zone_id: YET_ANOTHER_ZONE.zone_id,
            },
          ],
          outputs: [
            {
              display_name: ZONE.outputs[0].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[0].output_id,
            },
            {
              display_name: ZONE.outputs[1].display_name,
              zone_id: ZONE.zone_id,
              output_id: ZONE.outputs[1].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[0].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[0].output_id,
            },
            {
              display_name: OTHER_ZONE.outputs[1].display_name,
              zone_id: OTHER_ZONE.zone_id,
              output_id: OTHER_ZONE.outputs[1].output_id,
            },
            {
              display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
              zone_id: YET_ANOTHER_ZONE.zone_id,
              output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
            },
          ],
        },
      },
    ]);
  });

  it(
    "zoneManager should rebuild it's state when a connection is reestablished with roon server. " +
      "It should be in 'SYNCING' state until the 'Subscribed' zone event is received. " +
      "When the 'Subscribed' zone event is received (roon send it with any empty Zone[] 🤷), the last known state," +
      "before connection lost, is the first published if any subscription happens." +
      "The upcoming events should be forwarded normally.",
    async () => {
      const messages: RoonSseMessage[] = [];
      zoneManager.events().subscribe((s) => {
        if (s.event === "state") {
          messages.push(s);
        }
      });
      await zoneManager.start();
      zoneListener(server, "Subscribed", {
        zones: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
      });
      yetAnotherQueueManagerIsStarted.mockImplementation(() => false);
      serverLostListener(server);
      serverPairedListener(server);
      expect(messages).toEqual([
        {
          event: "state",
          data: {
            state: RoonState.STARTING,
            zones: [],
            outputs: [],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNCING,
            zones: [],
            outputs: [],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNC,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.LOST,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNCING,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
      ]);
      zoneListener(server, "Subscribed", {});
      expect(messages).toEqual([
        {
          event: "state",
          data: {
            state: RoonState.STARTING,
            zones: [],
            outputs: [],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNCING,
            zones: [],
            outputs: [],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNC,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.LOST,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNCING,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
        {
          event: "state",
          data: {
            state: RoonState.SYNC,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
      ]);
      zoneListener(server, "Changed", {
        zones_changed: [ZONE, OTHER_ZONE, YET_ANOTHER_ZONE],
      });
      messages.splice(0, Infinity);
      zoneManager.events().subscribe((s) => {
        messages.push(s);
      });
      expect(messages).toEqual([
        {
          event: "state",
          data: {
            state: RoonState.SYNC,
            zones: [
              {
                display_name: ZONE.display_name,
                zone_id: ZONE.zone_id,
              },
              {
                display_name: OTHER_ZONE.display_name,
                zone_id: OTHER_ZONE.zone_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
              },
            ],
            outputs: [
              {
                display_name: ZONE.outputs[0].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[0].output_id,
              },
              {
                display_name: ZONE.outputs[1].display_name,
                zone_id: ZONE.zone_id,
                output_id: ZONE.outputs[1].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[0].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[0].output_id,
              },
              {
                display_name: OTHER_ZONE.outputs[1].display_name,
                zone_id: OTHER_ZONE.zone_id,
                output_id: OTHER_ZONE.outputs[1].output_id,
              },
              {
                display_name: YET_ANOTHER_ZONE.outputs[0].display_name,
                zone_id: YET_ANOTHER_ZONE.zone_id,
                output_id: YET_ANOTHER_ZONE.outputs[0].output_id,
              },
            ],
          },
        },
        ZONE_MESSAGE,
        QUEUE_MESSAGE,
        OTHER_ZONE_MESSAGE,
        OTHER_QUEUE_MESSAGE,
        YET_ANOTHER_ZONE_MESSAGE,
      ]);
    }
  );

  it("zoneManager#events should republish last known state even before reconnection", async () => {
    await zoneManager.start();
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    serverLostListener(server);
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((m) => messages.push(m));
    expect(messages.length).toEqual(5);
  });

  it("zoneManager#events should republish last known state event after reconnection", async () => {
    await zoneManager.start();
    const error = new Error("error");
    zoneListener(server, "Subscribed", {
      zones: [ZONE, OTHER_ZONE],
    });
    serverLostListener(server);
    const errorPromise = new Promise<void>((resolve) => {
      otherQueueManager = {
        queue: vi.fn().mockImplementation(() => {
          throw error;
        }),
        stop: vi.fn(),
        start: vi.fn().mockImplementation(() => {
          resolve();
          return Promise.reject(error);
        }),
        isStarted: vi.fn().mockImplementation(() => false),
      } as unknown as QueueManager;
    });
    serverPairedListener(server);
    zoneListener(server, "Subscribed", {});
    const messages: RoonSseMessage[] = [];
    zoneManager.events().subscribe((m) => messages.push(m));
    await errorPromise;
    expect(messages.length).toEqual(5);
  });

  it("zoneManager#isStarted should return 'true' unless zoneManager internal state is stopped", async () => {
    await zoneManager.start();
    expect(zoneManager.isStarted()).toBe(true);
    zoneListener(server, "Subscribed", {});
    expect(zoneManager.isStarted()).toBe(true);
    serverLostListener(server);
    expect(zoneManager.isStarted()).toBe(true);
    zoneManager.stop();
    expect(zoneManager.isStarted()).toBe(false);
  });
});

const OUTPUT: Output = {
  zone_id: "zone_id",
  display_name: "display_name_output",
  output_id: "output_id",
  state: "paused",
  can_group_with_output_ids: ["first_id", "second_id"],
  source_controls: [
    {
      control_key: "control_key",
      display_name: "display_name_source_control",
      status: "selected",
      supports_standby: true,
    },
  ],
  volume: {
    max: 4242,
    min: 42,
    step: 4,
    value: 420,
    type: "number",
    is_muted: false,
  },
};

const ZONE: Zone = {
  zone_id: "zone_id",
  display_name: "display_name",
  state: "paused",
  outputs: [
    OUTPUT,
    {
      ...OUTPUT,
      output_id: OUTPUT.output_id + "_other",
    },
  ],
  is_next_allowed: true,
  is_play_allowed: true,
  is_previous_allowed: true,
  is_seek_allowed: true,
  is_pause_allowed: true,
  seek_position: 42,
  queue_items_remaining: 420,
  queue_time_remaining: 4242,
  settings: {
    loop: "disabled",
    shuffle: false,
    auto_radio: true,
  },
  now_playing: {
    length: 42,
    image_key: "image_key",
    one_line: {
      line1: "line1",
    },
    two_line: {
      line1: "line1",
      line2: "line2",
    },
    three_line: {
      line1: "line1",
      line2: "line2",
      line3: "line3",
    },
    seek_position: 4,
  },
};

const OTHER_OUTPUT: Output = {
  ...OUTPUT,
  display_name: "other_display_name_output",
  zone_id: "other_zone_id",
  output_id: "other_output_id",
  state: "paused",
  can_group_with_output_ids: [],
};

const OTHER_ZONE: Zone = {
  ...ZONE,
  zone_id: "other_zone_id",
  display_name: "other_display_name",
  outputs: [
    OTHER_OUTPUT,
    {
      ...OTHER_OUTPUT,
      output_id: OTHER_OUTPUT.output_id + "_other",
    },
  ],
};

const YET_ANOTHER_OUTPUT: Output = {
  ...OUTPUT,
  display_name: "yet_another_display_name_output",
  zone_id: "yet_another_zone_id",
  output_id: "yet_another_output_id",
  state: "paused",
  can_group_with_output_ids: [],
};

const YET_ANOTHER_ZONE: Zone = {
  ...ZONE,
  zone_id: "yet_another_zone_id",
  display_name: "yet_another_display_name",
  outputs: [YET_ANOTHER_OUTPUT],
};

const ZONE_STATE: ZoneState = {
  ...ZONE,
  nice_playing: {
    state: ZONE.state,
    nb_items_in_queue: ZONE.queue_items_remaining,
    total_queue_remaining_time: "42",
    track: {
      title: ZONE.now_playing?.three_line.line1 ?? "",
      length: `${ZONE.now_playing?.length}`,
      image_key: ZONE.now_playing?.image_key ?? "",
      artist: ZONE.now_playing?.three_line.line2 ?? "",
      seek_position: `${ZONE.now_playing?.seek_position}`,
      seek_percentage: 42,
      disk: {
        title: ZONE.now_playing?.three_line.line3 ?? "",
        artist: ZONE.now_playing?.three_line.line2 ?? "",
        image_key: ZONE.now_playing?.image_key ?? "",
      },
    },
  },
};

const ZONE_MESSAGE: RoonSseMessage = {
  event: "zone",
  data: ZONE_STATE,
};

const QUEUE_MESSAGE: RoonSseMessage = {
  event: "queue",
  data: {
    zone_id: ZONE.zone_id,
  } as QueueState,
};

const OTHER_ZONE_STATE: ZoneState = {
  ...OTHER_ZONE,
  nice_playing: {
    state: OTHER_ZONE.state,
    nb_items_in_queue: OTHER_ZONE.queue_items_remaining,
    total_queue_remaining_time: "42",
    track: {
      title: OTHER_ZONE.now_playing?.three_line.line1 ?? "",
      length: `${OTHER_ZONE.now_playing?.length}`,
      image_key: OTHER_ZONE.now_playing?.image_key ?? "",
      artist: OTHER_ZONE.now_playing?.three_line.line2 ?? "",
      seek_position: `${OTHER_ZONE.now_playing?.seek_position}`,
      seek_percentage: 42,
      disk: {
        title: OTHER_ZONE.now_playing?.three_line.line3 ?? "",
        artist: OTHER_ZONE.now_playing?.three_line.line2 ?? "",
        image_key: OTHER_ZONE.now_playing?.image_key ?? "",
      },
    },
  },
};

const OTHER_ZONE_MESSAGE: RoonSseMessage = {
  event: "zone",
  data: OTHER_ZONE_STATE,
};

const OTHER_QUEUE_MESSAGE = {
  event: "queue",
  data: {
    zone_id: OTHER_ZONE.zone_id,
  },
};

const YET_ANOTHER_ZONE_STATE: ZoneState = {
  ...YET_ANOTHER_ZONE,
  nice_playing: {
    state: YET_ANOTHER_ZONE.state,
    nb_items_in_queue: YET_ANOTHER_ZONE.queue_items_remaining,
    total_queue_remaining_time: "42",
    track: {
      title: YET_ANOTHER_ZONE.now_playing?.three_line.line1 ?? "",
      length: `${YET_ANOTHER_ZONE.now_playing?.length}`,
      image_key: YET_ANOTHER_ZONE.now_playing?.image_key ?? "",
      artist: YET_ANOTHER_ZONE.now_playing?.three_line.line2 ?? "",
      seek_position: `${YET_ANOTHER_ZONE.now_playing?.seek_position}`,
      seek_percentage: 42,
      disk: {
        title: YET_ANOTHER_ZONE.now_playing?.three_line.line3 ?? "",
        artist: YET_ANOTHER_ZONE.now_playing?.three_line.line2 ?? "",
        image_key: YET_ANOTHER_ZONE.now_playing?.image_key ?? "",
      },
    },
  },
};

const YET_ANOTHER_ZONE_MESSAGE: RoonSseMessage = {
  event: "zone",
  data: YET_ANOTHER_ZONE_STATE,
};
