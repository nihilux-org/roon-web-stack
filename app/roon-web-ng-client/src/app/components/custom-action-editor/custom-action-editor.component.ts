import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { CustomActionRecorderComponent } from "@components/custom-action-recorder/custom-action-recorder.component";
import { CustomActionsManagerComponent } from "@components/custom-actions-manager/custom-actions-manager.component";
import { RoonApiBrowseHierarchy } from "@model";
import { CustomActionsManagerDialogConfig } from "@model/client";
import { CustomActionsService } from "@services/custom-actions.service";

@Component({
  selector: "nr-custom-action-editor",
  standalone: true,
  imports: [FormsModule, MatButton, MatFormFieldModule, MatIcon, MatInput, MatLabel],
  templateUrl: "./custom-action-editor.component.html",
  styleUrl: "./custom-action-editor.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomActionEditorComponent {
  private readonly _dialog: MatDialog;
  private readonly _dialogRef: MatDialogRef<CustomActionsManagerComponent>;
  private readonly _customActionsService: CustomActionsService;
  readonly $label: Signal<string>;
  readonly $icon: Signal<string>;
  readonly $hierarchy: Signal<RoonApiBrowseHierarchy | undefined>;
  readonly $path: Signal<string[]>;
  readonly $actionIndex: Signal<number | undefined>;

  constructor(
    matDialog: MatDialog,
    dialogRef: MatDialogRef<CustomActionsManagerComponent>,
    customActionService: CustomActionsService
  ) {
    this._dialog = matDialog;
    this._dialogRef = dialogRef;
    this._customActionsService = customActionService;
    this.$label = computed(() => this._customActionsService.label()() ?? "");
    this.$icon = computed(() => this._customActionsService.icon()() ?? "");
    this.$hierarchy = this._customActionsService.hierarchy();
    this.$path = this._customActionsService.path();
    this.$actionIndex = this._customActionsService.actionIndex();
  }

  openActionRecorder() {
    this._dialog.open(CustomActionRecorderComponent, CustomActionsManagerDialogConfig);
    this._dialogRef.close();
  }

  saveLabel(label: string) {
    this._customActionsService.saveLabel(label);
  }

  saveIcon(icon: string) {
    this._customActionsService.saveIcon(icon);
  }
}
