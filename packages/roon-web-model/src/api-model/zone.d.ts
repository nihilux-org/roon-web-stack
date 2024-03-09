import { Observable } from "rxjs";
import {
  Output,
  RoonApiTransportOutputs,
  RoonApiTransportZones,
  RoonPlaybackState,
  RoonServer,
  RoonSubscriptionResponse,
  Zone,
} from "../roon-kit";
import { RoonSseMessage, SseMessage, SseMessageData, Track } from "./index";

export interface ZoneDescription extends Pick<Zone, "display_name" | "zone_id"> {}

export interface OutputDescription extends Pick<Output, "display_name" | "zone_id" | "output_id"> {}

export interface ZoneListener {
  (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportZones): void;
}

export interface OutputListener {
  (core: RoonServer, response: RoonSubscriptionResponse, body: RoonApiTransportOutputs): void;
}

export const enum RoonState {
  LOST = "LOST",
  STARTING = "STARTING",
  STOPPED = "STOPPED",
  SYNC = "SYNC",
  SYNCING = "SYNCING",
}

export interface ZoneManager {
  zones: () => ZoneDescription[];
  events: () => Observable<RoonSseMessage>;
  start: () => Promise<void>;
  stop: () => void;
  isStarted: () => boolean;
}
export interface ZoneNicePlaying {
  track: Track;
  total_queue_remaining_time?: string;
  nb_items_in_queue?: number;
  state: RoonPlaybackState;
}

export interface ZoneState extends SseMessageData, Omit<Zone, "now_playing"> {
  nice_playing?: ZoneNicePlaying;
}

export interface ZoneSseMessage extends SseMessage<ZoneState> {
  event: "zone";
}
