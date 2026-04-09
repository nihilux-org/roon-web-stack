import { logger, roon } from "@infrastructure";
import {
  AirplayImage,
  AirplayManager,
  AirplayMetadata,
  AudioInputSessionManager,
  ExtensionSettings,
  RoonAudioInputTrackInfoUpdate,
  SettingsManager,
} from "@nihilux/roon-web-model";

interface AirplaySession {
  airplay_stream_url: string;
  zone_id: string;
  image?: AirplayImage;
}

class InternalAirplayManager implements AirplayManager {
  private static readonly AIRPLAY_IMAGE_KEY_PREFIX = "airplay_image";
  private readonly audioInputSessionManager?: AudioInputSessionManager;
  private readonly settingsManager?: SettingsManager<ExtensionSettings>;
  private airplaySession?: AirplaySession;
  private airplayImageCounter: number;

  constructor() {
    this.audioInputSessionManager = roon.audioInputSessionManager();
    this.settingsManager = roon.settings();
    this.airplayImageCounter = 0;
  }

  start = async (airplay_stream_url: string): Promise<void> => {
    if (this.isEnabled()) {
      const zone_id = this.settingsManager!.settings().nr_airplay_zone;
      return this._start({
        airplay_stream_url,
        zone_id,
      });
    }
  };

  private _start = async (airplaySession: AirplaySession): Promise<void> => {
    const line1 = "Roon Airplay";
    await this.audioInputSessionManager?.play(
      airplaySession.zone_id,
      airplaySession.airplay_stream_url,
      "Roon Airplay",
      {
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
      }
    );
    this.airplaySession = airplaySession;
  };

  stop = async (): Promise<void> => {
    if (this.isEnabled() && this.airplaySession !== undefined) {
      await this.audioInputSessionManager!.end_session(this.airplaySession.zone_id);
      delete this.airplaySession;
    }
  };

  isAirplayZone = (zone_id: string): boolean => {
    return this.airplaySession?.zone_id === zone_id;
  };

  transferAirplayZone = async (new_zone_id: string): Promise<void> => {
    if (this.isEnabled() && this.airplaySession !== undefined && this.airplaySession.zone_id !== new_zone_id) {
      const newSession = this.airplaySession;
      await this.stop();
      newSession.zone_id = new_zone_id;
      await this._start(newSession);
    }
  };

  set image(image: AirplayImage) {
    if (image !== undefined && this.airplaySession !== undefined) {
      this.airplayImageCounter++;
      this.airplaySession.image = {
        ...image,
        image_key: `${InternalAirplayManager.AIRPLAY_IMAGE_KEY_PREFIX}_${this.airplayImageCounter}`,
      };
    } else if (this.airplaySession !== undefined) {
      delete this.airplaySession.image;
    }
  }

  get image(): AirplayImage | undefined {
    return this.airplaySession?.image;
  }

  isAirplayImageKey = (image_key: string): boolean => {
    return image_key.startsWith(InternalAirplayManager.AIRPLAY_IMAGE_KEY_PREFIX);
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

export const airplayManager: AirplayManager = new InternalAirplayManager();
