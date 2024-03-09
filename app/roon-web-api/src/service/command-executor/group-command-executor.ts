import { CommandExecutor, GroupCommand, RoonServer } from "@model";

export const executor: CommandExecutor<GroupCommand, RoonServer> = (command, server) => {
  if (command.data.mode === "group") {
    return server.services.RoonApiTransport.group_outputs(command.data.outputs);
  } else {
    return server.services.RoonApiTransport.ungroup_outputs(command.data.outputs);
  }
};
