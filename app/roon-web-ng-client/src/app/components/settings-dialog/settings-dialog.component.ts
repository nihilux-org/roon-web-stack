import { ChangeDetectionStrategy, Component, Signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatRadioButton, MatRadioChange, MatRadioGroup } from "@angular/material/radio";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { ChosenTheme, DisplayMode } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-settings-dialog",
  standalone: true,
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatRadioButton,
    MatRadioGroup,
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
    const displayModes: { dm: DisplayMode; label: string }[] = [];
    for (const [dm, label] of this._displayModeLabels) {
      displayModes.push({ dm, label });
    }
    return displayModes;
  }
}
