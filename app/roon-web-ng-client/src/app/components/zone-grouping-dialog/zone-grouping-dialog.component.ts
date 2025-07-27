import { ChangeDetectionStrategy, Component, inject, Signal, signal, WritableSignal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { CommandCallback } from "@model";
import {
  NgxSpatialNavigableElementDirective,
  NgxSpatialNavigableStarterDirective,
} from "@nihilux/ngx-spatial-navigable";
import { CommandResult, CommandType, GroupCommand, OutputDescription } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

export interface GroupOutputDescription extends OutputDescription {
  state: "checked" | "indeterminate" | "none";
}

@Component({
  selector: "nr-zone-grouping-dialog",
  imports: [
    MatButton,
    MatCheckbox,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatDivider,
    MatIcon,
    NgxSpatialNavigableStarterDirective,
    NgxSpatialNavigableElementDirective,
  ],
  templateUrl: "./zone-grouping-dialog.component.html",
  styleUrl: "./zone-grouping-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneGroupingDialogComponent {
  private readonly _dialogRef: MatDialogRef<ZoneGroupingDialogComponent>;
  private readonly _roonService: RoonService;
  private readonly _settingsService: SettingsService;
  readonly mainOutput: OutputDescription;
  readonly $groupedOutputs: WritableSignal<GroupOutputDescription[]>;
  readonly $canGroupOutputs: WritableSignal<GroupOutputDescription[]>;
  readonly $isSmallScreen: Signal<boolean>;

  constructor() {
    this._dialogRef = inject<MatDialogRef<ZoneGroupingDialogComponent>>(MatDialogRef);
    this._roonService = inject(RoonService);
    this._settingsService = inject(SettingsService);
    const outputs = this._roonService.roonState()().outputs;
    const zoneState = this._roonService.zoneState(this._settingsService.displayedZoneId())();
    // safe because the ZoneGroupingDialogComponent can't be open if current zone hasn't at least 1 output
    this.mainOutput = zoneState.outputs[0];
    this.$groupedOutputs = signal(
      zoneState.outputs
        .filter((o) => o.output_id !== this.mainOutput.output_id)
        .map(
          (o) =>
            ({
              ...o,
              state: "checked",
            }) as GroupOutputDescription
        )
        .sort((o1, o2) => o1.display_name.localeCompare(o2.display_name))
    );
    this.$canGroupOutputs = signal(
      zoneState.outputs[0].can_group_with_output_ids
        .filter(
          (output_id) =>
            output_id !== this.mainOutput.output_id &&
            zoneState.outputs.findIndex((o) => o.output_id === output_id) === -1
        )
        .map((output_id) => {
          const output = outputs.find((o) => o.output_id === output_id);
          if (output) {
            return {
              ...output,
              state: "none",
            } as GroupOutputDescription;
          } else {
            throw new Error("this is a bug!");
          }
        })
        .sort((o1, o2) => o1.display_name.localeCompare(o2.display_name))
    );
    this.$isSmallScreen = this._settingsService.isSmallScreen();
  }

  toggleGroupedOutput(index: number) {
    this.$groupedOutputs.update((groupedOutputs) => {
      const output = groupedOutputs[index];
      if (output.state === "checked") {
        output.state = "indeterminate";
      } else {
        output.state = "checked";
      }
      return groupedOutputs;
    });
  }

  toggleCanGroupedOutput(index: number) {
    this.$canGroupOutputs.update((canGroupOutputs) => {
      const output = canGroupOutputs[index];
      if (output.state === "checked") {
        output.state = "none";
      } else {
        output.state = "checked";
      }
      return canGroupOutputs;
    });
  }

  onSave() {
    this._dialogRef.close();
    let hasChanged = this.$groupedOutputs().reduce((acc, od) => acc || od.state === "indeterminate", false);
    hasChanged = hasChanged || this.$canGroupOutputs().reduce((acc, od) => acc || od.state === "checked", false);
    if (hasChanged) {
      const outputsToGroup: OutputDescription[] = [this.mainOutput];
      const outputToUngroup: OutputDescription[] = [this.mainOutput];
      for (const go of this.$groupedOutputs()) {
        if (go.state === "checked") {
          outputsToGroup.push(go);
        } else if (go.state === "indeterminate") {
          outputToUngroup.push(go);
        }
      }
      for (const go of this.$canGroupOutputs()) {
        if (go.state === "checked") {
          outputsToGroup.push(go);
        }
      }
      const commands: GroupCommand[] = [];
      if (outputToUngroup.length > 1) {
        commands.push({
          type: CommandType.GROUP,
          data: {
            outputs: outputToUngroup,
            mode: "ungroup",
          },
        });
      }
      if (outputsToGroup.length > 1) {
        commands.push({
          type: CommandType.GROUP,
          data: {
            outputs: outputsToGroup,
            mode: "group",
          },
        });
      }
      if (commands.length > 0) {
        const output_id = this.mainOutput.output_id;
        for (const [idx, command] of commands.entries()) {
          this._roonService.command(command, this.buildCommandCallback(idx, commands.length, output_id));
        }
      }
    }
  }

  private buildCommandCallback(idx: number, total: number, output_id: string): CommandCallback {
    if (total > 1 && idx === 0) {
      return (commandState) => {
        if (commandState.state === CommandResult.APPLIED) {
          this._roonService.startGrouping();
        }
      };
    } else if (total > 1 && idx === 1) {
      return (commandState) => {
        if (commandState.state === CommandResult.APPLIED) {
          this._roonService.registerOutputCallback((outputs) => {
            const zone_id = outputs.find((o) => o.output_id === output_id)?.zone_id;
            if (zone_id) {
              this._settingsService.saveDisplayedZoneId(zone_id);
            }
            this._roonService.endGrouping();
          });
        } else {
          this._roonService.endGrouping();
        }
      };
    } else {
      return (commandState) => {
        if (commandState.state === CommandResult.APPLIED) {
          this._roonService.startGrouping();
          this._roonService.registerOutputCallback((outputs) => {
            const zone_id = outputs.find((o) => o.output_id === output_id)?.zone_id;
            if (zone_id) {
              this._settingsService.saveDisplayedZoneId(zone_id);
            }
            this._roonService.endGrouping();
          });
        }
      };
    }
  }
}
