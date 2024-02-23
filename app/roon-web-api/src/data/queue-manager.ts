import { Subject } from "rxjs";
import { retryDecorator } from "ts-retry-promise";
import { dataConverter } from "@data";
import { logger, roon } from "@infrastructure";
import {
  Queue,
  QueueChange,
  QueueItem,
  QueueListener,
  QueueManager,
  QueueManagerFactory,
  RoonApiTransportQueue,
  RoonSseMessage,
  RoonSubscriptionResponse,
  Zone,
} from "@model";

const queueListenerFactory = (
  queueManager: InternalQueueManager,
  resolve: () => void,
  reject: (err: Error) => void
): QueueListener => {
  return (response: RoonSubscriptionResponse, body: RoonApiTransportQueue) => {
    let queue: Queue;
    switch (response) {
      case "Subscribed":
        queue = {
          zone_id: queueManager.zone_id,
          items: body.items ?? [],
        };
        queueManager.init(queue);
        resolve();
        break;
      case "Changed":
        if (body.changes && queueManager.isStarted()) {
          const actualQueue = queueManager.currentQueue();
          const changedQueue = applyChanges(actualQueue, body.changes);
          queueManager.dispatchValue(changedQueue);
        }
        break;
      case "Unsubscribed":
        queueManager.stop();
        logger.warn("queue unsubscribed: %s for zone '%s'", JSON.stringify(body), queueManager.zone_id);
        break;
      default:
        logger.debug(
          "unknown queue event '%s' with body %s for zone '%s'",
          response,
          JSON.stringify(body),
          queueManager.zone_id
        );
        reject(new Error("core not ready yet..."));
        break;
    }
  };
};

const applyChanges = (q: Queue, changes: QueueChange[]): Queue => {
  let items: QueueItem[] = [...q.items];
  changes.forEach((change: QueueChange): void => {
    if (change.operation === "remove") {
      items.splice(change.index, change.count);
    } else {
      items = items.slice(0, change.index);
      items.push(...change.items);
    }
  });
  return {
    zone_id: q.zone_id,
    items,
  };
};

class InternalQueueManager implements QueueManager {
  private readonly _zone: Zone;
  private readonly _queueSize: number;
  private readonly _eventEmitter: Subject<RoonSseMessage>;
  private _queue?: Queue;

  constructor(zone: Zone, eventEmitter: Subject<RoonSseMessage>, queueSize: number) {
    this._eventEmitter = eventEmitter;
    this._zone = zone;
    this._queueSize = queueSize;
  }

  queue = (): RoonSseMessage => {
    return dataConverter.toRoonSseMessage(this.currentQueue());
  };

  stop = (): void => {
    delete this._queue;
  };

  dispatchValue = (queue: Queue): void => {
    const { publish } = this.ensureStarted();
    publish(queue);
  };

  currentQueue = (): Queue => {
    const { queue } = this.ensureStarted();
    return queue;
  };

  init = (queue: Queue): void => {
    this._queue = queue;
    const { publish } = this.ensureStarted();
    publish(queue);
  };

  isStarted = (): boolean => {
    return !!this._queue;
  };

  get zone_id(): string {
    return this._zone.zone_id;
  }

  private unsafeStart = async (): Promise<void> => {
    const server = await roon.server();
    return new Promise((resolve, reject) => {
      const queueListener = queueListenerFactory(this, resolve, reject);
      try {
        server.services.RoonApiTransport.subscribe_queue(this._zone, this._queueSize, queueListener);
      } catch (err) {
        reject(err as Error);
      }
    });
  };

  start = retryDecorator(this.unsafeStart, {
    delay: 3500,
    backoff: "FIXED",
    retries: 200,
  });

  private readonly internalPublish = (queue?: Queue): void => {
    if (queue) {
      this._queue = queue;
    }
    if (this._queue) {
      this._eventEmitter.next(dataConverter.toRoonSseMessage(this._queue));
    }
  };

  private ensureStarted = (): {
    publish: (queue: Queue) => void;
    queue: Queue;
  } => {
    if (this._queue) {
      return {
        publish: this.internalPublish,
        queue: this._queue,
      };
    } else {
      throw new Error("QueueManager has not been started");
    }
  };
}

const build = (zone: Zone, eventEmitter: Subject<RoonSseMessage>, queueSize: number): QueueManager => {
  return new InternalQueueManager(zone, eventEmitter, queueSize);
};

export const queueManagerFactory: QueueManagerFactory = {
  build,
};
