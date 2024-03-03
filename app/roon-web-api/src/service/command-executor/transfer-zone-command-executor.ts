import { CommandExecutor, FoundZone, TransferZoneCommand } from "@model";

export const executor: CommandExecutor<TransferZoneCommand, FoundZone> = (command, foundZone) => {
  const { zone, server } = foundZone;
  const toZone = server.services.RoonApiTransport.zone_by_zone_id(command.data.to_zone_id);
  if (toZone) {
    return server.services.RoonApiTransport.transfer_zone(zone, toZone);
  } else {
    return Promise.reject(new Error(`'${command.data.to_zone_id}' is not a valid zone_id`));
  }
};
