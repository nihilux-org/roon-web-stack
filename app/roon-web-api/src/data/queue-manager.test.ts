import { loggerMock, retryMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";
import { dataConverterMock } from "./data-converter.mock";
import { queueBotMock } from "./queue-bot-manager.mock";

import { Subject } from "rxjs";
import { Mock } from "vitest";
import {
  Queue,
  QueueChange,
  QueueItem,
  QueueListener,
  QueueState,
  QueueTrack,
  RoonApiBrowse,
  RoonApiImage,
  RoonApiTransport,
  RoonApiTransportQueue,
  RoonServer,
  RoonSseMessage,
  RoonSubscriptionResponse,
  Zone,
} from "@nihilux/roon-web-model";
import { queueManagerFactory } from "./queue-manager";

describe("queue-manager.ts test suite", () => {
  let roonSubject: Subject<RoonSseMessage>;
  let RoonApiBrowse: RoonApiBrowse;
  let RoonApiImage: RoonApiImage;
  let queueListener: QueueListener;
  let subscribe_queue: Mock;
  let RoonApiTransport: RoonApiTransport;
  let server: RoonServer;

  beforeEach(() => {
    roonSubject = new Subject<RoonSseMessage>();
    RoonApiBrowse = vi.mocked({}) as unknown as RoonApiBrowse;
    RoonApiImage = vi.mocked({}) as unknown as RoonApiImage;
    subscribe_queue = vi.fn();
    RoonApiTransport = vi.mocked({
      subscribe_queue,
    }) as unknown as RoonApiTransport;
    server = {
      services: {
        RoonApiTransport,
        RoonApiBrowse,
        RoonApiImage,
      },
    } as unknown as RoonServer;
    roonMock.server.mockImplementation(() => Promise.resolve(server));
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListener) => {
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

  it("QueueManager#start should return a rejected Promise if the underlying roon API return an unknown event before 'Subscribed'", async () => {
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListener) => {
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
    } as unknown as RoonApiTransportQueue);
    queueListener("Changed", {
      changes: [secondChange],
    } as unknown as RoonApiTransportQueue);
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
    subscribe_queue.mockImplementation((z: Zone, queueSize: number, listener: QueueListener) => {
      queueListener = listener;
      queueListener("Subscribed", {} as unknown as RoonApiTransportQueue);
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
    queueListener("Unsubscribed", {} as RoonApiTransportQueue);
    queueListener("Changed", roonEvent);
    queueListener("Changed", roonEvent);
    queueListener("Changed", roonEvent);
    queueListener("Unsubscribed", {} as RoonApiTransportQueue);

    expect(messages).toHaveLength(1);
    expect(loggerMock.warn).toHaveBeenCalledTimes(2);
  });

  it("QueueManager should log unknown events coming from roon API", async () => {
    const queueManager = queueManagerFactory.build(ZONE, roonSubject, QUEUE_SIZE);
    await queueManager.start();
    queueListener("Unknown" as RoonSubscriptionResponse, {} as RoonApiTransportQueue);
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
