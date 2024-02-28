import { ChangeDetectionStrategy, Component, Signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatRadioButton, MatRadioChange, MatRadioGroup } from "@angular/material/radio";
import { ZoneSelectorComponent } from "@components/zone-selector/zone-selector.component";
import { ChosenTheme, DisplayMode } from "@model/client";
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
  readonly $isSmallScreen: Signal<boolean>;
  constructor(settingsService: SettingsService, dialogRef: MatDialogRef<SettingsDialogComponent>) {
    this._dialogRef = dialogRef;
    this._settingsService = settingsService;
    this.$isSmallScreen = this._settingsService.isSmallScreen();
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

  setDisplayMode(change: MatRadioChange) {
    this._settingsService.saveDisplayMode(change.value as DisplayMode);
  }

  onSave() {
    this._dialogRef.close();
  }
}
