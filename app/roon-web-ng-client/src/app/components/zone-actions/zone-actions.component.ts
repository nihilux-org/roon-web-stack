import { ChangeDetectionStrategy, Component, computed, Input, Signal, TemplateRef } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { FullScreenToggleComponent } from "@components/full-screen-toggle/full-screen-toggle.component";
import { RoonBrowseDialogComponent } from "@components/roon-browse-dialog/roon-browse-dialog.component";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";
import { ZoneQueueDialogComponent } from "@components/zone-queue-dialog/zone-queue-dialog.component";
import { Action, ActionType, LayoutContext, LoadAction, TrackDisplay } from "@model/client";
import { FullscreenService } from "@services/fullscreen.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-actions",
  standalone: true,
  imports: [MatButton, MatIcon, MatIconButton, FullScreenToggleComponent],
  templateUrl: "./zone-actions.component.html",
  styleUrl: "./zone-actions.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneActionsComponent {
  @Input({ required: true }) $trackDisplay!: Signal<TrackDisplay>;
  @Input({ required: true }) queueComponentTemplateRef!: TemplateRef<LayoutContext>;
  private readonly _dialog: MatDialog;
  private readonly _settingsService: SettingsService;
  private readonly _$isOneColumn: Signal<boolean>;
  private readonly _$isSmallTablet: Signal<boolean>;
  readonly $isIconsOnly: Signal<boolean>;
  readonly $actions: Signal<Action[]>;
  readonly $withFullscreen: Signal<boolean>;

  constructor(dialog: MatDialog, settingsService: SettingsService, fullScreenService: FullscreenService) {
    this._dialog = dialog;
    this._settingsService = settingsService;
    this._$isOneColumn = this._settingsService.isOneColumn();
    this._$isSmallTablet = this._settingsService.isSmallTablet();
    const $isSmallScreen = this._settingsService.isSmallScreen();
    this.$isIconsOnly = computed(() => {
      return $isSmallScreen() || this._$isSmallTablet();
    });
    this.$actions = this._settingsService.actions();
    const supportsFullScreen = fullScreenService.supportsFullScreen();
    this.$withFullscreen = computed(() => {
      return supportsFullScreen && this._$isOneColumn();
    });
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
    if (this._$isOneColumn()) {
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
    if (this._$isOneColumn() || this._$isSmallTablet()) {
      this._settingsService.saveDisplayQueueTrack(true);
      this._dialog.open(ZoneQueueDialogComponent, {
        restoreFocus: false,
        height: "95svh",
        maxHeight: "95svh",
        width: "95svw",
        maxWidth: "95svw",
        data: {
          $trackDisplay: this.$trackDisplay,
          queueComponentTemplateRef: this.queueComponentTemplateRef,
        },
      });
    } else {
      this._settingsService.toggleDisplayQueueTrack();
    }
  }
}
