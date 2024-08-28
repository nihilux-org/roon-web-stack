import { deepEqual } from "fast-equals";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatDialog, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { MatSlider, MatSliderThumb } from "@angular/material/slider";
import { ZoneGroupingDialogComponent } from "@components/zone-grouping-dialog/zone-grouping-dialog.component";
import { ZoneTransferDialogComponent } from "@components/zone-transfer-dialog/zone-transfer-dialog.component";
import {
  CommandType,
  MuteCommand,
  MuteGroupedZoneCommand,
  MuteType,
  Output,
  VolumeCommand,
  VolumeGroupedZoneCommand,
  VolumeStrategy,
} from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

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
  private readonly _roonService: RoonService;
  private readonly _$layoutClass: Signal<string>;
  readonly $outputs: Signal<Output[]>;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $canGroup: Signal<boolean>;
  readonly $isGroup: Signal<boolean>;
  readonly $isGroupedZoneMute: Signal<boolean>;

  constructor(
    dialog: MatDialog,
    dialogRef: MatDialogRef<ZoneVolumeDialogComponent>,
    roonService: RoonService,
    settingsService: SettingsService
  ) {
    this._dialog = dialog;
    this._dialogRef = dialogRef;
    this._roonService = roonService;
    this._$layoutClass = settingsService.displayModeClass();
    const $displayedZoneId = settingsService.displayedZoneId();
    this.$outputs = computed(
      () => {
        const $zone = roonService.zoneState($displayedZoneId);
        return $zone().outputs.sort((o1, o2) => o1.display_name.localeCompare(o2.display_name));
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
    this.$isGroup = computed(() => this.$outputs().length > 1);
    this.$isGroupedZoneMute = computed(() => {
      return this.$outputs().reduce((isMuted, output) => isMuted && (output.volume?.is_muted ?? false), true);
    });
  }

  onGroupedZoneStep(event: MouseEvent, decrement: boolean) {
    event.stopPropagation();
    const command: VolumeGroupedZoneCommand = {
      type: CommandType.VOLUME_GROUPED_ZONE,
      data: {
        zone_id: this.$outputs()[0].zone_id,
        decrement,
      },
    };
    this._roonService.command(command);
  }

  onGroupedZoneMute(event: MouseEvent) {
    event.stopPropagation();
    const type: MuteType = this.$isGroupedZoneMute() ? MuteType.UN_MUTE : MuteType.MUTE;
    const command: MuteGroupedZoneCommand = {
      type: CommandType.MUTE_GROUPED_ZONE,
      data: {
        zone_id: this.$outputs()[0].zone_id,
        type,
      },
    };
    this._roonService.command(command);
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
          strategy: VolumeStrategy.RELATIVE,
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
