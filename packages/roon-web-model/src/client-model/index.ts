import { ApiState, Command, CommandState, QueueState, RoonPath, SharedConfig, ZoneState } from "../api-model";
import {
  Item,
  List,
  RoonApiBrowseHierarchy,
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
} from "../roon-kit";

export interface RoonWebClient {
  start: (roonClientId?: string) => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  refresh: () => Promise<void>;
  onRoonState: (listener: RoonStateListener) => void;
  offRoonState: (listener: RoonStateListener) => void;
  onCommandState: (listener: CommandStateListener) => void;
  offCommandState: (listener: CommandStateListener) => void;
  onZoneState: (listener: ZoneStateListener) => void;
  offZoneState: (listener: ZoneStateListener) => void;
  onQueueState: (listener: QueueStateListener) => void;
  offQueueState: (listener: QueueStateListener) => void;
  onClientState: (listener: ClientStateListener) => void;
  offClientState: (listener: ClientStateListener) => void;
  onSharedConfig: (listener: SharedConfigListener) => void;
  offSharedConfig: (listener: SharedConfigListener) => void;
  command: (command: Command) => Promise<string>;
  browse: (options: ClientRoonApiBrowseOptions) => Promise<RoonApiBrowseResponse>;
  load: (options: ClientRoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse>;
  loadPath: (zone_id: string, path: RoonPath) => Promise<RoonApiBrowseLoadResponse>;
  findItemIndex: (itemIndexSearch: ItemIndexSearch) => Promise<FoundItemIndexResponse>;
  getGenreCounts: () => Promise<GenreAlbumCount[]>;
  version: () => string;
}

export interface RoonWebClientFactory {
  build: (apiUrl: URL) => RoonWebClient;
}

export type ClientStatus = "started" | "outdated" | "not-started" | "to-refresh";

export interface ClientState {
  status: ClientStatus;
  roonClientId?: string;
}

export type ClientRoonApiBrowseOptions = Omit<RoonApiBrowseOptions, "multi_session_key">;

export type ClientRoonApiBrowseLoadOptions = Omit<RoonApiBrowseLoadOptions, "multi_session_key">;

export type RoonStateListener = (state: ApiState) => void;

export type CommandStateListener = (commandState: CommandState) => void;

export type ZoneStateListener = (zoneState: ZoneState) => void;

export type QueueStateListener = (queueState: QueueState) => void;

export type ClientStateListener = (clientState: ClientState) => void;

export type SharedConfigListener = (sharedConfig: SharedConfig) => void;

export interface ItemIndexSearch {
  hierarchy: RoonApiBrowseHierarchy;
  list: List;
  letter: string;
  items?: Item[];
}

export interface FoundItemIndexResponse extends RoonApiBrowseLoadResponse {
  itemIndex: number;
}

export interface GenreAlbumCount {
  title: string;
  count: number;
}
