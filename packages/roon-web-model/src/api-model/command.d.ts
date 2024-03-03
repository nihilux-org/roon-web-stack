import { Subject } from "rxjs";
import { RoonServer, Zone } from "../roon-kit";
import { SseMessage, SseMessageData } from "./common";

export const enum CommandResult {
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
}

export interface CommandState extends SseMessageData {
  command_id: string;
  state: CommandResult;
  cause?: string;
}

export interface CommandSseMessage extends SseMessage<CommandState> {
  event: "command_state";
}
export const enum CommandType {
  // control actions
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  PLAY_PAUSE = "PLAY_PAUSE",
  STOP = "STOP",
  PREVIOUS = "PREVIOUS",
  NEXT = "NEXT",
  // volume actions
  VOLUME = "VOLUME",
  MUTE = "MUTE",
  // other actions
  PLAY_FROM_HERE = "PLAY_FROM_HERE",
  TRANSFER_ZONE = "TRANSFER_ZONE",
}

export interface PlayCommand {
  type: CommandType.PLAY;
  data: {
    zone_id: string;
  };
}

export interface PauseCommand {
  type: CommandType.PAUSE;
  data: {
    zone_id: string;
  };
}

export interface PlayPauseCommand {
  type: CommandType.PLAY_PAUSE;
  data: {
    zone_id: string;
  };
}

export interface StopCommand {
  type: CommandType.STOP;
  data: {
    zone_id: string;
  };
}

export interface NextCommand {
  type: CommandType.NEXT;
  data: {
    zone_id: string;
  };
}

export interface PreviousCommand {
  type: CommandType.PREVIOUS;
  data: {
    zone_id: string;
  };
}

export const enum VolumeStrategy {
  ABSOLUTE = "ABSOLUTE",
  RELATIVE = "RELATIVE",
  RELATIVE_STEP = "RELATIVE_STEP",
}

export interface VolumeCommand {
  type: CommandType.VOLUME;
  data: {
    zone_id: string;
    output_id: string;
    strategy: VolumeStrategy;
    value: number;
  };
}

export const enum MuteType {
  TOGGLE = "TOGGLE",
  MUTE = "MUTE",
  UN_MUTE = "UN_MUTE",
}

export interface MuteCommand {
  type: CommandType.MUTE;
  data: {
    zone_id: string;
    output_id: string;
    type: MuteType;
  };
}

export interface PlayFromHereCommand {
  type: CommandType.PLAY_FROM_HERE;
  data: {
    zone_id: string;
    queue_item_id: string;
  };
}

export interface TransferZoneCommand {
  type: CommandType.TRANSFER_ZONE;
  data: {
    zone_id: string;
    to_zone_id: string;
  };
}

export type Command = ControlCommand | VolumeCommand | MuteCommand | PlayFromHereCommand | TransferZoneCommand;

export type ControlCommand =
  | PlayCommand
  | PauseCommand
  | PlayPauseCommand
  | StopCommand
  | NextCommand
  | PreviousCommand;

export interface CommandDispatcher {
  dispatch: (command: Command, notificationChannel: Subject<CommandState>) => string;
}

export interface FoundZone {
  server: RoonServer;
  zone: Zone;
}

export type ExecutionContext = FoundZone | RoonServer;

export type CommandExecutor<T extends Command, U extends ExecutionContext> = (
  command: T,
  executionContext: U
) => Promise<void>;
