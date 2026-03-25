import { logger, roon } from "@infrastructure";
import {
  AirplayMetadata,
  AirplayService,
  AudioInputSessionManager,
  ExtensionSettings,
  RoonAudioInputTrackInfoUpdate,
  SettingsManager,
} from "@nihilux/roon-web-model";

class InternalAirplayService implements AirplayService {
  private readonly audioInputSessionManager?: AudioInputSessionManager;
  private readonly settingsManager?: SettingsManager<ExtensionSettings>;

  constructor() {
    this.audioInputSessionManager = roon.audioInputSessionManager();
    this.settingsManager = roon.settings();
  }

  start = async (): Promise<void> => {
    if (this.isEnabled()) {
      const zone_id = this.settingsManager!.settings().nr_airplay_zone;
      const airplay_stream_url = this.settingsManager!.settings().nr_airplay_stream_url;
      const line1 = "Roon Airplay";
      await this.audioInputSessionManager?.play(zone_id, airplay_stream_url, "Roon Airplay", {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: {
          line1,
        },
        two_line: {
          line1,
        },
        three_line: {
          line1,
        },
      });
    }
  };

  stop = async (): Promise<void> => {
    if (this.isEnabled()) {
      await this.audioInputSessionManager!.end_session(this.settingsManager!.settings().nr_airplay_zone);
    }
  };

  updateMetadata = async (metadata: AirplayMetadata): Promise<void> => {
    if (
      this.isEnabled() &&
      (metadata.artist !== undefined || metadata.album !== undefined || metadata.title !== undefined)
    ) {
      const zone_id = this.settingsManager!.settings().nr_airplay_zone;
      const trackInfo: RoonAudioInputTrackInfoUpdate = {
        is_seek_allowed: false,
        is_pause_allowed: false,
        one_line: { line1: metadata.title ?? "" },
        two_line: { line1: metadata.title ?? "", line2: metadata.artist ?? "" },
        three_line: { line1: metadata.title ?? "", line2: metadata.artist ?? "", line3: metadata.album ?? "" },
        track_id: `${metadata.artist}_${metadata.album}_${metadata.title}`,
      };
      try {
        await this.audioInputSessionManager?.update_track_info(zone_id, trackInfo);
      } catch (error) {
        logger.debug(error, "error in roon API call update_track_info");
      }
    }
  };

  private isEnabled = (): boolean => {
    return (
      this.audioInputSessionManager !== undefined && this.settingsManager?.settings().nr_airplay_state === "enabled"
    );
  };
}

export const airplayService: AirplayService = new InternalAirplayService();
