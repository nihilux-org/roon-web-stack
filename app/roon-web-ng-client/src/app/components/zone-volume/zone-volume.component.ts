import { ChangeDetectionStrategy, Component, Input, Signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { ZoneTransferDialogComponent } from "@components/zone-transfer-dialog/zone-transfer-dialog.component";
import { CommandType, MuteCommand, MuteType, VolumeCommand, VolumeStrategy } from "@model";
import { ZoneCommands } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-volume",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatSliderModule, MatDivider],
  templateUrl: "./zone-volume.component.html",
  styleUrl: "./zone-volume.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneVolumeComponent {
  @Input({ required: true }) zoneCommands!: ZoneCommands;
  private readonly _dialog: MatDialog;
  private readonly _roonService: RoonService;
  readonly $isSmallScreen: Signal<boolean>;

  constructor(dialog: MatDialog, roonService: RoonService, settingsService: SettingsService) {
    this._dialog = dialog;
    this._roonService = roonService;
    this.$isSmallScreen = settingsService.isSmallScreen();
  }

  onVolumeStep(event: MouseEvent, output_id: string, decrement?: boolean) {
    event.stopPropagation();
    const output = this.zoneCommands.outputs.find((o) => o.output_id === output_id);
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
    const output = this.zoneCommands.outputs.find((o) => o.output_id === output_id);
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
    const output = this.zoneCommands.outputs.find((o) => o.output_id === output_id);
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

  isMuted() {
    if (this.zoneCommands.outputs.length > 1) {
      return this.zoneCommands.outputs.reduce((isMuted, output) => isMuted && (output.volume?.is_muted ?? false), true);
    } else if (this.zoneCommands.outputs.length === 1) {
      return this.zoneCommands.outputs[0].volume?.is_muted ?? false;
    } else {
      return false;
    }
  }

  onOpenTransferDialog() {
    this._dialog.open(ZoneTransferDialogComponent);
  }
}
