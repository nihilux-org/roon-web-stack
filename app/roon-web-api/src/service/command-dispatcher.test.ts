import { loggerMock, nanoidMock } from "@mock";
import { roonMock } from "../infrastructure/roon-extension.mock";
import { controlExecutorMock } from "./command-executor/control-command-executor.mock";
import { muteCommandExecutorMock } from "./command-executor/mute-command-executor.mock";
import { playFromHereCommandExecutorMock } from "./command-executor/play-from-here-command-executor.mock";
import { transferZoneCommandExecutorMock } from "./command-executor/transfer-zone-command-executor.mock";
import { volumeCommandExecutor } from "./command-executor/volume-command-executor.mock";

import { Subject } from "rxjs";
import {
  Command,
  CommandResult,
  CommandState,
  CommandType,
  MuteCommand,
  MuteType,
  Output,
  PlayFromHereCommand,
  RoonServer,
  TransferZoneCommand,
  VolumeCommand,
  VolumeStrategy,
  Zone,
} from "@model";
import { commandDispatcher } from "./command-dispatcher";

describe("command-dispatcher.ts test suite", () => {
  let nanoid_counter: number;
  let zone_by_zone_id: jest.Mock;
  let server: RoonServer;
  let controlChannel: Subject<CommandState>;
  beforeEach(() => {
    nanoid_counter = 0;
    nanoidMock.mockImplementation(() => `${++nanoid_counter}`);
    zone_by_zone_id = jest.fn().mockImplementation((z_id: string) => {
      if (z_id === zone_id) {
        return zone;
      } else {
        return null;
      }
    });
    server = {
      services: {
        RoonApiTransport: {
          zone_by_zone_id,
        },
      },
    } as unknown as RoonServer;
    roonMock.server.mockImplementation(() => Promise.resolve(server));
    controlChannel = new Subject<CommandState>();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it("command-dispatcher#dispatch should always dispatch an error and log it if the provided zone is not a known zone", async () => {
    zone_by_zone_id.mockImplementation(() => null);
    const notifications: CommandState[] = [];
    const promise: Promise<void> = new Promise((resolve) => {
      controlChannel.subscribe((n: CommandState) => {
        notifications.push(n);
        if (notifications.length === commands.length) {
          resolve();
        }
      });
    });

    commands.forEach((c: Command) => {
      commandDispatcher.dispatch(c, controlChannel);
    });
    await promise;
    expect(nanoid_counter).toEqual(commands.length);
    notifications.forEach((notification: CommandState, index: number) => {
      const command_id = `${index + 1}`;
      expect(notification).toEqual({
        command_id,
        state: CommandResult.REJECTED,
        cause: "'zone_id' is not a known zone_id",
      });
      expect(loggerMock.error).toHaveBeenNthCalledWith(
        parseInt(command_id, 10),
        new Error("'zone_id' is not a known zone_id"),
        "error while dispatching command '%s': '%s'",
        command_id,
        JSON.stringify(commands[index])
      );
    });
  });

  it("command-dispatcher#dispatch should call control-command-executor command executor with any ControlCommand", async () => {
    const controlCommands = commands.filter(
      (c) =>
        c.type !== CommandType.VOLUME &&
        c.type !== CommandType.MUTE &&
        c.type !== CommandType.PLAY_FROM_HERE &&
        c.type !== CommandType.TRANSFER_ZONE
    );
    controlExecutorMock.mockImplementation(() => Promise.resolve());
    const notifications: CommandState[] = [];
    const commandIds: string[] = [];
    const promise: Promise<void> = new Promise((resolve) => {
      controlChannel.subscribe((cn: CommandState) => {
        notifications.push(cn);
        if (notifications.length === controlCommands.length) {
          resolve();
        }
      });
    });
    controlCommands.forEach((c: Command) => {
      commandIds.push(commandDispatcher.dispatch(c, controlChannel));
    });
    await promise;
    expect(commandIds).toHaveLength(controlCommands.length);
    controlCommands.forEach((command, index) => {
      expect(controlExecutorMock).toHaveBeenNthCalledWith(index + 1, command, {
        server,
        zone,
      });
    });
  });

  it("command-dispatcher#dispatch should call volume-command-executor with any VolumeCommand", async () => {
    const volumeCommands: VolumeCommand[] = commands
      .filter((c: Command) => c.type === CommandType.VOLUME)
      .map((c: Command) => c as unknown as VolumeCommand);
    const notifications: CommandState[] = [];
    const commandIds: string[] = [];
    const promise: Promise<void> = new Promise((resolve) => {
      controlChannel.subscribe((cn: CommandState) => {
        notifications.push(cn);
        if (notifications.length === volumeCommands.length) {
          resolve();
        }
      });
    });
    volumeCommands.forEach((c: Command) => {
      commandIds.push(commandDispatcher.dispatch(c, controlChannel));
    });
    await promise;
    expect(commandIds).toHaveLength(volumeCommands.length);
    volumeCommands.forEach((command, index) => {
      expect(volumeCommandExecutor).toHaveBeenNthCalledWith(index + 1, command, {
        server,
        zone,
      });
    });
  });

  it("command-dispatcher#dispatch should call mute-command-executor with any MuteCommand", async () => {
    const muteCommands: MuteCommand[] = commands
      .filter((c: Command) => c.type === CommandType.MUTE)
      .map((c: Command) => c as unknown as MuteCommand);
    const notifications: CommandState[] = [];
    const commandIds: string[] = [];
    const promise: Promise<void> = new Promise((resolve) => {
      controlChannel.subscribe((cn: CommandState) => {
        notifications.push(cn);
        if (notifications.length === muteCommands.length) {
          resolve();
        }
      });
    });
    muteCommands.forEach((c: Command) => {
      commandIds.push(commandDispatcher.dispatch(c, controlChannel));
    });
    await promise;
    expect(commandIds).toHaveLength(muteCommands.length);
    muteCommands.forEach((command, index) => {
      expect(muteCommandExecutorMock).toHaveBeenNthCalledWith(index + 1, command, {
        server,
        zone,
      });
    });
  });

  it("command-dispatcher#dispatch should call play-from-here-command-executor with any PlayFromHereCommand", async () => {
    const playFromHereCommand: PlayFromHereCommand[] = commands
      .filter((c: Command) => c.type === CommandType.PLAY_FROM_HERE)
      .map((c: Command) => c as unknown as PlayFromHereCommand);
    const notifications: CommandState[] = [];
    const commandIds: string[] = [];
    const promise: Promise<void> = new Promise((resolve) => {
      controlChannel.subscribe((cn: CommandState) => {
        notifications.push(cn);
        if (notifications.length === playFromHereCommand.length) {
          resolve();
        }
      });
    });
    playFromHereCommand.forEach((c: Command) => {
      commandIds.push(commandDispatcher.dispatch(c, controlChannel));
    });
    await promise;
    expect(commandIds).toHaveLength(playFromHereCommand.length);
    playFromHereCommand.forEach((command, index) => {
      expect(playFromHereCommandExecutorMock).toHaveBeenNthCalledWith(index + 1, command, {
        server,
        zone,
      });
    });
  });

  it("command-dispatcher#dispatch should call transfer-zone-command-executor with any TransferZoneCommand", async () => {
    const transferZoneCommands: TransferZoneCommand[] = commands
      .filter((c: Command) => c.type === CommandType.TRANSFER_ZONE)
      .map((c: Command) => c as unknown as TransferZoneCommand);
    const notifications: CommandState[] = [];
    const commandIds: string[] = [];
    const promise: Promise<void> = new Promise((resolve) => {
      controlChannel.subscribe((cn: CommandState) => {
        notifications.push(cn);
        if (notifications.length === transferZoneCommands.length) {
          resolve();
        }
      });
    });
    transferZoneCommands.forEach((c: Command) => {
      commandIds.push(commandDispatcher.dispatch(c, controlChannel));
    });
    await promise;
    expect(commandIds).toHaveLength(transferZoneCommands.length);
    transferZoneCommands.forEach((command, index) => {
      expect(transferZoneCommandExecutorMock).toHaveBeenNthCalledWith(index + 1, command, {
        server,
        zone,
      });
    });
  });
});

const output_id = "output_id";
const output: Output = {
  output_id,
} as unknown as Output;
const other_output_id = "other_output_id";
const other_output: Output = {
  output_id: other_output_id,
} as unknown as Output;
const zone_id = "zone_id";
const zone: Zone = {
  zone_id,
  outputs: [output, other_output],
} as unknown as Zone;
const commands: Command[] = [
  {
    type: CommandType.PLAY_PAUSE,
    data: {
      zone_id,
    },
  },
  {
    type: CommandType.PLAY,
    data: {
      zone_id,
    },
  },
  {
    type: CommandType.PAUSE,
    data: {
      zone_id,
    },
  },
  {
    type: CommandType.STOP,
    data: {
      zone_id,
    },
  },

  {
    type: CommandType.NEXT,
    data: {
      zone_id,
    },
  },
  {
    type: CommandType.PREVIOUS,
    data: {
      zone_id,
    },
  },
  {
    type: CommandType.VOLUME,
    data: {
      zone_id,
      output_id,
      strategy: VolumeStrategy.ABSOLUTE,
      value: 42,
    },
  },
  {
    type: CommandType.VOLUME,
    data: {
      zone_id,
      output_id,
      strategy: VolumeStrategy.RELATIVE,
      value: 42,
    },
  },
  {
    type: CommandType.VOLUME,
    data: {
      zone_id,
      output_id,
      strategy: VolumeStrategy.RELATIVE_STEP,
      value: 42,
    },
  },
  {
    type: CommandType.VOLUME,
    data: {
      zone_id,
      output_id: other_output_id,
      strategy: VolumeStrategy.ABSOLUTE,
      value: 42,
    },
  },
  {
    type: CommandType.VOLUME,
    data: {
      zone_id,
      output_id: other_output_id,
      strategy: VolumeStrategy.RELATIVE,
      value: 42,
    },
  },
  {
    type: CommandType.VOLUME,
    data: {
      zone_id,
      output_id: other_output_id,
      strategy: VolumeStrategy.RELATIVE_STEP,
      value: 42,
    },
  },
  {
    type: CommandType.MUTE,
    data: {
      zone_id,
      output_id,
      type: MuteType.MUTE,
    },
  },
  {
    type: CommandType.MUTE,
    data: {
      zone_id,
      output_id,
      type: MuteType.TOGGLE,
    },
  },
  {
    type: CommandType.MUTE,
    data: {
      zone_id,
      output_id,
      type: MuteType.UN_MUTE,
    },
  },
  {
    type: CommandType.PLAY_FROM_HERE,
    data: {
      zone_id,
      queue_item_id: "queue_item_id",
    },
  },
  {
    type: CommandType.TRANSFER_ZONE,
    data: {
      zone_id,
      to_zone_id: "to_zone_id",
    },
  },
];
