import { Output, QueueTrack, Track } from "@model";

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

export const DEFAULT_ZONE_COMMANDS: ZoneCommands = {
  zoneId: "",
  previousTrack: ZoneCommandState.ABSENT,
  loading: ZoneCommandState.ABSENT,
  pause: ZoneCommandState.ABSENT,
  play: ZoneCommandState.ABSENT,
  nextTrack: ZoneCommandState.ABSENT,
  outputs: [],
};

export interface TrackDisplay extends Omit<Track, "length" | "seek_percentage" | "seek_position"> {}

export const EMPTY_TRACK: Track = {
  title: "No current track",
};

export interface TrackImage {
  src: string;
  imageSise: number;
  isReady: boolean;
}

export interface QueueDisplay {
  currentTrack: QueueTrack;
  queue: QueueTrack[];
}

export const EMPTY_QUEUE_TRACK: QueueTrack = {
  title: "__empty_queue_track__",
  queue_item_id: -1,
};

export interface NavigationEvent {
  item_key?: string;
  input?: string;
}

export const enum CHOSEN_THEME {
  BROWSER = "BROWSER",
  DARK = "DARK",
  LIGHT = "LIGHT",
}
