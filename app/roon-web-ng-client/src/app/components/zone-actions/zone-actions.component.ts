import { ChangeDetectionStrategy, Component, computed, Input, Signal, TemplateRef } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDialogConfig } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { FullScreenToggleComponent } from "@components/full-screen-toggle/full-screen-toggle.component";
import { RoonBrowseDialogComponent } from "@components/roon-browse-dialog/roon-browse-dialog.component";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";
import { ZoneQueueDialogComponent } from "@components/zone-queue-dialog/zone-queue-dialog.component";
import {
  Action,
  ActionType,
  CustomAction,
  LayoutContext,
  LoadAction,
  SettingsDialogConfig,
  TrackDisplay,
} from "@model/client";
import { DialogService } from "@services/dialog.service";
import { FullscreenService } from "@services/fullscreen.service";
import { RoonService } from "@services/roon.service";
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
  private readonly _dialogService: DialogService;
  private readonly _settingsService: SettingsService;
  private readonly _roonService: RoonService;
  private readonly _$isOneColumn: Signal<boolean>;
  private readonly _$isSmallTablet: Signal<boolean>;
  private readonly _$isQueueInModal: Signal<boolean>;
  readonly $isIconsOnly: Signal<boolean>;
  readonly $actions: Signal<Action[]>;
  readonly $withFullscreen: Signal<boolean>;

  constructor(
    dialogService: DialogService,
    fullScreenService: FullscreenService,
    roonService: RoonService,
    settingsService: SettingsService
  ) {
    this._dialogService = dialogService;
    this._settingsService = settingsService;
    this._roonService = roonService;
    this._$isOneColumn = this._settingsService.isOneColumn();
    this._$isSmallTablet = this._settingsService.isSmallTablet();
    this._$isQueueInModal = computed(() => {
      return this._$isOneColumn() || this._$isSmallTablet();
    });
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
      case ActionType.CUSTOM:
        this.executeCustomAction(action);
        break;
    }
  }

  private openBrowseDialog(action: LoadAction) {
    const config: MatDialogConfig = {
      restoreFocus: false,
      data: {
        path: action.path,
        isRecording: false,
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
    this._dialogService.open(RoonBrowseDialogComponent, config);
  }

  openSettingsDialog() {
    this._dialogService.open(SettingsDialogComponent, {
      ...SettingsDialogConfig,
    });
  }

  private toggleDisplayQueueTrack() {
    if (this._$isQueueInModal()) {
      this._settingsService.saveDisplayQueueTrack(true);
      this._dialogService.open(ZoneQueueDialogComponent, {
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

  private executeCustomAction(action: CustomAction) {
    if (action.actionIndex === undefined) {
      this.openBrowseDialog({
        path: action.path,
        type: ActionType.LOAD,
        button: action.button,
        id: action.id,
      });
    } else {
      const zoneId = this._settingsService.displayedZoneId()();
      this._roonService.loadPath(zoneId, action.path).subscribe((loadResponse) => {
        if (
          loadResponse.list.hint === "action_list" &&
          action.actionIndex !== undefined &&
          action.actionIndex < loadResponse.items.length
        ) {
          const actionItem = loadResponse.items[action.actionIndex];
          this._roonService.navigate(zoneId, action.path.hierarchy, actionItem.item_key).subscribe(() => {
            void this._roonService.browse({
              hierarchy: action.path.hierarchy,
              pop_all: true,
              set_display_offset: true,
            });
          });
        } else {
          void this._roonService.browse({
            hierarchy: action.path.hierarchy,
            pop_all: true,
            set_display_offset: true,
          });
        }
      });
    }
  }
}
