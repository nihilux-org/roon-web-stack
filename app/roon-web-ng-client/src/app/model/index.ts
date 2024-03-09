import { CommandState, Output, Track } from "@model";

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

export type OutputCallback = (output_id: string, zone_id: string) => void;
