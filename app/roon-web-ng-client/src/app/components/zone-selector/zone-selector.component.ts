import { deepEqual } from "fast-equals";
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Input,
  Signal,
  ViewChild,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { ApiState, ZoneDescription } from "@model";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";
import { IdleService } from "@services/idle.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-selector",
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: "./zone-selector.component.html",
  styleUrl: "./zone-selector.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneSelectorComponent {
  @Input({ required: false, transform: booleanAttribute }) withoutLabel: boolean;
  @Input({ required: false }) xPosition: "before" | "after";
  @Input({ required: false }) yPosition: "below" | "above";
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  private readonly _idleService: IdleService;
  private readonly _settingsService: SettingsService;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;
  private readonly _$zoneId: Signal<string>;
  private readonly _$roonState: Signal<ApiState>;
  readonly $label: Signal<string>;
  readonly $layoutClass: Signal<string>;
  readonly $zones: Signal<ZoneDescription[]>;

  constructor() {
    this._idleService = inject(IdleService);
    this._settingsService = inject(SettingsService);
    this._spatialNavigableService = inject(NgxSpatialNavigableService);
    this.withoutLabel = false;
    this.xPosition = "before";
    this.yPosition = "above";
    this._$zoneId = this._settingsService.displayedZoneId();
    this._$roonState = inject(RoonService).roonState();
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
    this.$layoutClass = this._settingsService.displayModeClass();
    effect(() => {
      if (this._idleService.isIdle()()) {
        this.menuTrigger.closeMenu();
      }
    });
  }

  onZoneSelected(selectedZoneId: string) {
    this._settingsService.saveDisplayedZoneId(selectedZoneId);
  }

  onSelectorOpen() {
    this._spatialNavigableService.suspendSpatialNavigation();
  }

  onSelectorClose() {
    this._spatialNavigableService.resumeSpatialNavigation();
  }
}
