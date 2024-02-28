import { ApiState, Command, CommandState, QueueState, ZoneState } from "../api-model";
import {
  RoonApiBrowseLoadOptions,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseOptions,
  RoonApiBrowseResponse,
} from "../roon-kit";

export interface RoonWebClient {
  start: () => Promise<void>;
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
  command: (command: Command) => Promise<string>;
  browse: (options: ClientRoonApiBrowseOptions) => Promise<RoonApiBrowseResponse>;
  load: (options: ClientRoonApiBrowseLoadOptions) => Promise<RoonApiBrowseLoadResponse>;
  library: (zone_id: string) => Promise<RoonApiBrowseLoadResponse>;
  version: () => string;
}

export interface RoonWebClientFactory {
  build: (apiUrl: URL) => RoonWebClient;
}

export interface ClientRoonApiBrowseOptions extends Omit<RoonApiBrowseOptions, "multi_session_key"> {}

export interface ClientRoonApiBrowseLoadOptions extends Omit<RoonApiBrowseLoadOptions, "multi_session_key"> {}

export type RoonStateListener = (state: ApiState) => void;

export type CommandStateListener = (commandState: CommandState) => void;

export type ZoneStateListener = (zoneState: ZoneState) => void;

export type QueueStateListener = (queueState: QueueState) => void;
