import { deepEqual } from "fast-equals";
import { computed, inject, Injectable, Signal } from "@angular/core";
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

@Injectable({
  providedIn: "root",
})
export class VolumeService {
  private readonly _roonService: RoonService;
  private readonly _$displayedZoneId: Signal<string>;
  private readonly _$zoneOutputs: Signal<Output[]>;
  private readonly _$isGrouped: Signal<boolean>;
  private readonly _$isGroupedZoneMute: Signal<boolean>;
  private readonly _$canGroup: Signal<boolean>;
  private readonly _$isMute: Signal<boolean>;

  constructor() {
    this._roonService = inject(RoonService);
    this._$displayedZoneId = inject(SettingsService).displayedZoneId();
    this._$zoneOutputs = computed(
      () => {
        const $zone = this._roonService.zoneState(this._$displayedZoneId);
        return $zone().outputs.sort((o1, o2) => o1.display_name.localeCompare(o2.display_name));
      },
      {
        equal: deepEqual,
      }
    );
    this._$isGrouped = computed(() => {
      return this._$zoneOutputs().length > 1;
    });
    this._$isGroupedZoneMute = computed(() => {
      return this._$zoneOutputs().reduce((isMuted, output) => isMuted && (output.volume?.is_muted ?? false), true);
    });
    this._$canGroup = computed(() => {
      const outputs = this._$zoneOutputs();
      return outputs.length > 0 && outputs[0].can_group_with_output_ids.length > 0;
    });
    this._$isMute = computed(() => {
      if (this._$isGrouped()) {
        return this._$isGroupedZoneMute();
      } else {
        return this._$zoneOutputs()[0].volume?.is_muted ?? false;
      }
    });
  }

  outputs(): Signal<Output[]> {
    return this._$zoneOutputs;
  }

  isGroupedZoneMute(): Signal<boolean> {
    return this._$isGroupedZoneMute;
  }

  isGrouped(): Signal<boolean> {
    return this._$isGrouped;
  }

  isMute(): Signal<boolean> {
    return this._$isMute;
  }

  canGroup(): Signal<boolean> {
    return this._$canGroup;
  }

  groupedZoneVolumeStep(decrement: boolean) {
    const command: VolumeGroupedZoneCommand = {
      type: CommandType.VOLUME_GROUPED_ZONE,
      data: {
        zone_id: this._$zoneOutputs()[0].zone_id,
        decrement,
      },
    };
    this._roonService.command(command);
  }

  groupedZoneMuteToggle() {
    const type: MuteType = this._$isGroupedZoneMute() ? MuteType.UN_MUTE : MuteType.MUTE;
    const command: MuteGroupedZoneCommand = {
      type: CommandType.MUTE_GROUPED_ZONE,
      data: {
        zone_id: this._$zoneOutputs()[0].zone_id,
        type,
      },
    };
    this._roonService.command(command);
  }

  outputVolumeStep(output_id: string, decrement?: boolean) {
    const output = this.findOutput(output_id);
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

  outputVolumeValue(output_id: string, value: number) {
    const output = this.findOutput(output_id);
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

  outputMuteToggle(output_id: string) {
    const output = this.findOutput(output_id);
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

  private findOutput(output_id: string): Output | undefined {
    return this._$zoneOutputs().find((o) => o.output_id === output_id);
  }
}
