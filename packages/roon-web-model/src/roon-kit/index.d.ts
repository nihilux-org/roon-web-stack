/*
 the typings in this file are a combinaison of the typings coming from
 Stevenic/roon-kit (https://github.com/Stevenic/roon-kit) and some corrections
 done to fix issues in these typings.
 New typings might be added to integrate missing part of the roon API in the future
 */
import { OutputDescription } from "../api-model";

export type EmptyObject = {
  [K in unknown]: never;
};

export interface RoonExtensionDescription {
  extension_id: string;
  display_name: string;
  display_version: string;
  publisher: string;
  email: string;
  website: string;
}

export interface RoonApiOptions extends RoonExtensionDescription {
  log_level?: "none" | "all";
  core_paired?: (core: RoonServer) => void;
  core_unpaired?: (core: RoonServer) => void;
  core_found?: (core: RoonServer) => void;
  core_lost?: (core: RoonServer) => void;
}

export interface RoonServer {
  core_id: string;
  display_name: string;
  display_version: string;
  services: {
    readonly RoonApiBrowse: RoonApiBrowse;
    readonly RoonApiImage: RoonApiImage;
    readonly RoonApiTransport: RoonApiTransport;
  };
}

export type RequestedRoonServices = RoonApiBrowse | RoonApiImage | RoonApiTransport;
export type ProvidedRoonServices = RoonApiStatus | object;

export interface RoonServiceOptions {
  required_services?: { new (): RequestedRoonServices }[];
  optional_services?: { new (): RequestedRoonServices }[];
  provided_services?: ProvidedRoonServices[];
}

export interface WSConnectOptions {
  host: string;
  port: number;
  onclose?: () => void;
}

export type RoonSubscriptionResponse = "Subscribed" | "Changed" | "Unsubscribed";

export interface RoonApi {
  // constructor(options: RoonApiOptions);
  init_services(services: RoonServiceOptions): this;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  load_config<T = unknown>(key: string): T | undefined;
  save_config(key: string, value: unknown): void;
  start_discovery(): void;
  ws_connect(options: WSConnectOptions): this;
}

export interface RoonApiBrowseOptions {
  hierarchy: RoonApiBrowseHierarchy;
  multi_session_key?: string;
  item_key?: string;
  input?: string;
  zone_or_output_id?: string;
  pop_all?: boolean;
  pop_levels?: number;
  refresh_list?: boolean;
  set_display_offset?: number | boolean;
}

export type RoonApiBrowseHierarchy =
  | "browse"
  | "playlists"
  | "settings"
  | "internet_radio"
  | "albums"
  | "artists"
  | "genres"
  | "composers"
  | "search";

export interface RoonApiBrowseResponse {
  action: string;
  item?: Item;
  list?: List;
  message?: string;
  is_error?: boolean;
}

export interface Item {
  title: string;
  subtitle?: string;
  image_key?: string;
  item_key?: string;
  hint?: ItemHint | null;
  input_prompt?: {
    prompt: string;
    action: string;
    value?: string;
    is_password?: boolean;
  };
}

export type ItemHint = "action" | "action_list" | "list" | "header";

export interface List {
  title: string;
  count: number;
  subtitle?: string;
  image_key?: string;
  level: number;
  display_offset?: number;
  hint?: ListHint | null;
}

export type ListHint = "action_list";

export interface RoonApiBrowseLoadOptions {
  set_display_offset?: number;
  level?: number;
  offset?: number;
  count?: number;
  hierarchy: RoonApiBrowseHierarchy;
  multi_session_key?: string;
}

export interface RoonApiBrowseLoadResponse {
  items: Item[];
  offset: number;
  list: List;
}

export interface RoonApiBrowse {
  browse(options: RoonApiBrowseOptions | EmptyObject): Promise<RoonApiBrowseResponse>;
  load(options: RoonApiBrowseLoadOptions): Promise<RoonApiBrowseLoadResponse>;
}

export interface RoonApiImageResultOptions {
  scale?: RoonImageScale;
  width?: number;
  height?: number;
  format?: RoonImageFormat;
}

export type RoonImageScale = "fit" | "fill" | "stretch";

export type RoonImageFormat = "image/jpeg" | "image/png";

export interface RoonApiImage {
  get_image(image_key: string, options: RoonApiImageResultOptions): Promise<{ content_type: string; image: Buffer }>;
}

export interface Zone {
  zone_id: string;
  display_name: string;
  outputs: Output[];
  state: RoonPlaybackState;
  seek_position?: number;
  is_previous_allowed: boolean;
  is_next_allowed: boolean;
  is_pause_allowed: boolean;
  is_play_allowed: boolean;
  is_seek_allowed: boolean;
  queue_items_remaining?: number;
  queue_time_remaining?: number;
  settings?: ZoneSettings;
  now_playing?: ZoneNowPlaying;
}

export type RoonPlaybackState = "playing" | "paused" | "loading" | "stopped";

export interface ZoneSettings {
  loop: ZoneLoopSettings;
  shuffle: boolean;
  auto_radio: boolean;
}

export type ZoneLoopSettings = "loop" | "loop_one" | "disabled";

export interface RoonThreeLine {
  one_line: {
    line1: string;
  };
  two_line: {
    line1: string;
    line2?: string;
  };
  three_line: {
    line1: string;
    line2?: string;
    line3?: string;
  };
}

export interface ZoneNowPlaying extends RoonThreeLine {
  seek_position?: number;
  length?: number;
  image_key?: string;
}

export interface Output {
  output_id: string;
  zone_id: string;
  can_group_with_output_ids: string[];
  display_name: string;
  state?: RoonPlaybackState;
  source_controls?: OutputSourceControls[];
  volume?: OutputVolumeControl;
}

export interface OutputSourceControls {
  control_key: string;
  display_name: string;
  status: OutputSourceControlStatus;
  supports_standby: boolean;
}

export type OutputSourceControlStatus = "selected" | "deselected" | "standby" | "indeterminate";

export interface OutputVolumeControl {
  type?: OutputVolumeControlType;
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  is_muted?: boolean;
  hard_limit_min?: number;
  hard_limit_max?: number;
  soft_limit?: number;
}

export type OutputVolumeControlType = "number" | "db" | "incremental";

export interface RoonApiTransportSettings {
  shuffle?: boolean;
  auto_radio?: boolean;
  loop?: RoonLoopOptions;
}

export type RoonLoopOptions = "loop" | "loop_one" | "disabled" | "next";

export type RoonChangeVolumeHow = "absolute" | "relative" | "relative_step";

export type RoonApiTransportControl = "play" | "pause" | "playpause" | "stop" | "previous" | "next";

export interface RoonApiTransportConvenienceSwitchOptions {
  control_key?: string;
}

export type RoonMuteHow = "mute" | "unmute";

export type RoonSeekHow = "relative" | "absolute";

export interface RoonApiTransportStandbyOptions {
  control_key?: string;
}

export type RoonApiTransportOutputSubscriptionCallback = (
  response: RoonSubscriptionResponse,
  body: RoonApiTransportOutputs
) => void;

export interface RoonApiTransportOutputs {
  outputs?: Output[];
  changed_outputs?: Output[];
}

export type RoonApiTransportZonesSubscriptionCallback = (
  response: RoonSubscriptionResponse,
  body: RoonApiTransportZones
) => void;

export interface RoonApiTransportZones {
  zones?: Zone[];
  zones_added?: Zone[];
  zones_changed?: Zone[];
  zones_removed?: string[];
  zones_seek_changed?: Pick<Zone, "zone_id" | "queue_time_remaining" | "seek_position">[];
}

export type RoonApiTransportQueueSubscriptionCallback = (
  response: RoonSubscriptionResponse,
  body: RoonApiTransportQueue
) => void;

export interface QueueItem extends RoonThreeLine {
  queue_item_id: number;
  length: number;
  image_key: string;
}

export interface RoonApiTransportQueue {
  items?: QueueItem[];
  changes?: QueueChange[];
}

export interface RemoveQueueChange {
  operation: "remove";
  index: number;
  count: number;
}

export interface InsertQueueChange {
  operation: "insert";
  index: number;
  items: QueueItem[];
}

export type QueueChange = RemoveQueueChange | InsertQueueChange;

export interface RoonApiTransport {
  change_settings(zone: Zone | Output, settings: RoonApiTransportSettings): Promise<void>;
  change_volume(output: Output, how: RoonChangeVolumeHow, value: number): Promise<void>;
  control(zone: Zone | Output, control: RoonApiTransportControl): Promise<void>;
  convenience_switch(output: Output, opts: RoonApiTransportConvenienceSwitchOptions | EmptyObject): Promise<void>;
  get_outputs(): Promise<RoonApiTransportOutputs>;
  get_zones(): Promise<RoonApiTransportZones>;
  group_outputs(outputs: Output[] | OutputDescription[]): Promise<void>;
  mute(output: Output, how: RoonMuteHow): Promise<void>;
  mute_all(how: RoonMuteHow): Promise<void>;
  pause_all(): Promise<void>;
  play_from_here(zone: Zone | Output, queue_item_id: string): Promise<RoonApiTransportQueue>;
  seek(zone: Zone | Output, how: RoonSeekHow, seconds: number): Promise<void>;
  standby(output: Output, opts: RoonApiTransportStandbyOptions): Promise<void>;
  subscribe_outputs(cb: RoonApiTransportOutputSubscriptionCallback): void;
  subscribe_queue(zone: Zone | Output, max_item_count: number, cb: RoonApiTransportQueueSubscriptionCallback): void;
  subscribe_zones(cb: RoonApiTransportZonesSubscriptionCallback): void;
  toggle_standby(output: Output, opts: RoonApiTransportStandbyOptions): Promise<void>;
  transfer_zone(fromZone: Zone | Output, toZone: Zone | Output): Promise<void>;
  ungroup_outputs(outputs: Output[] | OutputDescription[]): Promise<void>;
  zone_by_zone_id(zone_id: string): Zone | null;
  zone_by_output_id(output_id: string): Output | null;
  zone_by_object(zone: Zone | Output): Zone;
}

export interface RoonApiStatus {
  //constructor(roon: RoonApi);
  set_status(message: string, is_error: boolean): void;
}

export type SaveSettingsStatus = "Success" | "NotValid";

export interface RoonApiSettings<T extends SettingsValues> {
  update_settings: (settingsLayout: SettingsLayout<T>) => void;
}

export type SettingsLayoutBuilder<T extends SettingsValues> = (
  values: T,
  has_error: boolean,
  roon_extension: RoonExtension
) => SettingsLayout<T>;

export type SettingsDispatcher<T extends SettingsValues> = (roon_extension: RoonExtension, settings_values: T) => void;

export type SettingsValidator<T extends SettingsValues> = (
  settings_to_save: Partial<T>,
  roon_extension: RoonExtension
) => ValidatedSettingsValues<T>;

export interface RoonApiSettingsOptions<T extends SettingsValues> {
  build_layout: SettingsLayoutBuilder<T>;
  dispatch_settings: SettingsDispatcher<T>;
  validate_settings: SettingsValidator<T>;
  default_values: T;
}

export type SettingsValues = { [key: string]: string | Zone | undefined };

export interface ValidatedSettingsValues<T extends SettingsValues> {
  values: Partial<T>;
  has_error: boolean;
}

export type SettingType = "zone" | "string" | "dropdown" | "group" | "label" | "integer";

export interface BaseSetting {
  type: SettingType;
  title: string;
  subtitle?: string;
}

export interface MutableSetting extends BaseSetting {
  setting: string;
  error?: string;
}

export interface LabelSetting extends BaseSetting {
  type: "label";
}

export interface ZoneSetting extends MutableSetting {
  type: "zone";
}

export interface StringSetting extends MutableSetting {
  type: "string";
}

export interface DropdownSetting extends MutableSetting {
  type: "dropdown";
  values: { title: string; value?: string }[];
}

export interface GroupSetting extends BaseSetting {
  type: "group";
  items: Setting[];
  collapsable?: boolean;
}

export interface IntegerSetting extends MutableSetting {
  type: "integer";
  min?: number;
  max?: number;
}

export type Setting = LabelSetting | ZoneSetting | StringSetting | DropdownSetting | GroupSetting | IntegerSetting;

export interface SettingsLayout<T extends SettingsValues> {
  values: T;
  layout: Setting[];
  has_error: boolean;
}

export type RoonServiceRequired = "not_required" | "required" | "optional";

export interface RoonExtensionOptions<T extends SettingsValues> {
  description: RoonExtensionDescription;
  log_level?: "none" | "all";
  RoonApiBrowse?: RoonServiceRequired;
  RoonApiImage?: RoonServiceRequired;
  RoonApiTransport?: RoonServiceRequired;
  RoonApiSettings?: RoonApiSettingsOptions<T>;
  subscribe_outputs?: boolean;
  subscribe_zones?: boolean;
}

export interface RoonExtension {
  on(eventName: "core_paired" | "core_unpaired", listener: (core: RoonServer) => void): this;
  off(eventName: "core_paired" | "core_unpaired", listener: (core: RoonServer) => void): this;
  once(eventName: "core_paired" | "core_unpaired", listener: (core: RoonServer) => void): this;
  emit(eventName: "core_paired" | "core_unpaired", core: RoonServer): boolean;

  on(
    eventName: "subscribe_outputs",
    listener: (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportOutputs) => void
  ): this;
  off(
    eventName: "subscribe_outputs",
    listener: (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportOutputs) => void
  ): this;
  once(
    eventName: "subscribe_outputs",
    listener: (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportOutputs) => void
  ): this;
  emit(
    eventName: "subscribe_outputs",
    core: RoonServer,
    response: RoonSubscriptionResponse,
    body: RoonApiTransportOutputs
  ): boolean;

  on(
    eventName: "subscribe_zones",
    listener: (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportZones) => void
  ): this;
  off(
    eventName: "subscribe_zones",
    listener: (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportZones) => void
  ): this;
  once(
    eventName: "subscribe_zones",
    listener: (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportZones) => void
  ): this;
  emit(
    eventName: "subscribe_zones",
    core: RoonServer,
    response: RoonSubscriptionResponse,
    body: RoonApiTransportZones
  ): boolean;
  api(): RoonApi;
  start_discovery(provided_services: ProvidedRoonServices[] = []): void;
  set_status(message: string, is_error: boolean = false): void;
  update_options(options: Partial<RoonExtensionOptions>): void;
  get_core(): Promise<RoonServer>;
}
