import { ChangeDetectionStrategy, Component, Input, Signal } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { RoonBrowseDialogComponent } from "@components/roon-browse-dialog/roon-browse-dialog.component";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";
import { ZoneQueueDialogComponent } from "@components/zone-queue-dialog/zone-queue-dialog.component";
import { Action, ActionType, LoadAction, TrackDisplay } from "@model/client";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-actions",
  standalone: true,
  imports: [MatButton, MatIcon, MatIconButton],
  templateUrl: "./zone-actions.component.html",
  styleUrl: "./zone-actions.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneActionsComponent {
  @Input({ required: false }) $trackDisplay?: Signal<TrackDisplay>;
  private readonly _dialog: MatDialog;
  private readonly _settingsService: SettingsService;
  private readonly $isOneColumn: Signal<boolean>;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $actions: Signal<Action[]>;

  constructor(dialog: MatDialog, settingsService: SettingsService) {
    this._dialog = dialog;
    this._settingsService = settingsService;
    this.$isOneColumn = this._settingsService.isOneColumn();
    this.$isSmallScreen = this._settingsService.isSmallScreen();
    this.$actions = this._settingsService.actions();
  }

  executeAction(action: Action) {
    switch (action.type) {
      case ActionType.LOAD:
        this.openBrowseDialog(action);
        break;
      case ActionType.QUEUE:
        this.toggleDisplayQueueTrack();
        break;
    }
  }

  private openBrowseDialog(action: LoadAction) {
    const config: MatDialogConfig = {
      restoreFocus: false,
      data: {
        path: action.path,
      },
      autoFocus: action.id === "library-action" ? "input:first-of-type" : "button.roon-list-item:first-of-type",
      height: "90svh",
      maxHeight: "90svh",
      width: "90svw",
      maxWidth: "90svw",
    };
    if (this.$isOneColumn()) {
      config.height = "95svh";
      config.maxHeight = "95svh";
      config.width = "95svw";
      config.maxWidth = "95svw";
    }
    this._dialog.open(RoonBrowseDialogComponent, config);
  }

  openSettingsDialog() {
    this._dialog.open(SettingsDialogComponent, {
      restoreFocus: false,
      width: "500px",
      maxWidth: "95svw",
      maxHeight: "95svh",
    });
  }

  private toggleDisplayQueueTrack() {
    if (this.$isOneColumn()) {
      this._dialog.open(ZoneQueueDialogComponent, {
        restoreFocus: false,
        height: "95svh",
        maxHeight: "95svh",
        width: "95svw",
        maxWidth: "95svw",
        data: {
          $trackDisplay: this.$trackDisplay,
        },
      });
    } else {
      this._settingsService.toggleDisplayQueueTrack();
    }
  }
}
