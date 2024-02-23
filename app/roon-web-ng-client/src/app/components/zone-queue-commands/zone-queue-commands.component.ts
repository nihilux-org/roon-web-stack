import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { RoonBrowseDialogComponent } from "@components/roon-browse-dialog/roon-browse-dialog.component";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";

@Component({
  selector: "nr-zone-queue-commands",
  standalone: true,
  imports: [MatButton, MatIcon],
  templateUrl: "./zone-queue-commands.component.html",
  styleUrl: "./zone-queue-commands.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneQueueCommandsComponent {
  constructor(private _dialog: MatDialog) {}

  openBrowseDialog(firstPage: string) {
    this._dialog.open(RoonBrowseDialogComponent, {
      restoreFocus: false,
      data: {
        firstPage,
      },
      autoFocus: "input:first-of-type",
    });
  }

  openSettingsDialog() {
    this._dialog.open(SettingsDialogComponent, {
      restoreFocus: false,
    });
  }
}
