import {
  EmptyObject,
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
  OutputListener,
  Queue,
  QueueSseMessage,
  QueueState,
  RoonState,
  ZoneDescription,
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
  buildApiState: (state: RoonState, zones: ZoneDescription[]) => ApiState;
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
}

export interface SseMessage<T extends SseMessageData> {
  event: string;
  data: T;
}

export interface SseMessageData {}

export interface ApiState extends SseMessageData {
  state: RoonState;
  zones: ZoneDescription[];
}

export interface SseStateMessage extends SseMessage<ApiState> {
  event: "state";
}

export type RoonSseMessage = QueueSseMessage | ZoneSseMessage | SseStateMessage | CommandSseMessage;
