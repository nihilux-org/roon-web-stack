import { CommandExecutor, FoundZone, PlayFromHereCommand } from "@model";

export const executor: CommandExecutor<PlayFromHereCommand, FoundZone> = (command, foundZone) => {
  const { zone, server } = foundZone;
  return server.services.RoonApiTransport.play_from_here(zone, command.data.queue_item_id).then(() => {});
};
