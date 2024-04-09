import { CommandExecutor, FoundZone, MuteGroupedZoneCommand, MuteType, RoonMuteHow } from "@model";

export const executor: CommandExecutor<MuteGroupedZoneCommand, FoundZone> = (command, foundZone) => {
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
  return Promise.all(roonPromises).then(() => {});
};
