import { nanoid } from "nanoid";
import { Subject } from "rxjs";
import { retryDecorator } from "ts-retry-promise";
import { dataConverter, queueBot } from "@data";
import { logger, roon } from "@infrastructure";
import {
  Queue,
  QueueChange,
  QueueItem,
  QueueListener,
  QueueListenerCallback,
  QueueManager,
  QueueManagerFactory,
  RoonApiTransportQueue,
  RoonSseMessage,
  RoonSubscriptionResponse,
  Zone,
} from "@nihilux/roon-web-model";

const queueListenerFactory = (
  queueManager: InternalQueueManager,
  resolve: () => void,
  reject: (err: Error) => void
): QueueListener => {
  const listener_id = nanoid();
  const listener: QueueListenerCallback = (response: RoonSubscriptionResponse, body: RoonApiTransportQueue) => {
    if (queueManager.isCurrentQueueListener(listener_id)) {
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
        case "NetworkError":
        case "ZoneNotFound":
          void queueManager.restart(response, 0);
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
    } else {
      logger.warn(`ghost queue subscription still active for zone ${queueManager.zone_id}`);
    }
  };
  return {
    listener,
    listener_id,
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
  private static readonly MAX_RESTART_ATTEMPTS = 5;
  private readonly _zone: Zone;
  private readonly _queueSize: number;
  private readonly _eventEmitter: Subject<RoonSseMessage>;
  private _queue?: Queue;
  private _queueListener?: QueueListener;

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

  private readonly unsafeStart = async (): Promise<void> => {
    const server = await roon.server();
    return new Promise((resolve, reject) => {
      this._queueListener = queueListenerFactory(this, resolve, reject);
      try {
        server.services.RoonApiTransport.subscribe_queue(this._zone, this._queueSize, this._queueListener.listener);
      } catch (err: unknown) {
        const rejection =
          err instanceof Error ? err : new Error(`unknown error during subscription for zone ${this.zone_id}`);
        reject(rejection);
      }
    });
  };

  start = retryDecorator(this.unsafeStart, {
    delay: 3500,
    backoff: "FIXED",
    retries: 200,
  });

  isCurrentQueueListener = (listener_id: string): boolean => {
    return this._queueListener?.listener_id === listener_id;
  };

  restart = async (cause: RoonSubscriptionResponse, attempts: number): Promise<void> => {
    delete this._queueListener;
    if (attempts < InternalQueueManager.MAX_RESTART_ATTEMPTS) {
      logger.warn(`restarting queue subscription for zone ${this.zone_id} due to ${cause} (attempt ${attempts + 1})`);
      try {
        const server = await roon.server();
        const zones = (await server.services.RoonApiTransport.get_zones()).zones ?? [];
        let delay = 1000 * (attempts + 1);
        if (cause === "NetworkError") {
          delay = delay * 5;
        }
        if (zones.findIndex((z: Zone) => z.zone_id === this.zone_id) !== -1) {
          await this.wait(delay);
          await this.start();
        } else {
          await this.wait(delay);
          await this.restart(cause, attempts + 1);
        }
      } catch (err: unknown) {
        /* istanbul ignore next --@preserve */
        const error =
          err instanceof Error ? err : new Error(`unknown error during QueueManager restart for zone ${this.zone_id}`);
        logger.error(error);
        await this.wait(1000 * (attempts + 1));
        await this.restart(cause, attempts + 1);
      }
    } else {
      logger.warn(`max restart reached for QueueManager of zone ${this.zone_id}`);
    }
  };

  private readonly internalPublish = (queue: Queue): void => {
    this._queue = queue;
    queueBot.watchQueue(this._queue);
    this._eventEmitter.next(dataConverter.toRoonSseMessage(this._queue));
  };

  private readonly ensureStarted = (): {
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

  private readonly wait = (delay: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  };
}

const build = (zone: Zone, eventEmitter: Subject<RoonSseMessage>, queueSize: number): QueueManager => {
  return new InternalQueueManager(zone, eventEmitter, queueSize);
};

export const queueManagerFactory: QueueManagerFactory = {
  build,
};
