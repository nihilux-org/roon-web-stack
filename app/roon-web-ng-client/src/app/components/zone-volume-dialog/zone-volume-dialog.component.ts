import { deepEqual } from "fast-equals";
import { Component, computed, Signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatDialog, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { MatSlider, MatSliderThumb } from "@angular/material/slider";
import { ZoneGroupingDialogComponent } from "@components/zone-grouping-dialog/zone-grouping-dialog.component";
import { ZoneTransferDialogComponent } from "@components/zone-transfer-dialog/zone-transfer-dialog.component";
import { CommandType, MuteCommand, MuteType, Output, VolumeCommand, VolumeStrategy } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-volume-dialog",
  standalone: true,
  imports: [MatDialogContent, MatDivider, MatIcon, MatIconButton, MatSlider, MatSliderThumb],
  templateUrl: "./zone-volume-dialog.component.html",
  styleUrl: "./zone-volume-dialog.component.scss",
})
export class ZoneVolumeDialogComponent {
  private readonly _dialog: MatDialog;
  private readonly _dialogRef: MatDialogRef<ZoneVolumeDialogComponent>;
  private readonly _roonService: RoonService;
  readonly $outputs: Signal<Output[]>;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $canGroup: Signal<boolean>;

  constructor(
    dialog: MatDialog,
    dialogRef: MatDialogRef<ZoneVolumeDialogComponent>,
    roonService: RoonService,
    settingsService: SettingsService
  ) {
    this._dialog = dialog;
    this._dialogRef = dialogRef;
    this._roonService = roonService;
    const $displayedZoneId = settingsService.displayedZoneId();
    this.$outputs = computed(
      () => {
        const $zone = roonService.zoneState($displayedZoneId);
        return $zone().outputs;
      },
      {
        equal: deepEqual,
      }
    );
    this.$isSmallScreen = settingsService.isSmallScreen();
    this.$canGroup = computed(() => {
      const outputs = this.$outputs();
      return outputs.length > 0 && outputs[0].can_group_with_output_ids.length > 0;
    });
  }

  onVolumeStep(event: MouseEvent, output_id: string, decrement?: boolean) {
    event.stopPropagation();
    const output = this.$outputs().find((o) => o.output_id === output_id);
    if (output?.volume) {
      const value = (output.volume.step ?? 1) * (decrement ? -1 : 1);
      const command: VolumeCommand = {
        type: CommandType.VOLUME,
        data: {
          zone_id: output.zone_id,
          output_id,
          strategy: VolumeStrategy.RELATIVE_STEP,
          value,
        },
      };
      this._roonService.command(command);
    }
  }

  onOutputMute(event: MouseEvent, output_id: string) {
    event.stopPropagation();
    const output = this.$outputs().find((o) => o.output_id === output_id);
    if (output?.volume) {
      const command: MuteCommand = {
        type: CommandType.MUTE,
        data: {
          zone_id: output.zone_id,
          output_id,
          type: MuteType.TOGGLE,
        },
      };
      this._roonService.command(command);
    }
  }

  onVolumeSliderChange(value: number, output_id: string) {
    const output = this.$outputs().find((o) => o.output_id === output_id);
    if (output?.volume) {
      const command: VolumeCommand = {
        type: CommandType.VOLUME,
        data: {
          zone_id: output.zone_id,
          output_id,
          value,
          strategy: VolumeStrategy.ABSOLUTE,
        },
      };
      this._roonService.command(command);
    }
  }

  onOpenTransferDialog() {
    this._dialogRef.close();
    this._dialog.open(ZoneTransferDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
    });
  }

  onOpenGroupDialog() {
    this._dialogRef.close();
    this._dialog.open(ZoneGroupingDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
    });
  }
}
