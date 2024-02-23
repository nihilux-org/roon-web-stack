import { deepEqual } from "fast-equals";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { ZoneCommandsComponent } from "@components/zone-commands/zone-commands.component";
import { ZoneDisplayComponent } from "@components/zone-display/zone-display.component";
import { ZoneProgressionComponent } from "@components/zone-progression/zone-progression.component";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { ZoneState } from "@model";
import {
  DEFAULT_ZONE_PROGRESSION,
  EMPTY_TRACK,
  TrackDisplay,
  ZoneCommands,
  ZoneCommandState,
  ZoneProgression,
} from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-container",
  standalone: true,
  imports: [ZoneCommandsComponent, ZoneDisplayComponent, ZoneProgressionComponent, ZoneSelectorComponent],
  templateUrl: "./zone-container.component.html",
  styleUrl: "./zone-container.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneContainerComponent {
  private readonly _$zone: Signal<ZoneState>;
  readonly $trackDisplay: Signal<TrackDisplay>;
  readonly $zoneCommands: Signal<ZoneCommands>;
  readonly $zoneProgression: Signal<ZoneProgression>;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._$zone = roonService.zoneState(settingsService.displayedZoneId());
    this.$trackDisplay = computed(
      () => {
        const { image_key, title, artist, disk } = this._$zone().nice_playing?.track ?? EMPTY_TRACK;
        return {
          image_key,
          title,
          artist,
          disk,
        };
      },
      {
        equal: deepEqual,
      }
    );
    this.$zoneCommands = computed(
      () => {
        const zs = this._$zone();
        const previousAlbum = ZoneCommandState.ABSENT;
        const previousTrack = zs.is_previous_allowed ? ZoneCommandState.ACTIVE : ZoneCommandState.DISABLED;
        let loading: ZoneCommandState;
        let pause: ZoneCommandState;
        let play: ZoneCommandState;
        switch (zs.state) {
          case "paused":
          case "stopped":
            loading = ZoneCommandState.ABSENT;
            pause = ZoneCommandState.ABSENT;
            play = zs.is_play_allowed ? ZoneCommandState.ACTIVE : ZoneCommandState.DISABLED;
            break;
          case "loading":
            loading = ZoneCommandState.ACTIVE;
            pause = ZoneCommandState.ABSENT;
            play = ZoneCommandState.ABSENT;
            break;
          case "playing":
            loading = ZoneCommandState.ABSENT;
            pause = zs.is_pause_allowed ? ZoneCommandState.ACTIVE : ZoneCommandState.ABSENT;
            play = ZoneCommandState.ABSENT;
            break;
        }
        const nextTrack = zs.is_next_allowed ? ZoneCommandState.ACTIVE : ZoneCommandState.DISABLED;
        const nextAlbum = ZoneCommandState.ABSENT;
        return {
          zoneId: zs.zone_id,
          previousAlbum,
          previousTrack,
          loading,
          play,
          pause,
          nextTrack,
          nextAlbum,
          outputs: zs.outputs,
        };
      },
      {
        equal: deepEqual,
      }
    );
    this.$zoneProgression = computed(() => {
      const track = this._$zone().nice_playing?.track ?? EMPTY_TRACK;
      if (track.length && track.seek_position) {
        return {
          length: track.length,
          position: track.seek_position,
          percentage: track.seek_percentage ?? 0,
        };
      }
      return DEFAULT_ZONE_PROGRESSION;
    });
  }
}
