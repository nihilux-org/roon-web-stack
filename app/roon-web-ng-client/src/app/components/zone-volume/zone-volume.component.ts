import { ChangeDetectionStrategy, Component, computed, inject, Signal, ViewChild } from "@angular/core";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatRipple } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { ZoneGroupingDialogComponent } from "@components/zone-grouping-dialog/zone-grouping-dialog.component";
import { ZoneTransferDialogComponent } from "@components/zone-transfer-dialog/zone-transfer-dialog.component";
import { ZoneVolumeDialogComponent } from "@components/zone-volume-dialog/zone-volume-dialog.component";
import { DisplayMode } from "@model";
import { NgxSpatialNavigableContainerDirective } from "@nihilux/ngx-spatial-navigable";
import { Output } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";

@Component({
  selector: "nr-zone-volume",
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSliderModule,
    MatRipple,
    NgxSpatialNavigableContainerDirective,
  ],
  templateUrl: "./zone-volume.component.html",
  styleUrl: "./zone-volume.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneVolumeComponent {
  @ViewChild("volumeButton") _volumeButton!: MatIconButton;
  private readonly _dialogService: DialogService;
  private readonly _settingsService: SettingsService;
  private readonly _volumeService: VolumeService;
  private readonly _$displayMode: Signal<DisplayMode>;
  private readonly _$isSmallScreen: Signal<boolean>;
  readonly $canGroup: Signal<boolean>;
  readonly $isGrouped: Signal<boolean>;
  readonly $isIconOnly: Signal<boolean>;
  readonly $isMuted: Signal<boolean>;
  readonly $outputs: Signal<Output[]>;

  constructor() {
    this._dialogService = inject(DialogService);
    this._settingsService = inject(SettingsService);
    this._volumeService = inject(VolumeService);
    this._$displayMode = this._settingsService.displayMode();
    this._$isSmallScreen = this._settingsService.isSmallScreen();
    this.$canGroup = this._volumeService.canGroup();
    this.$isGrouped = this._volumeService.isGrouped();
    this.$isIconOnly = computed(() => {
      return this._settingsService.displayMode()() !== DisplayMode.TEN_FEET;
    });
    this.$isMuted = this._volumeService.isMute();
    this.$outputs = this._volumeService.outputs();
  }

  onVolumeDrawerOpen() {
    const nbOutputs = this.$outputs().length;
    if (nbOutputs > 0) {
      const buttonElementRect = (
        this._volumeButton._elementRef.nativeElement as HTMLButtonElement
      ).getBoundingClientRect();
      // FIXME? this must be updated if CSS changes... but it's efficient 🤷
      let topDelta: number;
      if (nbOutputs === 1) {
        topDelta = 127;
      } else {
        topDelta = 58 + nbOutputs * 117;
      }
      this._dialogService.open(ZoneVolumeDialogComponent, {
        position: {
          top: `${Math.max(buttonElementRect.top - topDelta, 0)}px`,
          left: this._$isSmallScreen() ? "1%" : `${buttonElementRect.left}px`,
        },
        width: this._$isSmallScreen() ? "98svw" : this._$displayMode() === DisplayMode.COMPACT ? "48svw" : "500px",
        maxWidth: "500px",
        maxHeight: "99svh",
        restoreFocus: false,
        autoFocus: false,
      });
    }
  }

  onGroupedVolumeStep(decrement: boolean) {
    this._volumeService.groupedZoneVolumeStep(decrement);
  }

  onGroupedMuteToggle(): void {
    this._volumeService.groupedZoneMuteToggle();
  }

  onVolumeStep(output_id: string, decrement: boolean) {
    this._volumeService.outputVolumeStep(output_id, decrement);
  }

  onMuteToggle(output_id: string) {
    this._volumeService.outputMuteToggle(output_id);
  }

  onOpenTransferDialog() {
    this._dialogService.open(ZoneTransferDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
    });
  }

  onOpenGroupDialog() {
    this._dialogService.open(ZoneGroupingDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
    });
  }
}
