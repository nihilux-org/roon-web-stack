import {
  CommandExecutor,
  FoundZone,
  Output,
  RoonChangeVolumeHow,
  VolumeCommand,
  VolumeStrategy,
} from "@nihilux/roon-web-model";

export const executor: CommandExecutor<VolumeCommand, FoundZone> = (command, foundZone) => {
  const { zone, server } = foundZone;
  const output = zone.outputs.find((o: Output) => o.output_id === command.data.output_id);
  if (!output) {
    return Promise.reject(
      new Error(`'${command.data.output_id}' is not a valid 'output_id' for zone '${command.data.zone_id}'`)
    );
  }
  if (output.volume) {
    let roonHow: RoonChangeVolumeHow;
    switch (command.data.strategy) {
      case VolumeStrategy.ABSOLUTE:
        roonHow = "absolute";
        break;
      case VolumeStrategy.RELATIVE:
        roonHow = "relative";
        break;
      case VolumeStrategy.RELATIVE_STEP:
        roonHow = "relative_step";
        break;
    }
    return server.services.RoonApiTransport.change_volume(output, roonHow, command.data.value);
  } else {
    return Promise.resolve();
  }
};
