import { Subject } from "rxjs";
import { QueueItem, RoonApiTransportQueue, RoonSubscriptionResponse, SettingsManager, Zone } from "../roon-kit";
import { Roon, RoonSseMessage, SseMessage, Track } from "./index";

export interface Queue {
  zone_id: string;
  items: QueueItem[];
}

export interface QueueManager {
  stop: () => void;
  start: () => Promise<void>;
  queue: () => RoonSseMessage;
  isStarted: () => boolean;
}

export interface QueueManagerFactory {
  build: (zone: Zone, eventPublisher: Subject<RoonSseMessage>, queueSize: number) => QueueManager;
}

export interface QueueListener {
  (response: RoonSubscriptionResponse, body: RoonApiTransportQueue): void;
}

export interface QueueTrack extends Omit<Track, "seek_position" | "seek_percentage"> {
  queue_item_id: number;
}

export interface QueueState {
  zone_id: string;
  tracks: QueueTrack[];
}

export interface QueueSseMessage extends SseMessage<QueueState> {
  event: "queue";
}

export interface QueueBot {
  start: (roon: Roon) => void;
  watchQueue: (queue: Queue) => void;
}
