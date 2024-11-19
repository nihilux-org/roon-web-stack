import { ChangeDetectionStrategy, Component, Signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { CommandResult, CommandType, TransferZoneCommand, ZoneDescription } from "@model";
import { CommandCallback } from "@model/client";
import {
  NgxSpatialNavigableContainerDirective,
  NgxSpatialNavigableStarterDirective,
} from "@nihilux/ngx-spatial-navigable";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-transfer-dialog",
  standalone: true,
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatDivider,
    MatIcon,
    NgxSpatialNavigableContainerDirective,
    NgxSpatialNavigableStarterDirective,
  ],
  templateUrl: "./zone-transfer-dialog.component.html",
  styleUrl: "./zone-transfer-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneTransferDialogComponent {
  private readonly _dialogRef: MatDialogRef<ZoneTransferDialogComponent>;
  private readonly _roonService: RoonService;
  private readonly _settingsService: SettingsService;
  private readonly _currentZoneId: string;
  readonly currentZone: string;
  readonly transferableZones: ZoneDescription[];
  readonly $isSmallScreen: Signal<boolean>;

  constructor(
    dialogRef: MatDialogRef<ZoneTransferDialogComponent>,
    roonService: RoonService,
    settingsService: SettingsService
  ) {
    this._dialogRef = dialogRef;
    this._roonService = roonService;
    this._settingsService = settingsService;
    this._currentZoneId = this._settingsService.displayedZoneId()();
    const zones = this._roonService.roonState()().zones;
    this.currentZone =
      zones.find((zd) => {
        return zd.zone_id === this._currentZoneId;
      })?.display_name ?? "";
    this.transferableZones = zones.filter((zd) => {
      return zd.zone_id !== this._currentZoneId;
    });
    this.$isSmallScreen = this._settingsService.isSmallScreen();
  }

  onTransferZoneSelected(to_zone_id: string) {
    const commandCallback: CommandCallback = (commandState) => {
      if (commandState.state === CommandResult.APPLIED) {
        this._settingsService.saveDisplayedZoneId(to_zone_id);
      }
    };
    const command: TransferZoneCommand = {
      type: CommandType.TRANSFER_ZONE,
      data: {
        zone_id: this._currentZoneId,
        to_zone_id,
      },
    };
    this._dialogRef.close();
    this._roonService.command(command, commandCallback);
  }

  onCancel() {
    this._dialogRef.close();
  }
}
