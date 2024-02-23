import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { CommandType, MuteCommand, MuteType, Output, VolumeCommand, VolumeStrategy } from "@model";
import { RoonService } from "@services/roon.service";

@Component({
  selector: "nr-zone-volume",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatSliderModule],
  templateUrl: "./zone-volume.component.html",
  styleUrl: "./zone-volume.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneVolumeComponent {
  @Input({ required: true }) outputs!: Output[];
  private readonly _roonService: RoonService;

  constructor(roonService: RoonService) {
    this._roonService = roonService;
  }

  onVolumeStep(event: MouseEvent, output_id: string, decrement?: boolean) {
    event.stopPropagation();
    const output = this.outputs.find((o) => o.output_id === output_id);
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
    const output = this.outputs.find((o) => o.output_id === output_id);
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
    const output = this.outputs.find((o) => o.output_id === output_id);
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
    if (this.outputs.length > 1) {
      return this.outputs.reduce((isMuted, output) => isMuted && (output.volume?.is_muted ?? false), true);
    } else if (this.outputs.length === 1) {
      return this.outputs[0].volume?.is_muted ?? false;
    } else {
      return false;
    }
  }
}
