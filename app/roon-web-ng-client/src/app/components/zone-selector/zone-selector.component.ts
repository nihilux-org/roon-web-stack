import { deepEqual } from "fast-equals";
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, Input, Signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { ApiState, ZoneDescription } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-selector",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: "./zone-selector.component.html",
  styleUrl: "./zone-selector.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneSelectorComponent {
  @Input({ required: false, transform: booleanAttribute }) withoutLabel: boolean;
  @Input({ required: false }) xPosition: "before" | "after";
  @Input({ required: false }) yPosition: "below" | "above";
  private readonly _settingsService: SettingsService;
  private readonly _$zoneId: Signal<string>;
  private readonly _$roonState: Signal<ApiState>;
  readonly $zones: Signal<ZoneDescription[]>;
  readonly $label: Signal<string>;

  constructor(roonService: RoonService, settingsService: SettingsService) {
    this._settingsService = settingsService;
    this.withoutLabel = false;
    this.xPosition = "before";
    this.yPosition = "above";
    this._$zoneId = this._settingsService.displayedZoneId();
    this._$roonState = roonService.roonState();
    this.$zones = computed(
      () => {
        return this._$roonState().zones;
      },
      {
        equal: deepEqual,
      }
    );
    this.$label = computed(() => {
      const zoneId = this._$zoneId();
      return this.$zones().find((zd: ZoneDescription) => zd.zone_id === zoneId)?.display_name ?? "Zones";
    });
  }

  onZoneSelected(selectedZoneId: string) {
    this._settingsService.saveDisplayedZoneId(selectedZoneId);
  }
}
