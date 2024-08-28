import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, effect, EffectRef, Inject, OnDestroy, Signal } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatRadioButton, MatRadioChange, MatRadioGroup } from "@angular/material/radio";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { CustomActionsManagerComponent } from "@components/custom-actions-manager/custom-actions-manager.component";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { Action, ChosenTheme, CustomActionsManagerDialogConfig, DisplayMode } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-settings-dialog",
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatRadioButton,
    MatRadioGroup,
    MatTab,
    MatTabGroup,
    ZoneSelectorComponent,
  ],
  templateUrl: "./settings-dialog.component.html",
  styleUrl: "./settings-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent implements OnDestroy {
  private readonly _dialogRef: MatDialogRef<SettingsDialogComponent>;
  private readonly _settingsService: SettingsService;
  readonly displayModeLabels: Map<DisplayMode, string>;
  private readonly _dialog: MatDialog;
  private readonly _layoutChangeEffect: EffectRef;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $isOneColumn: Signal<boolean>;
  readonly $actions: Signal<Action[]>;
  readonly $availableActions: Signal<Action[]>;
  readonly $layoutClass: Signal<string>;
  readonly version: string;
  readonly selectedTab: number;
  constructor(
    @Inject(MAT_DIALOG_DATA) data: { selectedTab: number },
    roonService: RoonService,
    settingsService: SettingsService,
    dialogRef: MatDialogRef<SettingsDialogComponent>,
    matDialog: MatDialog
  ) {
    this._dialogRef = dialogRef;
    this._settingsService = settingsService;
    this.displayModeLabels = new Map<DisplayMode, string>();
    this.displayModeLabels.set(DisplayMode.COMPACT, "Compact");
    this.displayModeLabels.set(DisplayMode.WIDE, "Wide");
    this._layoutChangeEffect = effect(() => {
      for (const displayModeCLass of this._settingsService.displayModeClasses()) {
        this._dialogRef.removePanelClass(displayModeCLass);
      }
      this._dialogRef.addPanelClass(this.$layoutClass());
    });
    this._dialog = matDialog;
    this.$actions = this._settingsService.actions();
    this.$availableActions = this._settingsService.availableActions();
    this.$isSmallScreen = this._settingsService.isSmallScreen();
    this.$isOneColumn = this._settingsService.isOneColumn();
    this.$layoutClass = this._settingsService.displayModeClass();
    this.selectedTab = data.selectedTab;
    this.version = roonService.version();
  }

  ngOnDestroy(): void {
    this._layoutChangeEffect.destroy();
  }

  chosenTheme() {
    return this._settingsService.chosenTheme();
  }

  setChosenTheme(change: MatRadioChange) {
    this._settingsService.saveChosenTheme(change.value as ChosenTheme);
  }

  displayMode() {
    return this._settingsService.displayMode();
  }

  setDisplayMode(displayMode: DisplayMode) {
    this._settingsService.saveDisplayMode(displayMode);
  }

  onSave() {
    this._dialogRef.close();
  }

  onReload() {
    this.onSave();
    window.location.reload();
  }

  displayModeLabel(displayMode: DisplayMode) {
    return this.displayModeLabels.get(displayMode) ?? "Unknown display mode 🤷";
  }

  displayModes() {
    const displayModes: { id: DisplayMode; label: string }[] = [];
    for (const [id, label] of this.displayModeLabels) {
      displayModes.push({ id, label });
    }
    return displayModes;
  }

  addAction(action: Action) {
    const actions = this.$actions();
    actions.push(action);
    this._settingsService.saveActions(actions);
  }

  removeAction(action: Action) {
    const actions = this.$actions();
    const index = actions.indexOf(action);
    if (index >= 0) {
      actions.splice(index, 1);
    }
    this._settingsService.saveActions(actions);
  }

  onActionsReordered(dropEvent: CdkDragDrop<Action[]>) {
    const actions = this.$actions();
    moveItemInArray(actions, dropEvent.previousIndex, dropEvent.currentIndex);
    this._settingsService.saveActions(actions);
  }

  openCustomActionsManager() {
    this._dialog.open(CustomActionsManagerComponent, {
      ...CustomActionsManagerDialogConfig,
      data: {
        reset: true,
      },
      panelClass: ["nr-dialog-custom", this.$layoutClass()],
    });
    this._dialogRef.close();
  }
}
