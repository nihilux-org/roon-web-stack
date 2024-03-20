import {
  ApiState,
  ClientRoonApiBrowseLoadOptions,
  ClientRoonApiBrowseOptions,
  ClientState,
  Command,
  CommandState,
  Output,
  OutputDescription,
  QueueState,
  RoonApiBrowseLoadResponse,
  RoonApiBrowseResponse,
  Track,
  ZoneState,
} from "@model";

export interface ZoneProgression {
  length: string;
  position: string;
  percentage: number;
}

export const DEFAULT_ZONE_PROGRESSION: ZoneProgression = {
  length: "-",
  position: "-",
  percentage: 0,
};

export interface ZoneCommands {
  zoneId: string;
  previousTrack: ZoneCommandState;
  loading: ZoneCommandState;
  play: ZoneCommandState;
  pause: ZoneCommandState;
  nextTrack: ZoneCommandState;
  outputs: Output[];
}

export enum ZoneCommandState {
  ABSENT = "ABSENT",
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

export interface TrackDisplay extends Omit<Track, "length" | "seek_percentage" | "seek_position"> {}

export const EMPTY_TRACK: Track = {
  title: "No current track",
};

export interface TrackImage {
  src: string;
  imageSize: number;
  isReady: boolean;
}

export interface NavigationEvent {
  item_key?: string;
  input?: string;
}

export enum ChosenTheme {
  BROWSER = "BROWSER",
  DARK = "DARK",
  LIGHT = "LIGHT",
}

export type ClientBreakpoints = {
  [key: string]: boolean;
};

export enum DisplayMode {
  COMPACT = "COMPACT",
  WIDE = "WIDE",
}

export enum VisibilityState {
  VISIBLE = "VISIBLE",
  HIDDEN = "HIDDEN",
}

export type CommandCallback = (commandState: CommandState) => void;

export type OutputCallback = (outputs: OutputDescription[]) => void;

export interface WorkerMessageData {}

export interface WorkerMessage<T extends WorkerMessageData> {
  data: T;
}

export interface WorkerClientStartAction extends WorkerMessageData {
  action: "start-client";
  url: string;
  isDesktop: boolean;
}

export interface WorkerClientRefreshAction extends WorkerMessageData {
  action: "refresh-client";
}

export interface WorkerClientStopAction extends WorkerMessageData {
  action: "stop-client";
}

export interface WorkerClientRestartAction extends WorkerMessageData {
  action: "restart-client";
}

export type WorkerClientAction =
  | WorkerClientStartAction
  | WorkerClientRefreshAction
  | WorkerClientStopAction
  | WorkerClientRestartAction;

export interface WorkerClientActionMessage extends WorkerMessage<WorkerClientAction> {
  event: "worker-client";
}

export interface WorkerApiRequest<T> extends WorkerMessageData {
  data: T;
  id: number;
}

export interface BrowseWorkerApiRequest extends WorkerApiRequest<ClientRoonApiBrowseOptions> {
  type: "browse";
}

export interface LoadWorkerApiRequest extends WorkerApiRequest<ClientRoonApiBrowseLoadOptions> {
  type: "load";
}

export interface VersionWorkerApiRequest extends WorkerApiRequest<void> {
  type: "version";
}

export interface CommandWorkerApiRequest extends WorkerApiRequest<Command> {
  type: "command";
}

export interface LibraryWorkerApiRequest extends WorkerApiRequest<string> {
  type: "library";
}

export interface ExploreWorkerApiRequest extends WorkerApiRequest<string> {
  type: "explore";
}

export interface PreviousWorkerApiRequest extends WorkerApiRequest<{ zone_id: string; levels?: number }> {
  type: "previous";
}

export interface NavigateWorkerApiRequest
  extends WorkerApiRequest<{ zone_id: string; item_key?: string; input?: string }> {
  type: "navigate";
}

export type RawWorkerApiRequest =
  | BrowseWorkerApiRequest
  | LoadWorkerApiRequest
  | VersionWorkerApiRequest
  | CommandWorkerApiRequest
  | LibraryWorkerApiRequest
  | ExploreWorkerApiRequest
  | PreviousWorkerApiRequest
  | NavigateWorkerApiRequest;

export interface WorkerApiRequestMessage extends WorkerMessage<RawWorkerApiRequest> {
  event: "worker-api";
}

export type WorkerActionMessage = WorkerClientActionMessage | WorkerApiRequestMessage;

export interface WorkerEvent<T> {
  data: T;
}

export interface ApiStateWorkerEvent extends WorkerEvent<ApiState> {
  event: "state";
}

export interface ZoneStateWorkerEvent extends WorkerEvent<ZoneState> {
  event: "zone";
}

export interface QueueStateWorkerEvent extends WorkerEvent<QueueState> {
  event: "queue";
}

export interface CommandStateWorkerEvent extends WorkerEvent<CommandState> {
  event: "command";
}

export interface ClientStateWorkerEvent extends WorkerEvent<ClientState> {
  event: "clientState";
}

export type RawWorkerEvent =
  | ApiStateWorkerEvent
  | ZoneStateWorkerEvent
  | QueueStateWorkerEvent
  | CommandStateWorkerEvent
  | ClientStateWorkerEvent
  | ApiResultWorkerEvent;

export interface ApiResult<T> {
  data?: T;
  error?: unknown;
  id: number;
}

export interface BrowseApiResult extends ApiResult<RoonApiBrowseResponse> {
  type: "browse";
}

export interface LoadApiResult extends ApiResult<RoonApiBrowseLoadResponse> {
  type: "load";
}

export interface CommandApiResult extends ApiResult<string> {
  type: "command";
}

export interface VersionApiResult extends ApiResult<string> {
  type: "version";
}

export type RawApiResult = BrowseApiResult | LoadApiResult | CommandApiResult | VersionApiResult;

export interface ApiResultWorkerEvent extends WorkerEvent<RawApiResult> {
  event: "apiResult";
}

export interface ApiResultCallback<U extends RoonApiBrowseResponse | RoonApiBrowseLoadResponse | string> {
  next: (u: U) => void;
  error?: (error: unknown) => void;
}
