import {
  CommandExecutor,
  CommandType,
  ControlCommand,
  FoundZone,
  RoonApiTransportControl,
} from "@nihilux/roon-web-model";

export const executor: CommandExecutor<ControlCommand, FoundZone> = (command, foundZone) => {
  let control: RoonApiTransportControl;
  switch (command.type) {
    case CommandType.PLAY:
      control = "play";
      break;
    case CommandType.PAUSE:
      control = "pause";
      break;
    case CommandType.PLAY_PAUSE:
      control = "playpause";
      break;
    case CommandType.STOP:
      control = "stop";
      break;
    case CommandType.NEXT:
      control = "next";
      break;
    case CommandType.PREVIOUS:
      control = "previous";
      break;
  }
  const { server, zone } = foundZone;
  return server.services.RoonApiTransport.control(zone, control);
};
