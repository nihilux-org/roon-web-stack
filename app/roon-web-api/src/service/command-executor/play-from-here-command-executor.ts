import { CommandExecutor, FoundZone, PlayFromHereCommand } from "@nihilux/roon-web-model";

export const executor: CommandExecutor<PlayFromHereCommand, FoundZone> = (command, foundZone) => {
  const { zone, server } = foundZone;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return server.services.RoonApiTransport.play_from_here(zone, command.data.queue_item_id).then(() => {});
};
