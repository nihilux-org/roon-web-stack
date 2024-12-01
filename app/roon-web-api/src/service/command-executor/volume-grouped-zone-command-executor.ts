import { CommandExecutor, FoundZone, VolumeGroupedZoneCommand } from "@model";
import { awaitAll } from "./command-executor-utils";

export const executor: CommandExecutor<VolumeGroupedZoneCommand, FoundZone> = async (command, foundZone) => {
  const { zone, server } = foundZone;
  const roonPromises: Promise<void>[] = [];
  for (const o of zone.outputs) {
    if (o.volume) {
      const value = (o.volume.step ?? 1) * (command.data.decrement ? -1 : 1);
      roonPromises.push(server.services.RoonApiTransport.change_volume(o, "relative", value));
    }
  }
  await awaitAll(roonPromises);
};
