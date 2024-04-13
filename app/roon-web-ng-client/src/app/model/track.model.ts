import { Track } from "@model";

export interface TrackDisplay extends Omit<Track, "length" | "seek_percentage" | "seek_position"> {}

export const EMPTY_TRACK: Track = {
  title: "No current track",
};

export interface TrackImage {
  src: string;
  size: number;
  isReady: boolean;
}
