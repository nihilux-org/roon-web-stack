import { Output } from "@model";

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
