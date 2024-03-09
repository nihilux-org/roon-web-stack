import { nanoid } from "nanoid";
import { Subject } from "rxjs";
import { logger, roon } from "@infrastructure";
import {
  Command,
  CommandDispatcher,
  CommandExecutor,
  CommandResult,
  CommandState,
  CommandType,
  ExecutionContext,
  FoundZone,
  RoonServer,
} from "@model";
import { executor as controlExecutor } from "./command-executor/control-command-executor";
import { executor as groupExecutor } from "./command-executor/group-command-executor";
import { executor as muteExecutor } from "./command-executor/mute-command-executor";
import { executor as playFromHereExecutor } from "./command-executor/play-from-here-command-executor";
import { executor as transferZoneExecutor } from "./command-executor/transfer-zone-command-executor";
import { executor as volumeExecutor } from "./command-executor/volume-command-executor";

const dispatch = (command: Command, controlChannel: Subject<CommandState>): string => {
  const command_id = nanoid();
  switch (command.type) {
    case CommandType.PLAY:
    case CommandType.PAUSE:
    case CommandType.PLAY_PAUSE:
    case CommandType.STOP:
    case CommandType.NEXT:
    case CommandType.PREVIOUS:
      executeCommand(command_id, command, findZone(command.data.zone_id), controlExecutor, controlChannel);
      break;
    case CommandType.VOLUME:
      executeCommand(command_id, command, findZone(command.data.zone_id), volumeExecutor, controlChannel);
      break;
    case CommandType.MUTE:
      executeCommand(command_id, command, findZone(command.data.zone_id), muteExecutor, controlChannel);
      break;
    case CommandType.PLAY_FROM_HERE:
      executeCommand(command_id, command, findZone(command.data.zone_id), playFromHereExecutor, controlChannel);
      break;
    case CommandType.TRANSFER_ZONE:
      executeCommand(command_id, command, findZone(command.data.zone_id), transferZoneExecutor, controlChannel);
      break;
    case CommandType.GROUP:
      executeCommand(command_id, command, roon.server(), groupExecutor, controlChannel);
      break;
  }
  return command_id;
};

const executeCommand: <T extends Command, U extends ExecutionContext>(
  command_id: string,
  command: T,
  executionContext: Promise<U>,
  executor: CommandExecutor<T, U>,
  controlChannel: Subject<CommandState>
) => void = (command_id, command, executionContext, executor, controlChannel) => {
  void executionContext
    .then(async (ec) => {
      await executor(command, ec);
      const commandNotification: CommandState = {
        command_id,
        state: CommandResult.APPLIED,
      };
      controlChannel.next(commandNotification);
    })
    .catch((err: Error) => {
      logger.error(err, "error while dispatching command '%s': '%s'", command_id, JSON.stringify(command));
      const commandNotification: CommandState = {
        command_id,
        state: CommandResult.REJECTED,
        cause: err.message,
      };
      controlChannel.next(commandNotification);
    });
};

const findZone = async (zone_id: string): Promise<FoundZone> => {
  return roon.server().then((server: RoonServer): FoundZone => {
    const zone = server.services.RoonApiTransport.zone_by_zone_id(zone_id);
    if (zone) {
      return {
        server,
        zone,
      };
    } else {
      throw new Error(`'${zone_id}' is not a known zone_id`);
    }
  });
};

export const commandDispatcher: CommandDispatcher = {
  dispatch,
};
