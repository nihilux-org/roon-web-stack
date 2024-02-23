import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ZoneContainerComponent } from "@components/zone-container/zone-container.component";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { RoonState } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-root",
  standalone: true,
  imports: [CommonModule, ZoneContainerComponent, ZoneSelectorComponent, MatProgressSpinner],
  templateUrl: "./nr-root.component.html",
  styleUrl: "./nr-root.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NrRootComponent {
  private readonly _roonService: RoonService;
  private readonly _settingsService: SettingsService;
  readonly $hasSelectedZone: Signal<boolean>;
  readonly $state: Signal<RoonState>;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._roonService = roonService;
    this._settingsService = settingsService;
    this.$state = this._roonService.roonState();
    this.$hasSelectedZone = computed(() => {
      if (this.$state() === RoonState.SYNC) {
        const zones = this._roonService.zones()();
        const selectedZoneId = this._settingsService.displayedZoneId()();
        return !!zones.find((zd) => zd.zone_id === selectedZoneId);
      } else {
        return false;
      }
    });
  }
}
