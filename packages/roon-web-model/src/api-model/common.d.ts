import { Observable } from "rxjs";
import {
  EmptyObject,
  RoonApiBrowseHierarchy,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
  RoonApiImageResultOptions,
  RoonServer,
  Zone,
} from "../roon-kit";
import {
  CommandSseMessage,
  CommandState,
  OutputDescription,
  OutputListener,
  Queue,
  QueueSseMessage,
  QueueState,
  RoonState,
  SharedConfig,
  ZoneDescription,
  ZoneListener,
  ZoneSseMessage,
  ZoneState,
} from "./index";

export interface Playable {
  length?: string;
  image_key?: string;
  seek_position?: string;
  seek_percentage?: number;
  title: string;
  artist?: string;
}

export interface Disk extends Omit<Playable, "seek_position" | "seek_percentage"> {
  total_tracks?: number;
  current_track?: number;
}

export interface Track extends Playable {
  disk?: Disk;
}

export interface DataConverter {
  convertZone: (zone: Zone) => ZoneState;
  convertQueue: (queue: Queue) => QueueState;
  toRoonSseMessage: (data: Zone | Queue | ApiState | CommandState) => RoonSseMessage;
  secondsToTimeString: (seconds: number | undefined) => string | undefined;
}

export interface ServerListener {
  (server: RoonServer): void;
}

export interface Roon {
  onServerPaired: (listener: ServerListener) => void;
  onServerLost: (listener: ServerListener) => void;
  server: () => Promise<RoonServer>;
  onZones: (listener: ZoneListener) => void;
  offZones: (listener: ZoneListener) => void;
  onOutputs: (listener: OutputListener) => void;
  offOutputs: (listener: OutputListener) => void;
  startExtension: () => void;
  getImage: (image_key: string, options: RoonApiImageResultOptions) => Promise<{ content_type: string; image: Buffer }>;
  browse: (options: RoonApiBrowseOptions | EmptyObject) => Promise<RoonApiBrowseResponse>;
  load: (options: RoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse>;
  updateSharedConfig: (shardConfigUpdate: SharedConfigUpdate) => void;
  sharedConfigEvents: () => Observable<SharedConfigMessage>;
}

export interface RoonPath {
  hierarchy: RoonApiBrowseHierarchy;
  path: string[];
}

export interface SharedConfig {
  customActions: CustomAction[];
}

export interface SharedConfigUpdate {
  sharedConfig?: SharedConfig;
  sharedConfigKey?: {
    key: keyof SharedConfig;
    value: SharedConfig[keyof SharedConfig];
  };
}

export interface CustomAction {
  id: string;
  label: string;
  icon: string;
  roonPath: RoonPath;
  actionIndex?: number;
}

export type SseMessageData = Ping | ApiState | SharedConfig | CommandState | QueueState | ZoneState;

export interface SseMessage<T extends SseMessageData> {
  event: string;
  data: T;
}

export interface Ping {
  next: number;
}

export interface ApiState {
  state: RoonState;
  zones: ZoneDescription[];
  outputs: OutputDescription[];
}

export interface SseStateMessage extends SseMessage<ApiState> {
  event: "state";
}

export interface PingSseMessage extends SseMessage<Ping> {
  event: "ping";
}

export interface SharedConfigMessage extends SseMessage<SharedConfig> {
  event: "config";
}

export type RoonSseMessage =
  | QueueSseMessage
  | ZoneSseMessage
  | SseStateMessage
  | CommandSseMessage
  | PingSseMessage
  | SharedConfigMessage;
