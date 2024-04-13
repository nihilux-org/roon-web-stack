import { deepEqual } from "fast-equals";
import { ChangeDetectionStrategy, Component, computed, Input, Signal, ViewChild } from "@angular/core";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { ZoneVolumeDialogComponent } from "@components/zone-volume-dialog/zone-volume-dialog.component";
import { Output } from "@model";
import { DisplayMode } from "@model/client";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-volume",
  standalone: true,
  imports: [MatButtonModule, MatDivider, MatIconModule, MatMenuModule, MatSliderModule],
  templateUrl: "./zone-volume.component.html",
  styleUrl: "./zone-volume.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneVolumeComponent {
  @Input({ required: true }) $outputs!: Signal<Output[]>;
  @ViewChild("volumeButton") _volumeButton!: MatIconButton;
  private readonly _dialog: MatDialog;
  private readonly _$displayMode: Signal<DisplayMode>;
  private readonly _$isSmallScreen: Signal<boolean>;
  readonly $isMuted: Signal<boolean>;

  constructor(dialog: MatDialog, settingsService: SettingsService) {
    this._dialog = dialog;
    this._$displayMode = settingsService.displayMode();
    this._$isSmallScreen = settingsService.isSmallScreen();
    this.$isMuted = computed(
      () => {
        const outputs = this.$outputs();
        if (outputs.length > 1) {
          return outputs.reduce((isMuted, output) => isMuted && (output.volume?.is_muted ?? false), true);
        } else if (outputs.length === 1) {
          return outputs[0].volume?.is_muted ?? false;
        } else {
          return false;
        }
      },
      {
        equal: deepEqual,
      }
    );
  }

  isMuted() {}

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
      this._dialog.open(ZoneVolumeDialogComponent, {
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
