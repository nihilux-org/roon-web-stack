import { ChangeDetectionStrategy, Component, computed, Inject, Signal } from "@angular/core";
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
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { CustomActionEditorComponent } from "@components/custom-action-editor/custom-action-editor.component";
import { SettingsDialogComponent } from "@components/settings-dialog/settings-dialog.component";
import { CustomAction, SettingsDialogConfig } from "@model/client";
import { CustomActionsService } from "@services/custom-actions.service";
import { RoonService } from "@services/roon.service";

@Component({
  selector: "nr-custom-actions-manager",
  standalone: true,
  imports: [
    CustomActionEditorComponent,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatIconButton,
    MatTabGroup,
    MatTab,
  ],
  templateUrl: "./custom-actions-manager.component.html",
  styleUrl: "./custom-actions-manager.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomActionsManagerComponent {
  private readonly _dialog: MatDialog;
  private readonly _dialogRef: MatDialogRef<CustomActionsManagerComponent>;
  private readonly _customActionsService: CustomActionsService;
  private readonly _roonService: RoonService;
  readonly $isEditing: Signal<boolean>;
  readonly $customActions: Signal<CustomAction[]>;
  readonly $selectedTab: Signal<number>;
  readonly $saveDisabled: Signal<boolean>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { reset: boolean },
    matDialog: MatDialog,
    dialogRef: MatDialogRef<CustomActionsManagerComponent>,
    customActionsService: CustomActionsService,
    roonService: RoonService
  ) {
    this._dialog = matDialog;
    this._dialogRef = dialogRef;
    this._customActionsService = customActionsService;
    this._roonService = roonService;
    this.$isEditing = this._customActionsService.isEditing();
    this.$customActions = computed(() =>
      this._customActionsService
        .customActions()()
        .sort((ca0, ca1) => ca0.button.label.localeCompare(ca1.button.label))
    );
    this.$selectedTab = computed(() => (this.$isEditing() ? 1 : 0));
    this.$saveDisabled = computed(() => !this._customActionsService.isValid()());
    if (data.reset) {
      this._customActionsService.cancelEdition();
    }
  }

  onSave() {
    if (this.$isEditing()) {
      const command = this._customActionsService.saveAction();
      if (command !== undefined) {
        this._roonService.command(command);
        this._customActionsService.cancelEdition();
      }
    } else {
      this._dialog.open(SettingsDialogComponent, {
        ...SettingsDialogConfig,
        data: {
          selectedTab: 1,
        },
      });
      this._dialogRef.close();
    }
  }

  onCancel() {
    this._customActionsService.cancelEdition();
  }

  createCustomAction() {
    this._customActionsService.createAction();
  }

  deleteCustomAction(customActionId: string) {
    const command = this._customActionsService.deleteAction(customActionId);
    this._roonService.command(command);
  }

  editCustomAction(customAction: CustomAction) {
    this._customActionsService.editAction(customAction);
  }
}
