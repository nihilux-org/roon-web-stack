import { AudioInputCommand, CommandExecutor, CommandType, Roon } from "@nihilux/roon-web-model";

export const executor: CommandExecutor<AudioInputCommand, Roon> = (command, roon) => {
  const audioInputSessionManager = roon.audioInputSessionManager();
  const audioInputUrl = roon.settings()?.settings().nr_audio_input_stream_url;
  if (audioInputSessionManager !== undefined) {
    switch (command.type) {
      case CommandType.START_AUDIO_INPUT:
        if (audioInputUrl !== undefined && audioInputUrl !== "") {
          return audioInputSessionManager.play(command.data.zone_id, audioInputUrl);
        }
        break;
      case CommandType.UPDATE_AUDIO_INPUT_INFO:
        return audioInputSessionManager.update_track_info(command.data.zone_id, command.data.info);
      case CommandType.STOP_AUDIO_INPUT:
        return audioInputSessionManager.end_session(command.data.zone_id);
    }
  }
  return Promise.resolve();
};
