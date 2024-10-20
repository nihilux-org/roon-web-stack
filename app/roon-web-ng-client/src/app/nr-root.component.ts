import { deepEqual } from "fast-equals";
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, EffectRef, OnDestroy, Signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ExtensionNotEnabledComponent } from "@components/extension-not-enabled/extension-not-enabled.component";
import { FullScreenToggleComponent } from "@components/full-screen-toggle/full-screen-toggle.component";
import { ZoneContainerComponent } from "@components/zone-container/zone-container.component";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { RoonState } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-root",
  standalone: true,
  imports: [
    CommonModule,
    ExtensionNotEnabledComponent,
    MatProgressSpinner,
    ZoneContainerComponent,
    ZoneSelectorComponent,
    FullScreenToggleComponent,
  ],
  templateUrl: "./nr-root.component.html",
  styleUrl: "./nr-root.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NrRootComponent implements OnDestroy {
  private readonly _matDialog: MatDialog;
  private readonly _closeDialogsEffect: EffectRef;
  readonly $clientState: Signal<string>;
  readonly $isWithFullScreen: Signal<boolean>;

  constructor(roonService: RoonService, settingsService: SettingsService, matDialog: MatDialog) {
    this._matDialog = matDialog;
    const $displayedZoneId = settingsService.displayedZoneId();
    const $apiState = roonService.roonState();
    const $isGrouping = roonService.isGrouping();
    this.$clientState = computed(
      () => {
        const { state, zones } = $apiState();
        if (state === RoonState.SYNC) {
          if ($isGrouping()) {
            return "GROUPING";
          }
          const displayedZonedId = $displayedZoneId();
          if (zones.findIndex((zd) => zd.zone_id === displayedZonedId) === -1) {
            return "NEED_SELECTION";
          }
        }
        return state;
      },
      {
        equal: deepEqual,
      }
    );
    const $isOneColumn = settingsService.isOneColumn();
    this.$isWithFullScreen = computed(() => !$isOneColumn());
    this._closeDialogsEffect = effect(() => {
      this.$clientState();
      this._matDialog.closeAll();
    });
  }

  ngOnDestroy() {
    this._closeDialogsEffect.destroy();
  }
}
