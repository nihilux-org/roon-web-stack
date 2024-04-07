import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatRadioButton, MatRadioChange, MatRadioGroup } from "@angular/material/radio";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { Action, ChosenTheme, DefaultActions, DisplayMode } from "@model/client";
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
export class SettingsDialogComponent {
  private readonly _dialogRef: MatDialogRef<SettingsDialogComponent>;
  private readonly _settingsService: SettingsService;
  private readonly _displayModeLabels: Map<DisplayMode, string>;
  readonly $isSmallScreen: Signal<boolean>;
  readonly $isOneColumn: Signal<boolean>;
  readonly version: string;
  readonly $actions: Signal<Action[]>;
  readonly $availableActions: Signal<Action[]>;
  constructor(
    settingsService: SettingsService,
    roonService: RoonService,
    dialogRef: MatDialogRef<SettingsDialogComponent>
  ) {
    this._dialogRef = dialogRef;
    this._settingsService = settingsService;
    this.$isSmallScreen = this._settingsService.isSmallScreen();
    this.$isOneColumn = this._settingsService.isOneColumn();
    this.version = roonService.version();
    this._displayModeLabels = new Map<DisplayMode, string>();
    this._displayModeLabels.set(DisplayMode.COMPACT, "Compact");
    this._displayModeLabels.set(DisplayMode.WIDE, "Wide");
    this.$actions = this._settingsService.actions();
    this.$availableActions = computed(() => {
      const actions = this.$actions();
      return DefaultActions.filter((a) => !actions.includes(a));
    });
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
    return this._displayModeLabels.get(displayMode) ?? "Unknown display mode 🤷";
  }

  displayModes() {
    const displayModes: { id: DisplayMode; label: string }[] = [];
    for (const [id, label] of this._displayModeLabels) {
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
}
