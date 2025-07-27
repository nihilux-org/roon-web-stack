import { logger } from "@infrastructure";
import {
  ExtensionSettings,
  InternalCommandType,
  Queue,
  QueueBot,
  QueueBotCommand,
  Roon,
  SettingsUpdateListener,
} from "@nihilux/roon-web-model";
import { commandDispatcher } from "@service";

interface QueueBotSettings {
  enabled: boolean;
  artistName: string;
  standbyName: string;
  pauseName: string;
}

let _isStarted = false;
let _settings: QueueBotSettings | undefined;

const start = (roon: Roon): void => {
  if (!_isStarted) {
    roon.settings()?.onSettings(updateSettings);
    _isStarted = true;
  }
};

const updateSettings: SettingsUpdateListener<ExtensionSettings> = (extensionSettings: ExtensionSettings) => {
  _settings = {
    enabled: extensionSettings.nr_queue_bot_state === "enabled",
    artistName: extensionSettings.nr_queue_bot_artist_name,
    pauseName: extensionSettings.nr_queue_bot_pause_track_name,
    standbyName: extensionSettings.nr_queue_bot_standby_track_name,
  };
  logger.debug(`queueBot is ${_settings.enabled ? "enabled" : "disabled"}`);
};

const watchQueue = (queue: Queue): void => {
  if (_settings?.enabled && queue.items.length > 0) {
    const nextTrack = queue.items[0];
    const artist = nextTrack.three_line.line2 ?? nextTrack.two_line.line2;
    if (artist === _settings.artistName) {
      let type: InternalCommandType | undefined;
      switch (nextTrack.three_line.line1) {
        case _settings.pauseName:
          type = InternalCommandType.STOP_NEXT;
          break;
        case _settings.standbyName:
          type = InternalCommandType.STANDBY_NEXT;
          break;
      }
      if (type !== undefined) {
        const command: QueueBotCommand = {
          type,
          data: {
            zone_id: queue.zone_id,
          },
        };
        logger.debug(`queueBot is sending '${type}' for zone_id '${queue.zone_id}'`);
        commandDispatcher.dispatchInternal(command);
      }
    }
  }
};

export const queueBot: QueueBot = {
  start,
  watchQueue,
};
