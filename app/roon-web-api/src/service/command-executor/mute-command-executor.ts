import { CommandExecutor, FoundZone, MuteCommand, MuteType, RoonMuteHow } from "@model";

export const executor: CommandExecutor<MuteCommand, FoundZone> = (command, foundZone) => {
  const { zone, server } = foundZone;
  const output = zone.outputs.find((o) => o.output_id === command.data.output_id);
  if (output) {
    if (output.volume) {
      let muteHow: RoonMuteHow;
      switch (command.data.type) {
        case MuteType.MUTE:
          muteHow = "mute";
          break;
        case MuteType.UN_MUTE:
          muteHow = "unmute";
          break;
        case MuteType.TOGGLE:
          muteHow = output.volume.is_muted ? "unmute" : "mute";
          break;
      }
      return server.services.RoonApiTransport.mute(output, muteHow);
    } else {
      return Promise.resolve();
    }
  } else {
    return Promise.reject(
      new Error(`'${command.data.output_id}' is not a valid 'output_id' for zone '${command.data.zone_id}'`)
    );
  }
};
