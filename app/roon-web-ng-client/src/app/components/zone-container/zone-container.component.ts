import { deepEqual } from "fast-equals";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { ZoneActionsComponent } from "@components/zone-actions/zone-actions.component";
import { ZoneCommandsComponent } from "@components/zone-commands/zone-commands.component";
import { ZoneCurrentTrackComponent } from "@components/zone-current-track/zone-current-track.component";
import { ZoneImageComponent } from "@components/zone-image/zone-image.component";
import { CompactLayoutComponent } from "@components/zone-layouts/compact-layout/compact-layout.component";
import { OneColumnLayoutComponent } from "@components/zone-layouts/one-column-layout/one-column-layout.component";
import { TenFeetLayoutComponent } from "@components/zone-layouts/ten-feet-layout/ten-feet-layout.component";
import { WideLayoutComponent } from "@components/zone-layouts/wide-layout/wide-layout.component";
import { ZoneProgressionComponent } from "@components/zone-progression/zone-progression.component";
import { ZoneQueueComponent } from "@components/zone-queue/zone-queue.component";
import { ZoneVolumeComponent } from "@components/zone-volume/zone-volume.component";
import { SpatialNavigableContainerDirective } from "@directives/spatial-navigable-container.directive";
import { ZoneState } from "@model";
import {
  DEFAULT_ZONE_PROGRESSION,
  DisplayMode,
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
  imports: [
    CompactLayoutComponent,
    OneColumnLayoutComponent,
    WideLayoutComponent,
    ZoneActionsComponent,
    ZoneCommandsComponent,
    ZoneCurrentTrackComponent,
    ZoneImageComponent,
    ZoneProgressionComponent,
    ZoneQueueComponent,
    ZoneVolumeComponent,
    SpatialNavigableContainerDirective,
    TenFeetLayoutComponent,
  ],
  templateUrl: "./zone-container.component.html",
  styleUrl: "./zone-container.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneContainerComponent {
  private readonly _settingsService: SettingsService;
  private readonly _$zone: Signal<ZoneState>;
  readonly $trackDisplay: Signal<TrackDisplay>;
  readonly $zoneCommands: Signal<ZoneCommands>;
  readonly $zoneProgression: Signal<ZoneProgression>;
  readonly $isOneColumn: Signal<boolean>;
  readonly $layout: Signal<DisplayMode>;
  readonly $layoutClass: Signal<string>;
  readonly DisplayMode = DisplayMode;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._settingsService = settingsService;
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
    this.$isOneColumn = this._settingsService.isOneColumn();
    this.$layout = computed(() => {
      if (this.$isOneColumn()) {
        return DisplayMode.ONE_COLUMN;
      } else {
        return this._settingsService.displayMode()();
      }
    });
    this.$layoutClass = this._settingsService.displayModeClass();
  }
}
