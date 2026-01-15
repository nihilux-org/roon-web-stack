import { ChangeDetectionStrategy, Component, computed, inject, Input, Signal, TemplateRef } from "@angular/core";
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
  AudioInputAction,
  CustomAction,
  DisplayMode,
  LayoutContext,
  LoadAction,
  SettingsDialogConfig,
  SettingsDialogConfigBigFonts,
} from "@model";
import { CommandType } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { FullscreenService } from "@services/fullscreen.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-actions",
  imports: [MatButton, MatIcon, MatIconButton, FullScreenToggleComponent],
  templateUrl: "./zone-actions.component.html",
  styleUrl: "./zone-actions.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneActionsComponent {
  @Input({ required: true }) queueComponentTemplateRef!: TemplateRef<LayoutContext>;
  private readonly _dialogService: DialogService;
  private readonly _settingsService: SettingsService;
  private readonly _roonService: RoonService;
  private readonly _withFullScreen: boolean;
  private readonly _$displayMode: Signal<DisplayMode>;
  private readonly _$isQueueInModal: Signal<boolean>;
  private readonly _$isOneColumn: Signal<boolean>;
  private readonly _$isSmallScreen: Signal<boolean>;
  private readonly _$isSmallTablet: Signal<boolean>;
  private readonly _$isTenFeet: Signal<boolean>;
  readonly $isIconsOnly: Signal<boolean>;
  readonly $actions: Signal<Action[]>;
  readonly $withFullscreen: Signal<boolean>;
  readonly $withSettings: Signal<boolean>;

  constructor() {
    this._dialogService = inject(DialogService);
    this._roonService = inject(RoonService);
    this._settingsService = inject(SettingsService);
    this._withFullScreen = inject(FullscreenService).supportsFullScreen();
    this._$displayMode = this._settingsService.displayMode();
    this._$isOneColumn = this._settingsService.isOneColumn();
    this._$isSmallTablet = this._settingsService.isSmallTablet();
    this._$isQueueInModal = computed(() => this._$isOneColumn() || this._$isSmallTablet() || this._$isTenFeet());
    this._$isSmallScreen = this._settingsService.isSmallScreen();
    this._$isTenFeet = computed(() => this._$displayMode() === DisplayMode.TEN_FEET);
    this.$isIconsOnly = computed(() => this._$isSmallScreen() || this._$isSmallTablet());
    this.$actions = this._settingsService.actions();
    this.$withFullscreen = computed(() => this._withFullScreen && this._$isOneColumn());
    this.$withSettings = computed(() => !this._$isTenFeet());
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
      case ActionType.AUDIO_INPUT:
        this.executeAudioInputAction(action);
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
    const config = this._settingsService.isBigFonts()() ? SettingsDialogConfigBigFonts : SettingsDialogConfig;
    this._dialogService.open(SettingsDialogComponent, {
      ...config,
    });
  }

  private toggleDisplayQueueTrack() {
    if (this._$isQueueInModal()) {
      this._settingsService.saveDisplayQueueTrack(true);
      this._dialogService.open(ZoneQueueDialogComponent, {
        autoFocus: "button.track:first-of-type",
        height: "95svh",
        maxHeight: "95svh",
        width: "95svw",
        maxWidth: "95svw",
        data: {
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

  private executeAudioInputAction(action: AudioInputAction) {
    if (action.audioInputType === "start") {
      const zone_id = this._settingsService.displayedZoneId()();
      this._roonService.command({
        type: CommandType.START_AUDIO_INPUT,
        data: {
          zone_id,
        },
      });
    }
  }
}
