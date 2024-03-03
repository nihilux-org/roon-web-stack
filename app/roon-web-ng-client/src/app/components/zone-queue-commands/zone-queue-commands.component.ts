import { ChangeDetectionStrategy, Component, Signal } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { RoonBrowseDialogComponent } from "@components/roon-browse-dialog/roon-browse-dialog.component";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-queue-commands",
  standalone: true,
  imports: [MatButton, MatIcon, MatIconButton],
  templateUrl: "./zone-queue-commands.component.html",
  styleUrl: "./zone-queue-commands.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneQueueCommandsComponent {
  private readonly _dialog: MatDialog;
  private readonly _settingsService: SettingsService;
  readonly $isOneColumn: Signal<boolean>;

  constructor(dialog: MatDialog, settingsService: SettingsService) {
    this._dialog = dialog;
    this._settingsService = settingsService;
    this.$isOneColumn = this._settingsService.isOneColumn();
  }

  openBrowseDialog(firstPage: string) {
    this._dialog.open(RoonBrowseDialogComponent, {
      restoreFocus: false,
      data: {
        firstPage,
      },
      autoFocus: firstPage === "library" ? "input:first-of-type" : "button.roon-list-item:first-of-type",
    });
  }

  openSettingsDialog() {
    this._dialog.open(SettingsDialogComponent, {
      restoreFocus: false,
    });
  }

  toggleDisplayQueueTrack() {
    this._settingsService.toggleDisplayQueueTrack();
  }
}
