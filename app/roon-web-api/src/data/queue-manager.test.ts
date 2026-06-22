import { loggerMock, nanoidMock, retryMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";
import { dataConverterMock } from "./data-converter.mock";
import { queueBotMock } from "./queue-bot-manager.mock";

import { Subject } from "rxjs";
import { expect, Mock } from "vitest";
import {
  Queue,
  QueueChange,
  QueueItem,
  QueueListenerCallback,
  QueueState,
  QueueTrack,
  RoonApiBrowse,
  RoonApiImage,
  RoonApiTransport,
  RoonApiTransportQueue,
  RoonApiTransportZones,
  RoonServer,
  RoonSseMessage,
  RoonSubscriptionResponse,
  Zone,
} from "@nihilux/roon-web-model";
import { queueManagerFactory } from "./queue-manager";

describe("queue-manager.ts test suite", () => {
  let roonSubject: Subject<RoonSseMessage>;
  let queueListener: QueueListenerCallback;
  let RoonApiBrowse: RoonApiBrowse;
  let RoonApiImage: RoonApiImage;
  let get_zones: Mock;
  let subscribe_queue: Mock;
  let RoonApiTransport: RoonApiTransport;
  let server: RoonServer;
  let nanoidCounter: number;

  beforeEach(() => {
    roonSubject = new Subject<RoonSseMessage>();
    RoonApiBrowse = vi.mocked({}) as unknown as RoonApiBrowse;
    RoonApiImage = vi.mocked({}) as unknown as RoonApiImage;
    get_zones = vi.fn();
    subscribe_queue = vi.fn();
    RoonApiTransport = vi.mocked({
      subscribe_queue,
      get_zones,
    }) as unknown as RoonApiTransport;
    server = {
      services: {
        RoonApiTransport,
        RoonApiBrowse,
        RoonApiImage,
      },
    } as unknown as RoonServer;
    roonMock.server.mockImplementation(() => Promise.resolve(server));
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListenerCallback) => {
      queueListener = listener;
      queueListener("Subscribed", {
        items: [queueItem],
      });
    });
    dataConverterMock.convertQueue.mockImplementation((q: Queue): QueueState => {
      return {
        zone_id: q.zone_id,
        tracks: q.items.map((item) => {
          if (item === queueItem) {
            return queueTrack;
          } else {
            return otherQueueTrack;
          }
        }),
      };
    });
    dataConverterMock.toRoonSseMessage.mockImplementation((q: Queue) => {
      return {
        event: "queue",
        data: dataConverterMock.convertQueue(q) as unknown as QueueState,
      };
    });
    retryMock.retryDecorator.mockImplementation((a) => a as unknown);
    nanoidCounter = 0;
    nanoidMock.mockImplementation(() => {
      const id = `${nanoidCounter}`;
      nanoidCounter++;
      return id;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it("queueManagerFactory#build should return a new instance at each call", () => {
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const otherQueueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    expect(queueManager).not.toBe(otherQueueManager);
  });

  it("QueueManager#start should return a rejected Promise if the underlying roon API is in error", async () => {
    const error = new Error("error");
    subscribe_queue.mockImplementation(() => {
      throw error;
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const queueManagerPromise = queueManager.start();
    await expect(queueManagerPromise).rejects.toEqual(error);
    expect(retryMock.retryDecorator).toHaveBeenCalledTimes(1);
    expect(retryMock.retryDecorator).toHaveBeenCalledWith(expect.anything(), {
      delay: 3500,
      backoff: "FIXED",
      retries: 200,
    });
  });

  it("QueueManager#start should return a rejected Promise wrapping a non-Error throwable from the underlying roon API", async () => {
    subscribe_queue.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- testing non-Error catch branch
      throw "string error";
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const queueManagerPromise = queueManager.start();
    await expect(queueManagerPromise).rejects.toEqual(
      new Error(`unknown error during subscription for zone ${ZONE.zone_id}`)
    );
    expect(retryMock.retryDecorator).toHaveBeenCalledTimes(1);
    expect(retryMock.retryDecorator).toHaveBeenCalledWith(expect.anything(), {
      delay: 3500,
      backoff: "FIXED",
      retries: 200,
    });
  });

  it("QueueManager#start should return a rejected Promise if the underlying roon API return an unknown event before 'Subscribed'", async () => {
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListenerCallback) => {
      queueListener = listener;
      queueListener("Unknown" as RoonSubscriptionResponse, {
        items: [queueItem],
      });
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const queueManagerPromise = queueManager.start();
    await expect(queueManagerPromise).rejects.toEqual(new Error("core not ready yet..."));
    expect(retryMock.retryDecorator).toHaveBeenCalledTimes(1);
    expect(retryMock.retryDecorator).toHaveBeenCalledWith(expect.anything(), {
      delay: 3500,
      backoff: "FIXED",
      retries: 200,
    });
  });

  it("QueueManager#stop should not close the internal Observable", async () => {
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    let complete = false;
    roonSubject.subscribe({
      complete: () => {
        complete = true;
      },
    });
    queueManager.stop();
    expect(complete).toBe(false);
    expect(retryMock.retryDecorator).toHaveBeenCalledTimes(1);
  });

  it("QueueManager#queue should throw an error if QueueManager#start has not been called before", () => {
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    expect(queueManager.queue).toThrow("QueueManager has not been started");
  });

  it("QueueManager should apply changes in the queue dispatched by the roon API and publish them as new QueueState while calling queueBot", async () => {
    const states: RoonSseMessage[] = [];
    roonSubject.subscribe((qs: RoonSseMessage) => {
      states.push(qs);
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    const firstChange: QueueChange = {
      operation: "insert",
      items: [otherQueueItem],
      index: 1,
    };
    const secondChange: QueueChange = {
      operation: "remove",
      index: 0,
      count: 1,
    };
    queueListener("Changed", {
      changes: [firstChange],
    });
    queueListener("Changed", {
      changes: [secondChange],
    });
    queueManager.stop();
    expect(states).toHaveLength(3);
    expect(states[0]).toEqual({
      event: "queue",
      data: {
        zone_id: "zone_id",
        tracks: [queueTrack],
      },
    });
    expect(states[1]).toEqual({
      event: "queue",
      data: {
        zone_id: "zone_id",
        tracks: [queueTrack, otherQueueTrack],
      },
    });
    expect(states[2]).toEqual({
      event: "queue",
      data: {
        zone_id: "zone_id",
        tracks: [otherQueueTrack],
      },
    });
    expect(queueBotMock.watchQueue).toHaveBeenCalledTimes(3);
  });

  it("QueueManager should safely handle a missing initial state in the events coming from roon API", async () => {
    const messages: RoonSseMessage[] = [];
    roonSubject.subscribe((qm) => {
      messages.push(qm);
    });
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListenerCallback) => {
      queueListener = listener;
      queueListener("Subscribed", {});
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    queueManager.stop();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      event: "queue",
      data: {
        tracks: [],
        zone_id: "zone_id",
      },
    });
  });

  it("QueueManager should safely ignore events coming from roon API after #close has been called", async () => {
    const messages: RoonSseMessage[] = [];
    roonSubject.subscribe((qs: RoonSseMessage) => {
      messages.push(qs);
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    const change: QueueChange = {
      operation: "insert",
      items: [otherQueueItem],
      index: 1,
    };
    const roonEvent = {
      changes: [change],
    } as unknown as RoonApiTransportQueue;
    queueListener("Unsubscribed", {});
    queueListener("Changed", roonEvent);
    queueListener("Changed", roonEvent);
    queueListener("Changed", roonEvent);
    queueListener("Unsubscribed", {});

    expect(messages).toHaveLength(1);
    expect(loggerMock.warn).toHaveBeenCalledTimes(2);
  });

  it("QueueManager should log unknown events coming from roon API", async () => {
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    queueListener("Unknown" as RoonSubscriptionResponse, {});
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      "unknown queue event '%s' with body %s for zone '%s'",
      "Unknown",
      JSON.stringify({}),
      ZONE.zone_id
    );
  });

  it("QueueManager#isStarted should return true only if #start has been called and #stop has not been called", async () => {
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    expect(queueManager.isStarted()).toEqual(false);
    await queueManager.start();
    expect(queueManager.isStarted()).toEqual(true);
    queueManager.stop();
    expect(queueManager.isStarted()).toEqual(false);
  });

  it.each`
    cause
    ${"NetworkError"}
    ${"ZoneNotFound"}
  `("QueueManager should restart its subscription on $cause events", async ({ cause }) => {
    get_zones.mockImplementation(() => {
      return new Promise<RoonApiTransportZones>((resolve) => {
        resolve({
          zones: [ZONE],
        });
      });
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    const restartSpy = vi.spyOn(queueManager, "restart");
    restartSpy.mockImplementation(async () => {
      // do nothing
    });
    queueListener(cause as RoonSubscriptionResponse, {});
    expect(restartSpy).toHaveBeenCalledTimes(1);
  });

  it.each`
    cause
    ${"NetworkError"}
    ${"ZoneNotFound"}
  `(
    `QueueManager should not restart its subscription on $cause event if errors occurred during startup`,
    async ({ cause }) => {
      subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListenerCallback) => {
        queueListener = listener;
        queueListener(cause as RoonSubscriptionResponse, {});
      });
      const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
      const restartSpy = vi.spyOn(queueManager, "restart");
      const startPromise = queueManager.start();
      await expect(startPromise).rejects.toThrow();
      expect(restartSpy).not.toHaveBeenCalled();
    }
  );

  it("QueueManager should discard past ghost subscription ", async () => {
    const messages: RoonSseMessage[] = [];
    roonSubject.subscribe((qm) => {
      messages.push(qm);
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    let newQueueListener: QueueListenerCallback;
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListenerCallback) => {
      newQueueListener = listener;
      newQueueListener("Subscribed", {
        items: [queueItem],
      });
    });
    await queueManager.start();
    expect(messages).toHaveLength(2);
    queueListener("Changed", {
      items: [queueItem],
    });
    expect(messages).toHaveLength(2);
  });

  it("QueueManager#restart should register call QueueManager#start and register a new QueueListenerCallback if current zone is still available", async () => {
    get_zones.mockImplementation(async () => {
      return Promise.resolve({
        zones: [ZONE],
      });
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const startSpy = vi.spyOn(queueManager, "start");
    await queueManager.start();
    let newQueueListener: QueueListenerCallback | undefined = undefined;
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListenerCallback) => {
      newQueueListener = listener;
      newQueueListener("Subscribed", {
        items: [queueItem],
      });
    });
    await queueManager.restart("ZoneNotFound", 0);
    expect(startSpy).toHaveBeenCalledTimes(2);
    expect(queueListener).not.toBeUndefined();
    expect(newQueueListener).not.toBeUndefined();
    expect(queueListener).not.toBe(newQueueListener);
  });

  it("QueueManager#restart should retry on error", async () => {
    get_zones.mockImplementation(async () => {
      return Promise.resolve({
        zones: [ZONE],
      });
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const startSpy = vi.spyOn(queueManager, "start");
    const restartSpy = vi.spyOn(queueManager, "restart");
    await queueManager.start();
    startSpy
      .mockImplementationOnce(async () => Promise.reject(new Error("error")))
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      .mockImplementationOnce(async () => Promise.reject("error"));
    const attempt = 0;
    const cause = "NetworkError";
    try {
      vi.useFakeTimers();
      void queueManager.restart(cause, attempt);
      await vi.advanceTimersByTimeAsync(50001);
      expect(restartSpy).toHaveBeenCalledTimes(3);
      expect(restartSpy).toHaveBeenNthCalledWith(1, cause, attempt);
      expect(restartSpy).toHaveBeenNthCalledWith(2, cause, attempt + 1);
      expect(restartSpy).toHaveBeenNthCalledWith(3, cause, attempt + 2);
      expect(subscribe_queue).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("QueueManager#restart should recall itself recursively (with backoff) if the current zone is not available", async () => {
    get_zones
      .mockImplementationOnce(async () => Promise.resolve({}))
      .mockImplementationOnce(async () =>
        Promise.resolve({
          zones: [ZONE],
        })
      );
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    const restartSpy = vi.spyOn(queueManager, "restart");
    const attempt = 0;
    const cause = "ZoneNotFound";
    try {
      vi.useFakeTimers();
      void queueManager.restart(cause, attempt);
      await vi.advanceTimersByTimeAsync(2001);
      expect(restartSpy).toHaveBeenCalledTimes(2);
      expect(restartSpy).toHaveBeenLastCalledWith(cause, attempt + 1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("QueueManager#restart should do nothing at the 5th attempt", async () => {
    get_zones.mockImplementation(async () => {
      return Promise.resolve({
        zones: [ZONE],
      });
    });
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    const startSpy = vi.spyOn(queueManager, "start");
    await queueManager.start();
    await queueManager.restart("ZoneNotFound", 5);
    expect(startSpy).toHaveBeenCalledTimes(1);
  });
});

const queueItem: QueueItem = {
  queue_item_id: 42,
  length: 42,
  image_key: "image_key",
  one_line: {
    line1: "line1",
  },
  two_line: {
    line1: "line1",
  },
  three_line: {
    line1: "line1",
  },
};

const queueTrack: QueueTrack = {
  queue_item_id: 42,
  length: "length",
  image_key: "image_key",
  title: "title",
};

const otherQueueItem: QueueItem = {
  queue_item_id: 4242,
  length: 4242,
  image_key: "other_image_key",
  one_line: {
    line1: "other_line1",
  },
  two_line: {
    line1: "other_line1",
  },
  three_line: {
    line1: "other_line1",
  },
};

const otherQueueTrack: QueueTrack = {
  queue_item_id: 4242,
  length: "other_length",
  image_key: "other_image_key",
  title: "other_title",
};

const ZONE: Zone = {
  zone_id: "zone_id",
} as unknown as Zone;
const QUEUE_SIZE = 42;
