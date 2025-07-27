import { CommandExecutor, FoundZone, MuteGroupedZoneCommand, MuteType, RoonMuteHow } from "@nihilux/roon-web-model";
import { awaitAll } from "./command-executor-utils";

export const executor: CommandExecutor<MuteGroupedZoneCommand, FoundZone> = async (command, foundZone) => {
  const { zone, server } = foundZone;
  const roonPromises: Promise<void>[] = [];
  for (const o of zone.outputs) {
    if (o.volume) {
      let muteHow: RoonMuteHow;
      switch (command.data.type) {
        case MuteType.MUTE:
          muteHow = "mute";
          break;
        case MuteType.UN_MUTE:
          muteHow = "unmute";
          break;
        case MuteType.TOGGLE:
          muteHow = o.volume.is_muted ? "unmute" : "mute";
          break;
      }
      roonPromises.push(server.services.RoonApiTransport.mute(o, muteHow));
    }
  }
  await awaitAll(roonPromises);
};
