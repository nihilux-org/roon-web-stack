import { Subject } from "rxjs";
import { RoonAudioInputTrackInfo, RoonServer, Zone } from "../roon-kit";
import { Roon, SharedConfigUpdate, SseMessage } from "./common";
import { OutputDescription } from "./zone";

export const enum CommandResult {
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
}

export interface CommandState {
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
  VOLUME_GROUPED_ZONE = "VOLUME_GROUPED_ZONE",
  MUTE = "MUTE",
  MUTE_GROUPED_ZONE = "MUTE_GROUPED_ZONE",
  // other actions
  GROUP = "GROUP",
  PLAY_FROM_HERE = "PLAY_FROM_HERE",
  TRANSFER_ZONE = "TRANSFER_ZONE",
  SHARED_CONFIG = "SHARED_CONFIG",
  // audio input
  START_AUDIO_INPUT = "START_AUDIO_INPUT",
  STOP_AUDIO_INPUT = "STOP_AUDIO_INPUT",
  UPDATE_AUDIO_INPUT_INFO = "UPDATE_AUDIO_INPUT_INFO",
}

export const enum InternalCommandType {
  // queue bot actions
  STOP_NEXT = "STOP_NEXT",
  STANDBY_NEXT = "STANDBY_NEXT",
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

export interface VolumeGroupedZoneCommand {
  type: CommandType.VOLUME_GROUPED_ZONE;
  data: {
    zone_id: string;
    decrement: boolean;
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

export interface MuteGroupedZoneCommand {
  type: CommandType.MUTE_GROUPED_ZONE;
  data: {
    zone_id: string;
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

export interface GroupCommand {
  type: CommandType.GROUP;
  data: {
    outputs: OutputDescription[];
    mode: "group" | "ungroup";
  };
}

export interface SharedConfigCommand {
  type: CommandType.SHARED_CONFIG;
  data: {
    sharedConfigUpdate: SharedConfigUpdate;
  };
}

export interface StopNextCommand {
  type: InternalCommandType.STOP_NEXT;
  data: {
    zone_id: string;
  };
}

export interface StandbyNextCommand {
  type: InternalCommandType.STANDBY_NEXT;
  data: {
    zone_id: string;
  };
}

export interface StartAudioInputCommand {
  type: CommandType.START_AUDIO_INPUT;
  data: {
    zone_id: string;
  };
}

export interface UpdateAudioInputInfoCommand {
  type: CommandType.UPDATE_AUDIO_INPUT_INFO;
  data: {
    zone_id: string;
    info: RoonAudioInputTrackInfo;
  };
}

export interface StopAudioInputCommand {
  type: CommandType.STOP_AUDIO_INPUT;
  data: {
    zone_id: string;
  };
}

export type QueueBotCommand = StandbyNextCommand | StopNextCommand;

export type InternalCommand = QueueBotCommand;

export type Command =
  | ControlCommand
  | VolumeCommand
  | VolumeGroupedZoneCommand
  | MuteCommand
  | MuteGroupedZoneCommand
  | PlayFromHereCommand
  | TransferZoneCommand
  | GroupCommand
  | SharedConfigCommand
  | AudioInputCommand;

export type ControlCommand =
  | PlayCommand
  | PauseCommand
  | PlayPauseCommand
  | StopCommand
  | NextCommand
  | PreviousCommand;

export type AudioInputCommand = StartAudioInputCommand | UpdateAudioInputInfoCommand | StopAudioInputCommand;

export interface CommandDispatcher {
  dispatch: (command: Command, notificationChannel: Subject<CommandState>) => string;
  dispatchInternal: (internalCommand: InternalCommand) => void;
}

export interface FoundZone {
  server: RoonServer;
  zone: Zone;
}

export type ExecutionContext = FoundZone | RoonServer | Roon;

export type CommandExecutor<T extends Command, U extends ExecutionContext> = (
  command: T,
  executionContext: U
) => Promise<void>;

export type InternalCommandExecutor<T extends InternalCommand, U extends ExecutionContext> = (
  command: T,
  executionContext: U
) => Promise<void>;
