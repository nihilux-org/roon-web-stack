import { ChangeDetectionStrategy, Component, Signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatDialog, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { MatSlider, MatSliderThumb } from "@angular/material/slider";
import { ZoneGroupingDialogComponent } from "@components/zone-grouping-dialog/zone-grouping-dialog.component";
import { ZoneTransferDialogComponent } from "@components/zone-transfer-dialog/zone-transfer-dialog.component";
import { Output } from "@model";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";

@Component({
  selector: "nr-zone-volume-dialog",
  standalone: true,
  imports: [MatDialogContent, MatDialogTitle, MatDivider, MatIcon, MatIconButton, MatSlider, MatSliderThumb],
  templateUrl: "./zone-volume-dialog.component.html",
  styleUrl: "./zone-volume-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneVolumeDialogComponent {
  private readonly _dialog: MatDialog;
  private readonly _dialogRef: MatDialogRef<ZoneVolumeDialogComponent>;
  private readonly _volumeService: VolumeService;
  private readonly _$layoutClass: Signal<string>;
  readonly $outputs: Signal<Output[]>;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $canGroup: Signal<boolean>;
  readonly $isGroup: Signal<boolean>;
  readonly $isGroupedZoneMute: Signal<boolean>;

  constructor(
    dialog: MatDialog,
    dialogRef: MatDialogRef<ZoneVolumeDialogComponent>,
    settingsService: SettingsService,
    volumeService: VolumeService
  ) {
    this._dialog = dialog;
    this._dialogRef = dialogRef;
    this._volumeService = volumeService;
    this._$layoutClass = settingsService.displayModeClass();
    this.$outputs = this._volumeService.outputs();
    this.$isSmallScreen = settingsService.isSmallScreen();
    this.$canGroup = this._volumeService.canGroup();
    this.$isGroup = this._volumeService.isGrouped();
    this.$isGroupedZoneMute = this._volumeService.isGroupedZoneMute();
  }

  onGroupedZoneStep(event: MouseEvent, decrement: boolean) {
    event.stopPropagation();
    this._volumeService.groupedZoneVolumeStep(decrement);
  }

  onGroupedZoneMute(event: MouseEvent) {
    event.stopPropagation();
    this._volumeService.groupedZoneMuteToggle();
  }

  onVolumeStep(event: MouseEvent, output_id: string, decrement?: boolean) {
    event.stopPropagation();
    this._volumeService.outputVolumeStep(output_id, decrement);
  }

  onOutputMute(event: MouseEvent, output_id: string) {
    event.stopPropagation();
    this._volumeService.outputMuteToggle(output_id);
  }

  onVolumeSliderChange(value: number, output_id: string) {
    this._volumeService.outputVolumeValue(output_id, value);
  }

  onOpenTransferDialog() {
    this._dialogRef.close();
    this._dialog.open(ZoneTransferDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: ["nr-dialog-custom", this._$layoutClass()],
    });
  }

  onOpenGroupDialog() {
    this._dialogRef.close();
    this._dialog.open(ZoneGroupingDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: ["nr-dialog-custom", this._$layoutClass()],
    });
  }
}
