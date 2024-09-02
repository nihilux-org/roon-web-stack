import { ChangeDetectionStrategy, Component, Signal, ViewChild } from "@angular/core";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatRipple } from "@angular/material/core";
import { MatDivider } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { ZoneVolumeDialogComponent } from "@components/zone-volume-dialog/zone-volume-dialog.component";
import { DisplayMode } from "@model/client";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";

@Component({
  selector: "nr-zone-volume",
  standalone: true,
  imports: [MatButtonModule, MatDivider, MatIconModule, MatMenuModule, MatSliderModule, MatRipple],
  templateUrl: "./zone-volume.component.html",
  styleUrl: "./zone-volume.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneVolumeComponent {
  @ViewChild("volumeButton") _volumeButton!: MatIconButton;
  private readonly _dialogService: DialogService;
  private readonly _volumeService: VolumeService;
  private readonly _$displayMode: Signal<DisplayMode>;
  private readonly _$isSmallScreen: Signal<boolean>;
  readonly $isMuted: Signal<boolean>;

  constructor(dialogService: DialogService, settingsService: SettingsService, volumeService: VolumeService) {
    this._dialogService = dialogService;
    this._volumeService = volumeService;
    this._$displayMode = settingsService.displayMode();
    this._$isSmallScreen = settingsService.isSmallScreen();
    this.$isMuted = this._volumeService.isMute();
  }

  onVolumeDrawerOpen() {
    const nbOutputs = this._volumeService.outputs()().length;
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
}
